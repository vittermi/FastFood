import { setAccessToken, decodeJWT } from './auth.js';


document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');

    const submitBtn = form.querySelector('button[type="submit"]');

    const alertPlaceholder = document.createElement('div');
    alertPlaceholder.className = 'alert alert-danger d-none';
    alertPlaceholder.setAttribute('role', 'alert');
    form.prepend(alertPlaceholder);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            showError('Email and password are required.');
            return;
        }

        //todo email format validation 

        submitBtn.disabled = true;
        hideError();

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            if (!res.ok) {
                let message = res.statusText;
                try {
                    const errBody = await res.json();
                    message = errBody.message || message;
                } catch (_) {/* ignore */ }
                throw new Error(message || 'Login failed');
            }

            const { accessToken } = await res.json();
            if (!accessToken) throw new Error('Server did not return an access token');

            setAccessToken(accessToken);

            const payload = decodeJWT(accessToken);

            if (payload.userType === 'restaurateur') window.location.assign('/owner/restaurants');
            else window.location.assign('/restaurants');
        } catch (err) {
            console.error(err);
            showError(err.message || 'Unexpected error – please try again.');
        } finally {
            submitBtn.disabled = false;
            passwordInput.value = '';
        }
    });

    function showError(msg) {
        alertPlaceholder.textContent = msg;
        alertPlaceholder.classList.remove('d-none');
    }

    function hideError() {
        alertPlaceholder.classList.add('d-none');
    }
});
