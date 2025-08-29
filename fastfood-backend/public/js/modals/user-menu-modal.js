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

    setupButtonListeners(modalEl);

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
}


function setupButtonListeners(modalEl) {

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);


    modalEl.querySelector('#btnManageAccount').addEventListener('click', () => {
        modalInstance.hide();
        window.location.assign('/user/edit');
    });

    modalEl.querySelector('#btnPreferences').addEventListener('click', () => {
        modalInstance.hide();
        window.location.assign('/user/preferences');
    });

    modalEl.querySelector('#btnUserOrders').addEventListener('click', () => {
        modalInstance.hide();
        window.location.assign('/customer/orders');
    });

    modalEl.querySelector('#btnLogout').addEventListener('click', async () => {
        try {
            await logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error during logout:', error);
            // You might want to show an error notification here
        } finally {
            modalInstance.hide();
        }
    });
}

async function logout() {
    alert('Logging out...');
    //todo 
}
