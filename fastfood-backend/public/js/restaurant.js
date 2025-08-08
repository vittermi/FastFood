import { getRestaurantId } from './utils.js';
import { authFetch } from './auth.js';


async function init() {
    try {
        const id = await getRestaurantId();
        const restaurantData = await fetchRestaurantData(id);
        renderRestaurant(restaurantData);

        handleEditProfileClick(restaurantData);
    } catch (err) {
        console.error(err);
    }
}


async function fetchRestaurantData(restaurantId) {
    const res = await authFetch(`/api/restaurants/${restaurantId}`);
    if (!res.ok) throw new Error('Failed to fetch restaurant');

    return res.json();
}

function renderRestaurant(restaurant) {

    document.title = restaurant?.name ? `${restaurant.name} – Profile` : 'Restaurant Profile';
    setText('restaurantOwnerEmail', restaurant?.owner?.email);
    setText('restaurantOwnerUsername', restaurant?.owner?.username);
    setText('restaurantName', restaurant?.name || 'Restaurant');
    setImage('restaurantCover', restaurant?.imageUrl, restaurant?.name || 'Restaurant Cover');
    setText('restaurantAddress', restaurant?.address);
    setText('restaurantPhone', restaurant?.phone);
    setText('restaurantVat', restaurant?.vat);

    renderHours(restaurant?.hours || []);
}

function setText(id, value, fallback = '—') {
    const node = document.getElementById(id);
    if (node) node.textContent = value?.trim?.() || fallback;
}

function setImage(id, src, alt = 'Restaurant Cover') {
    const imageNode = document.getElementById(id);
    if (!imageNode) return;
    imageNode.alt = alt;
    imageNode.src = src ? src : '../img/placeholder.jpg';
}

function renderHours(hoursArray = []) {

    const DAY_ORDER = [
        'monday', 'tuesday', 'wednesday',
        'thursday', 'friday', 'saturday', 'sunday'
    ];

    const container = document.getElementById('hoursList');
    if (!container) return;

    container.innerHTML = '';

    const dailyOpeningHours = {};
    for (const h of hoursArray) if (h?.day) dailyOpeningHours[h.day] = h;


    DAY_ORDER.forEach(day => {
        const label = capitalizeDay(day);
        const value = formatHoursEntry(dailyOpeningHours[day]);

        const left = document.createElement('dd');
        left.className = 'col-6 col-md-5 offset-1 offset-md-2 text-muted small mb-0';
        left.textContent = label;

        const right = document.createElement('dd');
        right.className = 'col-5 col-md-5 mb-1';
        right.textContent = value;

        container.appendChild(left);
        container.appendChild(right);
    });
}

function capitalizeDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatHoursEntry(entry) {
    if (!entry || !entry.open || !entry.close) return 'Closed';
    return `${entry.open}–${entry.close}`;
}

function handleEditProfileClick(restaurantData) {
    const editProfileBtn = document.getElementById('btnEditProfile');
    editProfileBtn?.addEventListener('click', async () => {
        const mainEl = document.getElementById('main-content');
        const htmlResponse = await fetch('/partials/restaurant-edit.html');
        mainEl.innerHTML = await htmlResponse.text();

        const module = await import(`/js/restaurant-edit.js`);
        if (module.init) await module.init();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}




export { init };

