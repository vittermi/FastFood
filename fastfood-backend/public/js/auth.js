export function getAccessToken() {
    return sessionStorage.getItem('accessToken');
}

export function setAccessToken(token) {
    sessionStorage.setItem('accessToken', token);
}

async function refreshAccessToken() {
    const res = await fetch('/api/auth/refresh-token', { method: 'POST', credentials: 'include' });
    if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        return data.accessToken;
    } else {
        logoutAndRedirect();
        throw new Error('Session expired, please log in again.');
    }
}

function logoutAndRedirect() {
    sessionStorage.removeItem('accessToken');
    window.location.href = '/login.html';
}

export async function authFetch(url, options = {}) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${getAccessToken()}`;

    let response = await fetch(url, options);

    if (response.status === 403) {
        try {
            await refreshAccessToken();
            options.headers['Authorization'] = `Bearer ${getAccessToken()}`;
            response = await fetch(url, options); // Retry original request
        } catch {
            logoutAndRedirect();
            throw new Error('Session expired, please log in again.');
        }
    }
    return response;
}

export function getDecodedJWT() {

    const token = getAccessToken();

    if (!token) {
        logoutAndRedirect();
        throw new Error('Not authenticated, please log in.');
    }

    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return {};
    }
}

export async function ensureAccessToken() {
    const existing = getAccessToken();
    if (existing) return existing; 
    try {
        const res = await fetch('/api/auth/refresh-token', { method: 'POST', credentials: 'include' });
        if (!res.ok) return null;
        const { accessToken } = await res.json();
        setAccessToken(accessToken);
        return accessToken;
    } catch {
        return null;
    }
}


