import { authFetch } from './auth.js';
import { getRestaurantId } from './utils.js';
import { debounce } from './utils.js';

let dishes = [];
let filtered = [];


async function init() {
    const searchInput = document.getElementById('dishSearch');
    const clearBtn = document.getElementById('clearDishSearch');

    console.log('dishes init');
    await loadDishes();
    renderDishCards();

    searchInput.addEventListener('input', debounce(async () => {
        const q = searchInput.value.trim();
        await loadDishes(q);
        renderDishCards();
    }, 300));

    clearBtn.addEventListener('click', async () => {
        searchInput.value = '';
        await loadDishes();
        renderDishCards();
    });

    //add renderDishCards after modal ok

    await initModals();
}


async function loadDishes(query = '') {
    try {
        const restaurantId = await getRestaurantId();

        const url = query
            ? `/api/restaurants/${restaurantId}/dishes?q=${encodeURIComponent(query)}`
            : `/api/restaurants/${restaurantId}/dishes`;
        const res = await authFetch(url);
        dishes = await res.json();
        filtered = dishes;      // server already filtered when q present
    } catch (err) {
        console.error(err);
        document.getElementById('dish-cards-list').innerHTML =
            `<div class="alert alert-danger">
            ${err.message || 'Failed to load dishes'}
        </div>`;
    }
}


function renderDishCards() {
    const listEl = document.getElementById('dish-cards-list');

    listEl.innerHTML = '';
    if (!filtered.length) {
        listEl.innerHTML = '<p class="text-muted">No dishes found.</p>';
        return;
    }
    filtered.forEach(dish => listEl.appendChild(createDishCard(dish)));
}


function createDishCard(dish) {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4';
    col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <img src="${dish.imageUrl || '/img/placeholder.jpg'}" class="card-img-top object-fit-cover" alt="${dish.name}">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title mb-1">${dish.name}</h5>
        <p class="card-text text-muted small mb-2">${dish.category}</p>
        <div class="mb-3 fw-bold">€${dish.price.toFixed(2)}</div>
        <div class="mt-auto">
          <button class="btn btn-outline-secondary w-100 edit-dish-btn" data-id="${dish._id}">
            <i class="bi bi-pencil me-1"></i> Edit
          </button>
        </div>
      </div>
    </div>`;
    return col;
}


async function initModals() {

    const createBtn = document.getElementById('createDishBtn');
    const selectBtn = document.getElementById('selectDishBtn');

    const [createModal, selectModal] = await Promise.all([
        import('/js/modals/create-dish-modal.js'),
        import('/js/modals/select-dish-modal.js')
    ]);

    await Promise.all([
        createModal.ensureLoaded(),  
        selectModal.ensureLoaded()   
    ]);

    selectBtn.addEventListener('click', async () => {
        try {
            const template = await selectModal.open();
            const dishData = await createModal.open({ prefill: template });
            await loadDishes();
            renderDishCards();
        } catch (e) {
            // user cancelled selection or creation
        }
    });

    createBtn.addEventListener('click', async () => {
        try {
            const dishData = await createModal.open({});
            await loadDishes();
            renderDishCards();
        } catch (e) {
            // user cancelled or modal closed
        }
    });
}


async function createDish(dishData) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.price) data.price = parseFloat(data.price);

    ['ingredients', 'tags', 'allergens'].forEach(type => {
        const chips = [
            ...document.querySelectorAll(`#${type}ChipBox .chip`)
        ].map(chip => chip.dataset.value)
            .filter(val => !selectedDishTemplate[type].includes(val));
        data[type] = chips;
    });

    try {
        await authFetch(`/api/restaurants/${restId}/dishes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        bsModal.hide();
        await loadDishes();
        renderDishCards();
    } catch (err) {
        alert(err.message || 'Failed to create dish');
    }
}

export { init }