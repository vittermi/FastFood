import { authFetch } from './auth.js';
import { getRestaurantId } from './utils.js';
import { debounce } from './utils.js';

let dishes = [];
let filtered = [];


export async function init() {
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
        filtered = dishes;
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
      <img src="${dish.photo || '/img/placeholder.jpg'}" class="card-img-top object-fit-cover" alt="${dish.name}">
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

            await createDish(dishData, template);
            await loadDishes();
            renderDishCards();
        } catch (e) {
            // user cancelled selection or creation
        }
    });

    createBtn.addEventListener('click', async () => {
        try {
            const dishData = await createModal.open({});
            await createDish(dishData);
            await loadDishes();
            renderDishCards();
        } catch (e) {
            // user cancelled or modal closed
        }
    });


    document.getElementById('dish-cards-list').addEventListener('click', async (e) => {
        const btn = e.target.closest('.edit-dish-btn');
        if (!btn) return;
        const dishId = btn.dataset.id;
       
        try {
            const editModal = await import('/js/modals/edit-dish-modal.js');
            const dish = dishes.find(d => d._id === dishId);
            const updated = await editModal.open({ initialData: dish });
            if (updated.action === 'edit') await updateDish(updated);
            else if (updated.action === 'delete') await deleteDish(updated);

            await loadDishes();
            renderDishCards();
        } catch (err) {
            // user cancelled or modal closed
        }
    });
}



async function createDish(dishData, selectedDishTemplate = {}) {
    if (dishData.price) dishData.price = parseFloat(dishData.price);

    ['ingredients', 'tags', 'allergens'].forEach(type => {
            const submittedItems = Array.isArray(dishData[type]) ? dishData[type] : [];
            const itemsInTemplateDish = Array.isArray(selectedDishTemplate[type]) ? selectedDishTemplate[type] : [];
            dishData[type] = submittedItems.filter(item => !itemsInTemplateDish.includes(item));
    });

    dishData.baseDish = selectedDishTemplate?._id || null;

    try {
        await authFetch(`/api/dishes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dishData),
        });
    } catch (err) {
        alert(err.message || 'Failed to create dish');
    }
}


async function updateDish(dishData) {

    if (!dishData.id) throw new Error('No dish ID provided');
    
    if (dishData.price) dishData.price = parseFloat(dishData.price);
    const templateDish = dishData.baseDish;

    if (templateDish) {
        ['ingredients', 'tags', 'allergens'].forEach(type => {
            const submittedItems = Array.isArray(dishData[type]) ? dishData[type] : [];
            const itemsInTemplateDish = Array.isArray(templateDish[type]) ? templateDish[type] : [];
            dishData[type] = submittedItems.filter(item => !itemsInTemplateDish.includes(item));
        });
    }

    dishData.baseDish = templateDish?._id || null;

    try {
        await authFetch(`/api/dishes/${dishData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dishData),
        });
    } catch (err) {
        alert(err.message || 'Failed to update dish');
    }
}


async function deleteDish(dishData) {
    if (!dishData.id) throw new Error('No dish ID provided');

    try {
        await authFetch(`/api/dishes/${dishData.id}`, {
            method: 'DELETE',
        });
    } catch (err) {
        alert(err.message || 'Failed to delete dish');
    }
}
