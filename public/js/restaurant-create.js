import { setImage, hideAlert, showAlert} from '/js/modules/utils.js';
import { authFetch } from '/js/modules/auth.js';
import { getCurrentUserInfo } from "/js/modules/api.js";



export async function init() {
    const root = document;
    const userInfo = await getCurrentUserInfo();

    renderCurrentRestaurantData(root, userInfo);

    const btnSave = root.getElementById('btnSaveProfile');
    const alertBox = document.getElementById('createRestAlert');
    hideAlert(alertBox);

    btnSave?.addEventListener('click', async () => {

        try {
            const payload = collectRestaurantFromForm(root);
            await createRestaurant(payload);
            window.location.href = "/owner/restaurant";
        } catch (err) {
            console.error(err);
            showAlert(alertBox, err?.message || 'Failed to save changes. Please try again.');
        }
    });

}

function renderCurrentRestaurantData(root, userInfo = {}) {

    setImage('restaurantCover', null, 'Restaurant Cover');
    setText('restaurantOwnerUsername', userInfo.username);
    setText('restaurantOwnerEmail', userInfo.email ?? '');

    function setText(id, value) {
        const node = root.getElementById(id);
        if (node) node.value = value?.trim() || '';
    }

    renderHoursEditor(root, []);
}

function renderHoursEditor(root, hours) {
    const container = root.getElementById('hoursList');
    if (!container) return;

    const DAYS = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];

    const data = normalizeHours(hours, DAYS);

    container.innerHTML = data.map((h, i) => {
        const openVal = h.open ?? '';
        const closeVal = h.close ?? '';
        return `
        <div class="d-flex align-items-center mb-2" data-day-index="${i}">
            <span class="text-muted small me-2 restaurant-hours-entry">${DAYS[i]}</span>
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


function collectRestaurantFromForm(root) {

    const coverImg = root.getElementById('restaurantCover');
    const name = root.getElementById('restaurantNameInput')?.value?.trim() ?? '';
    const address = root.getElementById('restaurantAddress')?.value?.trim() ?? '';
    const phone = root.getElementById('restaurantPhone')?.value?.trim() ?? '';
    const vat = root.getElementById('restaurantVat')?.value?.trim() ?? '';

    const hours = readHours(root);

    return {
        name,
        address,
        phone,
        vat,
        coverUrl: coverImg?.src ?? '',
        hours
    };
}

function readHours(root) {
    const container = root.getElementById('hoursList');
    if (!container) return [];
    return [...container.querySelectorAll('[data-day-index]')].map(row => {
        const dayIdx = Number(row.dataset.dayIndex);
        const dayName = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIdx];
        const open = row.querySelector('[data-role="open"]').value || null;
        const close = row.querySelector('[data-role="close"]').value || null;
        return { day: dayName, open, close};
    }).filter(h => h.day && (h.open || h.close));
}


async function createRestaurant(payload) {
    const res = await authFetch(`/api/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
        let errMsg = 'Failed to create restaurant';
        const errorData = await res.json();
        errMsg = errorData?.message || errMsg;
        throw new Error(errMsg);
    }

    return res.json();
}
