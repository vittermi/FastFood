import { authFetch } from "/js/modules/auth.js";

const PARTIAL_URL = '/partials/modals/createDish.html';

export async function ensureLoaded() {
    if (document.getElementById('createDishModal')) return;
    const res = await fetch(PARTIAL_URL);
    if (!res.ok) throw new Error(`Failed to load ${PARTIAL_URL}`);
    document.body.insertAdjacentHTML('beforeend', await res.text());
}


export async function open({ prefill = null } = {}) {
    await ensureLoaded();

    return new Promise((resolve, reject) => {
        const modalEl = document.getElementById('createDishModal');
        const formEl = modalEl.querySelector('form');
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

        formEl.reset();
        if (prefill) applyPrefill(formEl, prefill);

        const cleanUpChips = setupChipElements(modalEl);
        const categoriesEl = modalEl.querySelector('#dishCategory');
        loadCategories(categoriesEl, prefill?.category);

        const onSubmit = (e) => {
            e.preventDefault();

            const data = formToObject(new FormData(formEl));

            data.ingredients = getChipValues(modalEl, 'ingredients');
            data.tags = getChipValues(modalEl, 'tags');
            data.allergens = getChipValues(modalEl, 'allergens');

            cleanup();
            bsModal.hide();

            // ritorna una promise con i dati inseriti nel form
            resolve(data);
        };

        const onHidden = () => {
            cleanup();
            reject(new Error('cancelled'));
        };

        formEl.addEventListener('submit', onSubmit);
        modalEl.addEventListener('hidden.bs.modal', onHidden);

        bsModal.show();

        function setupChipElements(root) {
            const chipTypes = ['ingredients', 'tags', 'allergens'];
            const chipCleanUpLambdas = [];

            chipTypes.forEach((type) => {
                const box = root.querySelector(`#${type}ChipBox`);
                const input = root.querySelector(`#${type}ChipInput`);
                const add = root.querySelector(`#${type}ChipAdd`);
                if (!box || !input || !add) return;

                const onAddClick = () => {
                    addChip(box, input, input.value);
                    input.value = '';
                };

                add.addEventListener('click', onAddClick);

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        onAddClick();
                    }
                });

                chipCleanUpLambdas.push(() => {
                    add.removeEventListener('click', onAddClick);
                    box.querySelectorAll('.chip').forEach(chip => chip.remove());
                    input.removeEventListener('keypress', onAddClick);
                });
            });

            return () => chipCleanUpLambdas.forEach((chipCleanupLambda) => chipCleanupLambda());
        }

        function addChip(chipBox, chipInput, value) {
            value = String(value || '').trim();
            if (!value) return;
            if ([...chipBox.children].some(c => c.dataset && c.dataset.value === value)) return;

            const chip = document.createElement('span');
            chip.className = 'badge bg-secondary chip d-flex align-items-center';
            chip.dataset.value = value;
            chip.innerHTML = `${value}<button type="button" class="btn-close btn-close-white btn-sm ms-1" aria-label="Remove"></button>`;
            chip.querySelector('button').onclick = () => chip.remove();

            chipBox.insertBefore(chip, chipInput);
        }

        function getChipValues(root, type) {
            const box = root.querySelector(`#${type}ChipBox`);
            if (!box) return [];
            return [...box.querySelectorAll('.chip')].map(c => c.dataset.value).filter(Boolean);
        }

        function applyPrefill(formEl, dishTemplate) {
            if (!formEl || !dishTemplate) return;

            const root = formEl;

            const setById = (id, val) => {
                const el = root.querySelector(`#${id}`);
                if (!el) return;
                el.value = (val ?? '') + '';
            };

            setById('dishName', dishTemplate.name);
            setById('dishPrice', dishTemplate.price);
            setById('dishImage', dishTemplate.photo ?? dishTemplate.imageUrl);

            const applyChips = (type, values = []) => {
                const box = root.querySelector(`#${type}ChipBox`);
                const input = root.querySelector(`#${type}ChipInput`);
                if (!box || !input) return;
                box.querySelectorAll('.chip').forEach(ch => ch.remove());
                values.filter(Boolean).forEach(v => addChip(box, input, v));
            };

            applyChips('ingredients', dishTemplate.ingredients);
            applyChips('tags', dishTemplate.tags);
            applyChips('allergens', dishTemplate.allergens);
        }

        function cleanup() {
            formEl.removeEventListener('submit', onSubmit);
            modalEl.removeEventListener('hidden.bs.modal', onHidden);
            cleanUpChips();
            categoriesEl.querySelectorAll('option[data-generated]').forEach(o => o.remove());
        }
    });
}

async function loadCategories(selectEl, templateDishCategory) {
    if (!selectEl) return;

    try {
        const payload = await getCategories();
        const categories = Array.isArray(payload.data) ? payload.data : payload;

        if (!categories || !categories.length) return;

        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            opt.dataset.generated = '1';
            selectEl.appendChild(opt);
        });

        if (templateDishCategory) {
            const catEl = selectEl.querySelector(`option[value="${templateDishCategory}"]`);
            if (catEl) catEl.selected = true;
        }
    } catch (err) {
        console.error('Error loading categories', err);
    }
}

async function getCategories() {
    try {
        const res = await authFetch(`/api/dishes/categories`);
        return res.json();
    } catch (err) {
        console.error(err);
    }
}


function formToObject(formData) {
    const obj = {};
    for (const [k, v] of formData.entries()) obj[k] = v;
    return obj;
}
