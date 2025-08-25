import { setImage } from './utils.js';

export async function init(props = {}) {
    const root = document;
    const { restaurantData } = props;

    renderCurrentRestaurantData(root, restaurantData);

    const btnSave = root.getElementById('btnSaveProfile');
    const btnCancel = root.getElementById('btnCancelEdit');

    btnSave?.addEventListener('click', async () => {
        try {
            const payload = collectRestaurantFromForm(root, restaurantData?.id);
            const saved = await updateRestaurant(payload); 
            // on success (or even optimistic), go back to view
            window.loadSection('restaurant-view', { restaurant: saved ?? payload });
        } catch (err) {
            console.error('Failed to update restaurant', err);
            alert('Failed to save changes');
        }
    });

    btnCancel?.addEventListener('click', () => {
        window.loadSection('restaurant-view', { restaurantData });
    });
}

function renderCurrentRestaurantData(root, restaurantData = {}) {

    setImage('restaurantCover', restaurantData.imageUrl, 'Restaurant Cover');
    setText('restaurantNameInput', restaurantData.name);
    setText('restaurantOwnerUsername', restaurantData.owner?.username);
    setText('restaurantOwnerEmail', restaurantData.ownerEmail ?? restaurantData.owner?.email ?? '');
    setText('restaurantAddress', restaurantData.address);
    setText('restaurantPhone', restaurantData.phone);
    setText('restaurantVat', restaurantData.vat);

    function setText(id, value) {
        const node = root.getElementById(id);
        if (node) node.value = value?.trim() || '';
    }

    renderHoursEditor(root, restaurantData.openingHours);
}

function renderHoursEditor(root, hours) {
    const container = root.getElementById('hoursList');
    if (!container) return;

    const DAYS = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    const data = normalizeHours(hours, DAYS);

    container.innerHTML = data.map((h, i) => {
        const openVal = h.open ?? '';
        const closeVal = h.close ?? '';
        return `
        <div class="d-flex align-items-center mb-2" data-day-index="${i}">
            <span class="text-muted small me-2" style="min-width: 80px;">${DAYS[i]}</span>
            <input type="time" class="form-control w-auto" data-role="open" value="${openVal}">
            <span class="mx-1">–</span>
            <input type="time" class="form-control w-auto" data-role="close" value="${closeVal}">
        </div>
        `;


    }).join('');
}

function normalizeHours(hours, days) {
    const arr = Array.isArray(hours) ? hours.slice(0) : [];
    const mapByDayName = new Map(
        arr
            .filter(Boolean)
            .map(h => [String(h.day ?? h.name ?? '').toLowerCase(), h])
    );
    return days.map(name => {
        const h = mapByDayName.get(name.toLowerCase()) || {};
        return {
            day: name,
            open: h.open ?? '',
            close: h.close ?? ''        
        };
    });
}

function collectRestaurantFromForm(root, id) {
    const coverImg = root.getElementById('restaurantCover');
    const name = root.getElementById('restaurantNameInput')?.value?.trim() ?? '';
    const address = root.getElementById('restaurantAddress')?.value?.trim() ?? '';
    const phone = root.getElementById('restaurantPhone')?.value?.trim() ?? '';
    const vat = root.getElementById('restaurantVat')?.value?.trim() ?? '';

    const openingHours = readHours(root);

    return {
        id,
        name,
        address,
        phone,
        vat,
        coverUrl: coverImg?.src ?? '',
        openingHours
    };
}

function readHours(root) {
    const container = root.getElementById('hoursList');
    if (!container) return [];
    return [...container.querySelectorAll('[data-day-index]')].map(row => {
        const dayIdx = Number(row.dataset.dayIndex);
        const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIdx];
        const open = row.querySelector('[data-role="open"]').value || null;
        const close = row.querySelector('[data-role="close"]').value || null;
        return { day: dayName, open, close, closed };
    });
}


async function updateRestaurant(payload) {
    // TODO: call your PUT/PATCH endpoint with `payload` and return the saved object
    // e.g., const res = await authFetch('/api/restaurant', { method:'PUT', body: JSON.stringify(payload) });
    // return await res.json();
    return payload;
}
