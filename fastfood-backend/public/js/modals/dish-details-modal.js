const PARTIAL_URL = '/partials/modals/menuDishDetails.html';
let modalInstance = null;

export async function ensureLoaded() {
    if (document.getElementById('dishDetailsModal')) return;

    const res = await fetch(PARTIAL_URL);
    if (!res.ok) throw new Error(`Failed to load ${PARTIAL_URL}`);
    document.body.insertAdjacentHTML('beforeend', await res.text());
}

export async function openDishDetailsModal(dish, options = {}) {
    const placeholderImage = options.placeholderImage || '/img/placeholder.jpg';
    await ensureLoaded();

    const modalEl = document.getElementById('dishDetailsModal');
    if (!modalEl) throw new Error('Dish details modal not found in DOM');

    modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);

    populateModal(modalEl, dish, placeholderImage);

    const onHidden = () => {
        modalEl.removeEventListener('hidden.bs.modal', onHidden);
        resetModal(modalEl);
    };
    modalEl.addEventListener('hidden.bs.modal', onHidden);

    modalInstance.show();
}



function populateModal(modalEl, dish, placeholderImage) {
    modalEl.querySelector('#dishName').textContent = dish.name || '';

    const photoEl = modalEl.querySelector('#dishPhoto');
    photoEl.src = dish.photo || placeholderImage;

    const priceFormatter = new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    });
    modalEl.querySelector('#dishPrice').textContent = priceFormatter.format(dish.price || 0);

    populateCategory();
    populateIngredients();
    populateAllergens();
    populateTags();

    function populateCategory() {
        const categoryBadge = modalEl.querySelector('#dishCategoryBadge');
        toggleSection(categoryBadge, dish.category);
        if (dish.category) {
            categoryBadge.textContent = dish.category;
            categoryBadge.className = 'badge text-bg-secondary';
        }
    }

    function populateIngredients() {
        const ingredientsContainer = modalEl.querySelector('#dishIngredientsContainer');
        const ingredientsList = modalEl.querySelector('#dishIngredientsList');
        toggleSection(ingredientsContainer, dish.ingredients?.length);

        if (dish.ingredients?.length) {
            ingredientsList.innerHTML = '';
            dish.ingredients.forEach(ingredient => {
                const badge = document.createElement('span');
                badge.className = 'badge rounded-pill text-bg-light me-1 mb-1';
                badge.textContent = ingredient;
                ingredientsList.appendChild(badge);
            });
        }
    }

    function populateAllergens() {
        const allergensContainer = modalEl.querySelector('#dishAllergensContainer');
        const allergensList = modalEl.querySelector('#dishAllergensList');
        toggleSection(allergensContainer, dish.allergens?.length);

        if (dish.allergens?.length) {
            allergensList.innerHTML = '';
            dish.allergens.forEach(allergen => {
                const li = document.createElement('li');
                li.className = 'list-inline-item';

                const badge = document.createElement('span');
                badge.className = 'badge text-bg-warning text-dark';
                badge.textContent = allergen;

                li.appendChild(badge);
                allergensList.appendChild(li);
            });
        }
    }

    function populateTags() {
        const tagsContainer = modalEl.querySelector('#dishTagsContainer');
        const tagsEl = modalEl.querySelector('#dishTags');
        toggleSection(tagsContainer, dish.tags?.length);

        if (dish.tags?.length) {
            tagsEl.innerHTML = '';
            dish.tags.forEach(tag => {
                const badge = document.createElement('span');
                badge.className = 'badge rounded-pill text-bg-light me-1';
                badge.textContent = tag;
                tagsEl.appendChild(badge);
            });
        }
    }
}

function resetModal(modalEl) {

    const lists = modalEl.querySelectorAll('ul');
    lists.forEach(list => list.innerHTML = '');

    modalEl.querySelector('#dishName').textContent = '';
    modalEl.querySelector('#dishPrice').textContent = '';

    const photoEl = modalEl.querySelector('#dishPhoto');
    if (photoEl) photoEl.src = '';

    const sections = [
        '#dishCategoryBadge',
        '#dishBaseDishContainer',
        '#dishIngredientsContainer',
        '#dishAllergensContainer',
        '#dishTagsContainer'
    ];

    sections.forEach(selector => {
        const el = modalEl.querySelector(selector);
        if (el) el.classList.add('d-none');
    });
}

function toggleSection(element, hasData) {
    if (!element) return;
    element.classList.toggle('d-none', !hasData);
}