import { authFetch, getAccessToken, decodeJWT } from './auth.js';

let dishes = [];
let filtered = [];


async function init() {
    const searchInput = document.getElementById('dishSearch');
    const clearBtn = document.getElementById('clearDishSearch');
    const createBtn = document.getElementById('createDishBtn');
    const selectBtn = document.getElementById('selectDishBtn');


    debugger;
    console.log('dishes init');
    await loadDishes();
    render();

    /* search */
    searchInput.addEventListener('input', debounce(async () => {
        const q = searchInput.value.trim();
        await loadDishes(q);
        render();
    }, 300));

    clearBtn.addEventListener('click', async () => {
        searchInput.value = '';
        await loadDishes();
        render();
    });

    createBtn.addEventListener('click', openCreateModal);
    selectBtn.addEventListener('click', openSelectModal);
}

async function getRestaurantId() {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const payload = decodeJWT(token);
    return 'aaaaaaaa'  // TODO: implement actual restaurant ID retrieval
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

function render() {
    const listEl = document.getElementById('dish-cards-list');

    listEl.innerHTML = '';
    if (!filtered.length) {
        listEl.innerHTML = '<p class="text-muted">No dishes found.</p>';
        return;
    }
    filtered.forEach(dish => listEl.appendChild(card(dish)));
}

function card(dish) {
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

    // load modal markup once
    if (!document.getElementById('createDishModal')) {
        try {
            const res = await fetch('/partials/modals/createDish.html');
            document.body.insertAdjacentHTML('beforeend', await res.text());
        } catch (err) {
            return alert('Failed to load form: ' + err.message);
        }
    }

    const modalEl = document.getElementById('createDishModal');
    const form = document.getElementById('createDishForm');
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // reset form on every open
    form.reset();

    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        // coerce numeric price
        if (data.price) data.price = parseFloat(data.price);

        try {
            await authFetch(`/api/restaurants/${restId}/dishes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            bsModal.hide();
            await loadDishes();
            render();
        } catch (err) {
            alert(err.message || 'Failed to create dish');
        }
    };

    bsModal.show();
}


async function openSelectModal() {
    // load modal markup once
    if (!document.getElementById('selectDishModal')) {
        try {
            const res = await fetch('/partials/modals/selectDish.html');
            document.body.insertAdjacentHTML('beforeend', await res.text());
        } catch (err) {
            return alert('Failed to load form: ' + err.message);
        }
    }

    const modalEl = document.getElementById('selectDishModal');
    const form = document.getElementById('selectDishForm');
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // reset form on every open
    // form.reset();

    // form.onsubmit = async (e) => {
    //     e.preventDefault();
    //     const data = Object.fromEntries(new FormData(form));
    //     // coerce numeric price
    //     if (data.price) data.price = parseFloat(data.price);

    //     try {
    //         await authFetch(`/api/restaurants/${restId}/dishes`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify(data),
    //         });
    //         bsModal.hide();
    //         await loadDishes();
    //         render();
    //     } catch (err) {
    //         alert(err.message || 'Failed to create dish');
    //     }
    // };

    bsModal.show();
}





/* ---------- UTIL ---------- */
function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), ms); };
}

export { init }