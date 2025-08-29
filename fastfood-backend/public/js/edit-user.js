import { authFetch } from './auth.js';
import { showAlert, hideAlert } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('editUserForm');
    const alertBox = document.getElementById('editUserAlert');
    const btnEditUser = document.getElementById('btnEditUser');
    const userTypeSelect = document.getElementById('userTypeSelect');

    const types = await getAvailableUserTypes();
    populateUserTypes(userTypeSelect, types);

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
            const result = await updateUserInfo(payload);

            // todo aggiungi logout?

            window.location.href = '/login.html'; // login fa in automatico redirect se esiste token
            console.log('Updated user:', result);
        } catch (err) {
            showAlert(alertBox, err?.message || 'Update failed. Please try again.');
        } finally {
            btnEditUser.disabled = false;
        }
    });

    form.addEventListener('reset', () => {
        form.classList.remove('was-validated');
        hideAlert(alertBox);
    });
});

function populateUserTypes(selectEl, types) {
    for (const t of types) {
        const opt = document.createElement('option');
        opt.value = t.value;
        opt.textContent = t.label;
        selectEl.appendChild(opt);
    }
}

// Mock function to simulate fetching user types from an API
async function getAvailableUserTypes() {
    return [
        { value: 'restaurateur', label: 'Restaurateur' },
        { value: 'customer', label: 'Customer' },
    ];
}

async function updateUserInfo(payload) {
    const response = await authFetch('/api/users', {
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