import { authFetch, ensureAccessToken } from './auth.js';
import { showAlert, hideAlert } from './utils.js';
import { redirectUserHome } from './utils.js';



document.addEventListener('DOMContentLoaded', async () => {

    const token = await ensureAccessToken();
    if (token) return redirectUserHome();

    const form = document.getElementById('registerForm');
    const alertBox = document.getElementById('registerAlert');
    const btnRegister = document.getElementById('btnRegister');
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
            username: document.getElementById('usernameInput').value.trim(),
            email: document.getElementById('emailInput').value.trim(),
            password: document.getElementById('passwordInput').value,
            userType: document.getElementById('userTypeSelect').value
        };

        try {
            btnRegister.disabled = true;
            const result = await registerUser(payload);

            window.location.href = '/login.html';
            console.log('Registered:', result);
        } catch (err) {
            showAlert(alertBox, err?.message || 'Registration failed. Please try again.');
        } finally {
            btnRegister.disabled = false;
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

// todo ritorna da api
async function getAvailableUserTypes() {
    return [
        { value: 'restaurateur', label: 'Restaurateur' },
        { value: 'customer', label: 'Customer' },
    ];
}

async function registerUser(payload) {

    const response = await authFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
    }

    return await response.json();
}
