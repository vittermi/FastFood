import { authFetch } from '../auth.js';


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

export async function getCurrentUserInfo() {
    const response = await authFetch('/api/users/me');
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user data');
    }
    return await response.json();
}




