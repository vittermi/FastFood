import { ensureAccessToken, setAccessToken } from '/js/modules/auth.js';
import { hideAlert, showAlert, redirectUserHome} from '/js/modules/utils.js';




document.addEventListener('DOMContentLoaded', async () => {

    const token = await ensureAccessToken();
    if (token) return redirectUserHome();

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
            showAlert(alertPlaceholder, 'Email and password are required.');
            return;
        }

        //todo email format validation 

        submitBtn.disabled = true;
        hideAlert(alertPlaceholder);

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
            if (!accessToken) throw new Error('Authentication failed');

            setAccessToken(accessToken);
            redirectUserHome();

          
        } catch (err) {
            console.error(err);
            showAlert(alertPlaceholder, err.message || 'Unexpected error – please try again.');
        } finally {
            submitBtn.disabled = false;
            passwordInput.value = '';
        }
    });

});
