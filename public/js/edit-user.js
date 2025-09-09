import { authFetch, logoutAndRedirect } from '/js/modules/auth.js';
import { showAlert, hideAlert } from '/js/modules/utils.js';
import { getCurrentUserInfo } from '/js/modules/api.js';
import { showUserMenuModal } from '/js/modals/user-menu-modal.js';


document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('editUserForm');
    const alertBox = document.getElementById('editUserAlert');
    const btnEditUser = document.getElementById('btnEditUser');
    const btnDeleteUser = document.getElementById('btnDeleteUser');
    const userTypeSelect = document.getElementById('userTypeSelect');

    const userData = await getCurrentUserInfo();
    if (userData) {
        document.getElementById('usernameInput').value = userData.username || '';
        document.getElementById('emailInput').value = userData.email || '';
        userTypeSelect.value = userData.userType || '';
    }

    document.getElementById('menuButton').addEventListener('click', () => {
        showUserMenuModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(alertBox);

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const payload = {
            email: document.getElementById('emailInput').value.trim(),
            currentPassword: document.getElementById('currentPasswordInput').value,
            password: document.getElementById('passwordInput').value,
        };

        try {
            btnEditUser.disabled = true;
            const result = await updateUserInfo(payload, userData.id);

            // todo aggiungi logout?

            window.location.href = '/login.html'; // login fa in automatico redirect se esiste token
            console.log('Updated user:', result);
        } catch (err) {
            showAlert(alertBox, err?.message || 'Update failed. Please try again.');
        } finally {
            btnEditUser.disabled = false;
        }
    });

    btnDeleteUser.addEventListener('click', async (e) => {
        e.preventDefault();
        hideAlert(alertBox);

        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            btnDeleteUser.disabled = true;
            await deleteUser(userData.id);

            logoutAndRedirect();
            console.log('User deleted');
        } catch (err) {
            showAlert(alertBox, err?.message || 'Delete failed. Please try again.');
        } finally {
            btnDeleteUser.disabled = false;
        }

    });

    form.addEventListener('reset', () => {
        form.classList.remove('was-validated');
        hideAlert(alertBox);
    });
});


async function deleteUser(userId) {
    const response = await authFetch(`/api/users/${userId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Delete failed');
    }

    return true;
}

async function updateUserInfo(payload, userId) {
    const response = await authFetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
    }

    return await response.json();
}