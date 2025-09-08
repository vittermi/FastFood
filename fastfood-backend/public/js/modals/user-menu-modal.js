import { logoutAndRedirect } from "/js/modules/auth.js";
import { getCurrentUserInfo } from "/js/modules/api.js";

const PARTIAL_URL = '/partials/modals/userMenu.html';

export async function showUserMenuModal() {

    async function ensureLoaded() {
        if (document.getElementById('userMenuModal')) return;

        const res = await fetch(PARTIAL_URL);
        if (!res.ok) throw new Error(`Failed to load ${PARTIAL_URL}`);
        document.body.insertAdjacentHTML('beforeend', await res.text());
    }

    await ensureLoaded();

    const modalEl = document.getElementById('userMenuModal');

    await handleButtonVisibility();
    setupButtonListeners(modalEl);

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
}

async function handleButtonVisibility() {
    try {
        const user = await getCurrentUserInfo();
        const userType = user.userType;

        const buttons = document.querySelectorAll('[data-visible-for]');

        buttons.forEach(button => {
            const visibleFor = button.getAttribute('data-visible-for');
            if (!(visibleFor === 'both') && !(visibleFor === userType)) button.classList.add('d-none');
        });
    } catch (error) {
        console.error('Failed to handle button visibility:', error);
    }
}


function setupButtonListeners(modalEl) {

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);


    modalEl.querySelector('#btnManageAccount').addEventListener('click', () => {
        modalInstance.hide();
        window.location.assign('/user/edit');
    });

    modalEl.querySelector('#btnPreferences').addEventListener('click', () => {
        modalInstance.hide();
        window.location.assign('/customer/preferences');
    });

    modalEl.querySelector('#btnUserOrders').addEventListener('click', () => {
        modalInstance.hide();
        window.location.assign('/customer/orders');
    });

    modalEl.querySelector('#btnLogout').addEventListener('click', async () => {
        try {
            await logoutAndRedirect();
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            modalInstance.hide();
        }
    });
}


