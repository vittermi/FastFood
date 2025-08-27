import { getDecodedJWT, authFetch } from './auth.js';

export async function getRestaurantId() {
    const payload = getDecodedJWT();
    const userID = payload.id;

    const restaurantResponse = await authFetch(`/api/restaurants/?owner=${userID}`);

    if (!restaurantResponse.ok) throw new Error('Failed to fetch restaurant');

    const restaurantData = await restaurantResponse.json();
    if (!restaurantData.length) throw new Error('No restaurant found for this user');

    return restaurantData[0]._id;
}

export function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(null, args), ms);
    };
}

export function setImage(id, src, alt = 'Restaurant Cover') {
    const imageNode = document.getElementById(id);
    if (!imageNode) return;
    imageNode.alt = alt;
    imageNode.src = src ? src : '../img/placeholder.jpg';
}

export function showAlert(node, msg) {
    if (!node) return;
    node.textContent = msg;
    node.classList.remove('d-none');
}

export function hideAlert(node) {
    if (!node) return;
    node.textContent = '';
    node.classList.add('d-none');
}