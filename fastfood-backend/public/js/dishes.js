import { authFetch, getDecodedJWT } from './auth.js';

let dishes = [];
let filtered = [];

let selectedDishTemplate;


async function init() {
    const searchInput = document.getElementById('dishSearch');
    const clearBtn = document.getElementById('clearDishSearch');
    const createBtn = document.getElementById('createDishBtn');
    const selectBtn = document.getElementById('selectDishBtn');

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

    if (!document.getElementById('createDishModal')) {
        try {
            const res = await fetch('/partials/modals/createDish.html');
            document.body.insertAdjacentHTML('beforeend', await res.text());
        } catch (err) {
            return alert('Failed to load modal: ' + err.message);
        }
    }

    if (!document.getElementById('selectDishModal')) {
        try {
            const res = await fetch('/partials/modals/selectDish.html');
            document.body.insertAdjacentHTML('beforeend', await res.text());
        } catch (err) {
            return alert('Failed to load modal: ' + err.message);
        }
    }

    createBtn.addEventListener('click', openCreateModal);
    selectBtn.addEventListener('click', openSelectModal);
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

async function getRestaurantId() {
    const payload = getDecodedJWT();
    const userID = payload.id;

    const restaurantResponse = await authFetch(`/api/restaurants/?owner=${userID}`);

    if (!restaurantResponse.ok) throw new Error('Failed to fetch restaurant');

    const restaurantData = await restaurantResponse.json();
    if (!restaurantData.length) throw new Error('No restaurant found for this user');

    return restaurantData[0]._id;
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
    // TODO: attach edit logic later
    return col;
}

async function openCreateModal() {

    console.log('openCreateModal called');

    const modalEl = document.getElementById('createDishModal');
    const form = document.getElementById('createDishForm');
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    selectedDishTemplate = null;
    form.reset();

    handleChipElements();

    form.onsubmit = async (event) => onCreateDishSubmit(form, event);

    bsModal.show();
}


async function openSelectModal() {
    const modalEl = document.getElementById('selectDishModal');
    const searchInput = document.getElementById('selectDishForm');
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    searchInput.reset();

    let page = 1;

    await loadTemplateDishes(page);
    const moreBtn = document.getElementById('moreBtn');

    moreBtn.addEventListener('click', () => loadTemplateDishes(++page));
    bsModal.show();
}


function handleChipElements() {
    const chipTypes = ['ingredients', 'tags', 'allergens'];
    chipTypes.forEach(type => {
        const box = document.getElementById(`${type}ChipBox`);
        const input = document.getElementById(`${type}ChipInput`);
        const add = document.getElementById(`${type}ChipAdd`);

        if (!box || !input || !add) return;

        add.addEventListener('click', () => {
            addChip(box, input, input.value);
            input.value = '';
        });
    });
}


function addChip(chipBox, chipInput, value) {
    value = value.trim();
    if (!value) return;
    if ([...chipBox.children].some(c => c.dataset && c.dataset.value === value)) return;
    const chip = document.createElement('span');
    chip.className = 'badge bg-secondary chip d-flex align-items-center';
    chip.dataset.value = value;
    chip.innerHTML = `${value}<button type="button" class="btn-close btn-close-white btn-sm ms-1" aria-label="Remove"></button>`;
    chip.querySelector('button').onclick = () => chip.remove();
    chipBox.insertBefore(chip, chipInput);
}


async function onCreateDishSubmit(form, event) {
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

    debugger;


    console.log("BABY THIS IS IT", data);

    try {
        await authFetch(`/BABY/restaurants/${restId}/dishes`, {
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

async function loadTemplateDishes(page) {

    const grid = document.getElementById('modalDishGrid');
    const moreBtn = document.getElementById('moreBtn');

    if (!grid) return;

    try {
        const res = await authFetch(`/api/dishes/templates?page=${page}`);
        const { data, pagination } = await res.json();
        data.forEach(dish => grid.appendChild(templateDishesHtml(dish)));
        if (page >= pagination.totalPages) moreBtn.remove();
    } catch (err) {
        console.error(err);
    }
}

function templateDishesHtml(templateDish) {
    const dishCard = document.createElement('div');
    dishCard.className = 'templatedish-card card mb-3 mx-2"';
    dishCard.style.width = '120px';
    dishCard.innerHTML = `
    <img src="${templateDish.photo}" class="card-img-top rounded" alt="${templateDish.name}">
    <div class="card-body p-2">
        <p class="card-text text-center small mb-0">${templateDish.name}</p>
    </div>`;

    dishCard.addEventListener('click', () => { handleTemplateDishSelection(templateDish); });

    return dishCard;
}

function handleTemplateDishSelection(dishTemplate) {

    selectedDishTemplate = dishTemplate;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('selectDishModal')).hide();

    const modalEl = document.getElementById('createDishModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);


    document.getElementById('dishName').value = dishTemplate.name ?? '';
    document.getElementById('dishCategory').value = dishTemplate.type ?? dishTemplate.category ?? ''; //todo metti solo category dopo aver aggiornato
    document.getElementById('dishPrice').value = dishTemplate.price ?? '';

    dishTemplate.ingredients.forEach((ingredient) => {
        addChip(document.getElementById(`ingredientsChipBox`), document.getElementById(`ingredientsChipInput`), ingredient);
    });

    dishTemplate.tags.forEach((tag) => {
        addChip(document.getElementById(`tagsChipBox`), document.getElementById(`tagsChipInput`), tag);
    });

    dishTemplate.allergens.forEach((allergen) => {
        addChip(document.getElementById(`allergensChipBox`), document.getElementById(`allergensChipInput`), allergen);
    });

    document.getElementById('dishImage').value = dishTemplate.photo ?? dishTemplate.imageUrl ?? '';

    const form = document.getElementById('createDishForm');
    form.onsubmit = async (event) => onCreateDishSubmit(form, event);

    modal.show();
}

function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), ms); };
}

export { init }