import { authFetch } from "/js/modules/auth.js";

const PARTIAL_URL = '/partials/modals/selectDish.html';
const limit = 25;


export async function ensureLoaded() {
    if (document.getElementById('selectDishModal')) return;
    const res = await fetch(PARTIAL_URL);
    if (!res.ok) throw new Error(`Failed to load ${PARTIAL_URL}`);
    document.body.insertAdjacentHTML('beforeend', await res.text());
}

export async function open() {
    await ensureLoaded();

    return new Promise(async (resolve, reject) => {
        const modalEl = document.getElementById('selectDishModal');
        const moreBtn = document.getElementById('moreBtn');
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        const categoriesEl = modalEl.querySelector('#modalCategoryFilter');
        const gridEl = modalEl.querySelector('[data-role="template-list"]');

        let page = 1;
        gridEl._dishTemplates = [];


        loadCategories(categoriesEl);
        await loadTemplateDishesPage(page);

        
        const onSelect = (e) => {
            const card = e.target.closest('.templatedish-card');
            if (!card || !gridEl.contains(card)) return;

            const index = Number(card.dataset.index);
            const selectedTemplate = gridEl._dishTemplates[index];
            if (!selectedTemplate) return;

            cleanup();
            bsModal.hide();
            resolve(selectedTemplate);
        };

        const onMoreBtnClick = () => {
            loadTemplateDishesPage(++page);
        };

        const updateCategories = async () => {
            page = 1;
            gridEl.innerHTML = '';
            await loadTemplateDishesPage(page);
        };

        const onHidden = () => {
            cleanup();
            reject(new Error('cancelled'));
        };
        
        
        gridEl.addEventListener('click', onSelect);
        moreBtn.addEventListener('click', onMoreBtnClick);
        categoriesEl.addEventListener('change', updateCategories);
        modalEl.addEventListener('hidden.bs.modal', onHidden);

        
        bsModal.show();


        async function loadTemplateDishesPage(page) {
            const categoryQuery = categoriesEl.value === 'All Categories' 
                ? '' 
                : `category=${categoriesEl.value}`;

            const result = await getTemplateDishesForPage(page, limit, categoryQuery);
            if (!result) return;

            const { data, pagination } = result;
            const baseLength = gridEl._dishTemplates.length;

            data.forEach((dish, i) => gridEl.appendChild(templateDishesHtml(dish, baseLength + i)));
            gridEl._dishTemplates.push(...data);
            
            if (page >= pagination.totalPages) moreBtn?.classList.add('d-none');
            else moreBtn?.classList.remove('d-none');
        }


        function cleanup() {
            modalEl.removeEventListener('hidden.bs.modal', onHidden);
            moreBtn.removeEventListener('click', onMoreBtnClick);
            categoriesEl.querySelectorAll('option[data-generated]').forEach(o => o.remove());
            gridEl.removeEventListener('click', onSelect);
            gridEl.innerHTML = '';
            gridEl._dishTemplates = [];
            page = 1;
        }
    });
}


async function loadCategories(selectEl) {
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


async function getTemplateDishesForPage(page, limit = 25, query = '') {
    try {

        if (query) {
            const encodedQuery = query;
            const res = await authFetch(`/api/dishes/templates?page=${page}&limit=${limit}&${encodedQuery}`);
            return res.json();
        }

        const res = await authFetch(`/api/dishes/templates?page=${page}&limit=${limit}`);
        return res.json();
    } catch (err) {
        console.error(err);
    }
}

function templateDishesHtml(templateDish, i) {
    const dishCard = document.createElement('div');
    dishCard.className = 'templatedish-card card mb-3 mx-2"';
    dishCard.dataset.index = i;
    dishCard.innerHTML = `
    <img src="${templateDish.photo}" class="card-img-top rounded" alt="${templateDish.name}">
    <div class="card-body p-2">
        <p class="card-text text-center small mb-0">${templateDish.name}</p>
    </div>`;
    return dishCard;
}
