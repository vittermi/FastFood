import { authFetch } from '/js/modules/auth.js';
import { debounce } from '/js/modules/utils.js';
import { showUserMenuModal } from '/js/modals/user-menu-modal.js';


class RestaurantMenu {
    constructor() {
        this.API = {
            menu: id => `/api/restaurants/${id}/dishes`,
            cart: '/api/cart',
            restaurant: id => `/api/restaurants/${id}`,
            preferences: '/api/preferences'
        };
        this.LS_KEY = 'restaurant_cart';

        this.elements = {
            menuButton: document.getElementById('menuButton'),  
            menuList: document.getElementById('menu-list'),
            searchInput: document.getElementById('dishSearch'),
            clearBtn: document.getElementById('clearSearch'),
            cartItemsDesktop: document.getElementById('cartItems'),
            cartItemsMobile: document.getElementById('cartItemsMobile'),
            cartTotalDesktop: document.getElementById('cartTotal'),
            cartTotalMobile: document.getElementById('cartTotalMobile'),
            mobileCartCount: document.getElementById('mobileCartCount'),
            cartButtonMobile: document.getElementById('cartButtonMobile'),
            checkoutBtnDesk: document.getElementById('checkoutBtn'),
            checkoutBtnMob: document.getElementById('checkoutBtnMobile'),
            menuPageTitle: document.getElementById('menuPageTitle')
        };

        this.restaurantId = this.getRestaurantIdFromUrl();
        this.dishes = [];
        this.filtered = [];
        this.cart = this.loadCart();
        this.preferences = null;
        this.cartModal = null;

        this.init = this.init.bind(this);
        this.fetchRestaurantData = this.fetchRestaurantData.bind(this);
        this.fetchMenu = this.fetchMenu.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.renderCart = this.renderCart.bind(this);
        this.addToCart = this.addToCart.bind(this);
        this.changeQty = this.changeQty.bind(this);
        this.checkout = this.checkout.bind(this);
        this.fetchPreferences = this.fetchPreferences.bind(this);
    }

    getRestaurantIdFromUrl() {
        const parts = window.location.pathname.split('/');
        return parts[2];
    }

    async init() {
        try {
            const restaurant = await this.fetchRestaurantData();
            document.title = `${restaurant.name} – Menu`;
            this.elements.menuPageTitle.textContent = `${restaurant.name} – Menu`;

            await this.fetchMenu();
            await this.fetchPreferences();

            this.renderMenu();
            this.renderCart();

            const modalEl = document.getElementById('cart-modal');
            if (modalEl) this.cartModal = new bootstrap.Modal(modalEl);

            this.setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            this.elements.menuList.innerHTML = `<div class="alert alert-danger">Failed to load menu: ${error.message}</div>`;
        }
    }

