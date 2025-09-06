import { getRestaurantId } from './utils.js';
import { authFetch } from './auth.js';
import { setImage } from './utils.js';


export async function init() {
    try {
        const id = await getRestaurantId();
        const restaurantData = await fetchRestaurantData(id);
        renderRestaurant(restaurantData);

        document.getElementById('btnEditProfile')?.addEventListener('click', () =>
            window.loadSection('restaurant-edit', { restaurantData }));
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

    setImage('restaurantCover', restaurant?.imageUrl, restaurant?.name || 'Restaurant Cover');
    setText('restaurantOwnerEmail', restaurant?.owner?.email);
    setText('restaurantOwnerUsername', restaurant?.owner?.username);
    setText('restaurantName', restaurant?.name || 'Restaurant');
    setText('restaurantAddress', restaurant?.address);
    setText('restaurantPhone', restaurant?.phone);
    setText('restaurantVat', restaurant?.vat);

    renderHours(restaurant?.hours || []);

    function setText(id, value, fallback = '—') {
        const node = document.getElementById(id);
        if (node) node.textContent = value?.trim?.() || fallback;
    }

    function renderHours(hoursArray = []) {

        const DAYS = [
            'monday', 'tuesday', 'wednesday',
            'thursday', 'friday', 'saturday', 'sunday'
        ];

        const container = document.getElementById('hoursList');
        if (!container) return;

        container.innerHTML = '';

        const dailyOpeningHours = {};
        for (const h of hoursArray) if (h?.day) dailyOpeningHours[h.day] = h;


        DAYS.forEach(day => {
            const label = capitalizeDay(day);
            const value = formatHoursEntry(dailyOpeningHours[day]);

            const row = document.createElement('div');
            row.className = 'd-flex align-items-center mb-2 restaurant-hours-entry';

            const left = document.createElement('span');
            left.className = 'text-muted small me-2';
            left.textContent = label;


            const right = document.createElement('span');
            right.textContent = value;

            row.appendChild(left);
            row.appendChild(right);

            container.appendChild(row);
        });

        function capitalizeDay(day) {
            return day.charAt(0).toUpperCase() + day.slice(1);
        }

        function formatHoursEntry(entry) {
            if (!entry || !entry.open || !entry.close) return 'Closed';
            return `${entry.open} – ${entry.close}`;
        }
    }
}
