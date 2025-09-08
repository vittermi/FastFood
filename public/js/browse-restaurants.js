import { authFetch } from '/js/modules/auth.js';  
import { debounce } from '/js/modules/utils.js';
import { showUserMenuModal } from './modals/user-menu-modal.js';


document.addEventListener('DOMContentLoaded', () => {
    
    const menuButton = document.getElementById('menuButton');
    const openNowToggle = document.getElementById('openNowToggle');
    const searchInput = document.getElementById('searchInput');
    const searchInputAddress = document.getElementById('searchInputAddress');
    const filterToggleBtn = document.getElementById('filter-toggle');
    const filters = document.getElementById('filters');
    const restaurantList = document.getElementById('restaurant-list');

    filterToggleBtn.addEventListener('click', () =>
        filters.classList.toggle('mobile-hidden'));

    openNowToggle.addEventListener('change', loadRestaurants);
    searchInput.addEventListener('keyup', debounce(loadRestaurants, 300));
    searchInputAddress.addEventListener('keyup', debounce(loadRestaurants, 300));
    menuButton.addEventListener('click', () => {
        showUserMenuModal();
    });

    loadRestaurants();


    async function loadRestaurants() {
        try {
            const qs = new URLSearchParams();
            if (openNowToggle.checked) {
                const now = new Date();
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const day = days[now.getDay()];
                const time = now.toTimeString().slice(0, 5); 
                qs.append('openAt', `${day},${time}`);
            }

            const name = searchInput.value.trim();
            if (name) qs.append('name', name);

            const address = searchInputAddress.value.trim();
            if (address) qs.append('address', address);

            const res = await authFetch(`/api/restaurants${qs.toString() ? '?' + qs : ''}`);

            if (!res.ok) throw new Error('Something went wrong'); // in caso di problemi nonostante refresh ok

            const restaurants = await res.json();
            renderRestaurants(restaurants);
        } catch (err) {
            console.error(err);
            restaurantList.innerHTML =
                `<div class="alert alert-danger">${err.message}</div>`;
        }
    }

    function renderRestaurants(data = []) {
        restaurantList.innerHTML =
            data.map(card).join('') ||
            '<p class="text-muted">No restaurants match your criteria.</p>';
    }

    function card(r) {
        const img = r.imageUrl ?? '/img/placeholder.jpg';
        const phone = r.phone ?? 'N/A';
        return `
        <div class="card restaurant-card mb-4">
            <div class="row g-0" >
            <div class="col-md-4">
                <img src="${img}" class="img-fluid h-100 w-100" alt="${r.name}">
            </div>
            <div class="col-md-8">
                <div class="card-body">
                <h5 class="card-title">${r.name}</h5>
                <p class="card-text mb-1"><strong>Address:</strong> ${r.address}</p>
                <p class="card-text mb-2"><strong>Phone:</strong> ${phone}</p>
                <a href="/menu/${r._id}" class="btn btn-primary">View Menu</a>
                </div>
            </div>
            </div>
        </div>`;
    }
});