    setupEventListeners() {
        this.elements.searchInput.addEventListener('input', debounce(() => {
            const query = this.elements.searchInput.value.trim().toLowerCase();
            this.filtered = !query ?
                this.dishes :
                this.dishes.filter(d => d.name.toLowerCase().includes(query));
            this.renderMenu();
        }, 300));

        this.elements.clearBtn.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.filtered = this.dishes;
            this.renderMenu();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && this.cartModal) 
                this.cartModal.hide();
        });

        this.elements.cartButtonMobile.addEventListener('click', () => {
            if (this.cartModal) this.cartModal.show();
        });

        this.elements.checkoutBtnDesk.addEventListener('click', this.checkout);
        this.elements.checkoutBtnMob.addEventListener('click', this.checkout);

        this.elements.menuButton.addEventListener('click', () => {
            showUserMenuModal();
        });
    }

    async fetchRestaurantData() {
        try {
            const response = await authFetch(this.API.restaurant(this.restaurantId));
            if (!response.ok) throw new Error(`${response.status} – ${response.statusText}`);
            return await response.json();
        } catch (err) {
            console.error(err);
            throw new Error('Failed to fetch restaurant data');
        }
    }

    async fetchPreferences() {
        try {
            const response = await authFetch(this.API.preferences);
            const status = response.status;
            if (!response.ok && status !== 404) throw new Error(`${response.status} – ${response.statusText}`);
            this.preferences = status === 404 ? await response.json() : null;
        } catch (err) {
            console.error(err);
            throw new Error('Failed to fetch preferences');
        }
    }

    async fetchMenu() {
        try {
            const response = await authFetch(this.API.menu(this.restaurantId));
            if (!response.ok) throw new Error(`${response.status} – ${response.statusText}`);

            this.dishes = await response.json();
            this.filtered = this.dishes;
        } catch (err) {
            console.error(err);
            this.elements.menuList.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
            throw err;
        }
    }

    renderMenu() {
        const menuList = this.elements.menuList;
        menuList.querySelectorAll('section').forEach(s => s.remove());

        if (!this.filtered.length) {
            menuList.insertAdjacentHTML('beforeend', '<p class="text-muted">No dishes found.</p>');
            return;
        }

        const groupByCategory = {};
        this.filtered.forEach(d => {
            groupByCategory[d.category] = groupByCategory[d.category] || [];
            groupByCategory[d.category].push(d);
        });

        Object.entries(groupByCategory).forEach(([categoryName, list]) => {
            const sec = document.createElement('section');
            sec.className = 'mb-5';
            sec.innerHTML = `<h4 class="fw-semibold mb-3">${categoryName}</h4>`;
            list.forEach(dish => sec.appendChild(this.createDishCard(dish)));
            menuList.appendChild(sec);
        });
    }


    createDishCard(dish) {
        const card = document.createElement('div');
        let className = 'card mb-3';

        if (this.preferences) {
            if (this.preferences.allergens && this.preferences.allergens.length > 0) {
                const hasAllergen = dish.allergens.some(a => this.preferences.allergens.includes(a));
                if (hasAllergen) className += ' border-danger';
            }
        }

        card.className = className;
        card.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between">
                <div>
                <h5 class="card-title mb-1">${dish.name}</h5>
                <span class="fw-bold">${dish.price.toFixed(2)} €</span>
                </div>
                <div class="ms-3 d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-secondary dish-details" data-id="${dish._id}">
                    Details
                </button>
                <button class="btn btn-sm btn-primary add-to-cart" data-id="${dish._id}">
                    Add to Cart
                </button>
                </div>
            </div>
        </div>`;

        card.querySelector('.add-to-cart').addEventListener('click', () => this.addToCart(dish));
        card.querySelector('.dish-details').addEventListener('click', () => this.showDishDetails(dish));
        return card;
    }

    addToCart(dish) {
        if (!this.cart[dish._id]) this.cart[dish._id] = { qty: 0, dish };
        this.cart[dish._id].qty += 1;
        this.persistCart();
        this.renderCart();

        authFetch(this.API.cart, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dishId: dish._id, quantity: 1 })
        }).catch(console.error);
    }

    async showDishDetails(dish) {
        try {
            const { openDishDetailsModal } = await import('/js/modals/dish-details-modal.js');
            await openDishDetailsModal(dish);
        } catch (error) {
            console.error('Error showing dish details:', error);
            alert('Unable to show dish details');
        }
    }

    changeQty(dishId, delta) {
        if (!this.cart[dishId]) return;

        this.cart[dishId].qty += delta;
        if (this.cart[dishId].qty <= 0) delete this.cart[dishId];

        this.persistCart();
        this.renderCart();

        // Update server cart
        authFetch(`${this.API.cart}/${dishId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta })
        }).catch(console.error);
    }

    renderCart() {
        const { cartItemsDesktop, cartItemsMobile, cartTotalDesktop,
            cartTotalMobile, mobileCartCount } = this.elements;

        cartItemsDesktop.innerHTML = '';
        cartItemsMobile.innerHTML = '';

        const entries = Object.values(this.cart);

        if (!entries.length) {
            cartItemsDesktop.innerHTML = '<li class="list-group-item text-muted">Cart empty</li>';
            cartItemsMobile.innerHTML = '<li class="list-group-item text-muted">Cart empty</li>';
        } else {
            entries.forEach(({ dish, qty }) => {
                cartItemsDesktop.appendChild(this.createCartItemLi(dish, qty));
                cartItemsMobile.appendChild(this.createCartItemLi(dish, qty));
            });
        }

        const total = entries.reduce((sum, { dish, qty }) => sum + dish.price * qty, 0);
        cartTotalDesktop.textContent = `€${total.toFixed(2)}`;
        cartTotalMobile.textContent = `€${total.toFixed(2)}`;
        mobileCartCount.textContent = entries.reduce((c, e) => c + e.qty, 0);
    }

    createCartItemLi(dish, qty) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
          <div>
            <span class="fw-semibold">${dish.name}</span>
            <div class="small text-muted">x<span class="quantity">${qty}</span></div>
          </div>
          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary me-1">−</button>
            <button class="btn btn-sm btn-outline-secondary me-3">+</button>
            <span class="fw-bold line-total">€${(dish.price * qty).toFixed(2)}</span>
          </div>`;

        const [decBtn, incBtn] = li.querySelectorAll('button');
        decBtn.addEventListener('click', () => this.changeQty(dish._id, -1));
        incBtn.addEventListener('click', () => this.changeQty(dish._id, 1));
        return li;
    }

    async checkout() {
        if (!Object.keys(this.cart).length) return alert('Cart is empty');

        try {
            const orderItems = Object.values(this.cart).map(({ dish, qty }) => ({
                dish: dish._id,
                quantity: qty
            }));

            const orderData = {
                restaurantId: this.restaurantId,
                items: orderItems
            }

            const response = await authFetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to place order');
            }

            const order = await response.json();

            this.cart = {};
            this.persistCart();
            this.renderCart();

            alert(`Order placed successfully! Your order ID is: ${order._id}`);
        } catch (err) {
            alert(err.message);
        }
    }

    loadCart() {
        try {
            return JSON.parse(localStorage.getItem(this.LS_KEY)) || {};
        } catch {
            return {};
        }
    }

    persistCart() {
        localStorage.setItem(this.LS_KEY, JSON.stringify(this.cart));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const menu = new RestaurantMenu();
    menu.init();


});

