import { authFetch } from '/js/modules/auth.js';

class OrdersManager {
    constructor() {
        this.elements = {
            mobileNav: document.getElementById('orderStatusNavMobile'),
            desktopNav: document.getElementById('orderStatusNavDesktop'),
            ordersGrid: document.getElementById('ordersGrid'),
            emptyState: document.getElementById('ordersEmpty'),
            headerTitle: document.getElementById('ordersHeaderTitle'),
            sortDropdown: document.getElementById('orderSortDropdown')
        };

        this.orders = [];
        this.statuses = {};
        this.currentStatus = 'all';
        this.sortOrder = 'newest';

        this.loadStatuses = this.loadStatuses.bind(this);
        this.loadOrders = this.loadOrders.bind(this);
        this.renderStatusNav = this.renderStatusNav.bind(this);
        this.renderOrders = this.renderOrders.bind(this);
        this.filterOrders = this.filterOrders.bind(this);
        this.handleStatusClick = this.handleStatusClick.bind(this);
        this.handleSortClick = this.handleSortClick.bind(this);
        this.updateOrderStatus = this.updateOrderStatus.bind(this);
        this.renderOrderCard = this.renderOrderCard.bind(this);
        this.formatDate = this.formatDate.bind(this);
        this.formatTime = this.formatTime.bind(this);
        this.getStatusBadgeClass = this.getStatusBadgeClass.bind(this);
    }

    async init() {
        try {
            await this.loadStatuses();
            await this.loadOrders();

            this.renderStatusNav();
            this.renderOrders();

            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize orders:', error);
            this.showError('Failed to load orders. Please try again later.');
        }
    }

    async loadStatuses() {
        try {
            const response = await authFetch('/api/orders/statuses');
            if (!response.ok) throw new Error('Failed to load order statuses');

            this.statuses = await response.json();
            return this.statuses;
        } catch (error) {
            console.error('Error loading statuses:', error);
            throw error;
        }
    }

    async loadOrders() {
        try {
            const response = await authFetch('/api/orders/restaurant');
            if (!response.ok) throw new Error('Failed to load orders');

            this.orders = await response.json();
            return this.orders;
        } catch (error) {
            console.error('Error loading orders:', error);
            throw error;
        }
    }

    renderStatusNav() {
        const createStatusButtons = () => {
            let html = `<button class="nav-link ${this.currentStatus === 'all' ? 'active' : ''}" data-status="all">All</button>`;

            Object.entries(this.statuses).forEach(([key, value]) => {
                html += `
                    <button class="nav-link ${this.currentStatus === key ? 'active' : ''}" 
                            data-status="${key}">${value}</button>
                `;
            });

            return html;
        };

        if (this.elements.mobileNav) {
            this.elements.mobileNav.innerHTML = createStatusButtons();
            this.elements.mobileNav.querySelectorAll('.nav-link').forEach(btn => {
                btn.classList.add('py-1', 'px-3');
            });
        }

        if (this.elements.desktopNav) {
            this.elements.desktopNav.innerHTML = createStatusButtons();
            this.elements.desktopNav.querySelectorAll('.nav-link').forEach(btn => {
                btn.classList.add('mb-2');
            });
        }
    }

    filterOrders() {
        if (this.currentStatus === 'all') return [...this.orders];
        return this.orders.filter(order => order.status === this.statuses[this.currentStatus]);
    }

    renderOrders() {
        this.elements.headerTitle.textContent = this.currentStatus === 'all'
            ? 'All Orders'
            : `${this.statuses[this.currentStatus]} Orders`;

        const filtered = this.filterOrders();

        if (filtered.length === 0) {
            this.elements.emptyState.classList.remove('d-none');
            this.elements.ordersGrid.innerHTML = '';
            return;
        }

        this.elements.emptyState.classList.add('d-none');
        this.elements.ordersGrid.innerHTML = '';

        filtered.forEach(order => {
            const orderCard = this.renderOrderCard(order);
            this.elements.ordersGrid.appendChild(orderCard);
        });
    }

    renderOrderCard(order) {
        const col = document.createElement('div');
        col.className = 'col';

        const orderSummary = order.items.map(item =>
            `${item.quantity}× ${item.dish?.name || 'Unknown item'}`
        ).join(', ');

        const orderDate = this.formatDate(order.createdAt);
        const orderTime = this.formatTime(order.createdAt);

        const badgeClass = this.getStatusBadgeClass(order.status);

        col.innerHTML = `
            <div class="card order-card shadow-sm h-100" data-order-id="${order._id}">
                <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">#${order._id.substring(order._id.length - 6).toUpperCase()}</h5>
                <span class="badge ${badgeClass}">${order.status}</span>
                </div>
                <div class="card-body">
                <p class="card-text fw-bold mb-1">${order.customer?.username || 'Customer'}</p>
                <p class="card-text text-muted small mb-3">${orderSummary}</p>
                <div class="d-flex justify-content-between mb-2">
                    <span class="fw-bold">Total:</span>
                    <span class="fw-bold">€${order.totalAmount.toFixed(2)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Placed:</span>
                    <span>${orderDate}, ${orderTime}</span>
                </div>
                </div>
                <div class="card-footer d-flex gap-2 justify-content-end">
                <button class="btn btn-sm btn-outline-danger btn-order-cancel d-none">Cancel</button>
                <button class="btn btn-sm btn-success btn-order-advance-status">Next Status</button>
                </div>
            </div>
        `;

        const card = col.querySelector('.order-card');
        const orderCancelButton = card.querySelector('.btn-order-cancel');

        orderCancelButton.addEventListener('click', () => this.cancelOrder(order));
        this.orderCanBeCancelled(order).then(canCancel => {
            if (canCancel) orderCancelButton.classList.remove('d-none');
        });

        card.querySelector('.btn-order-advance-status').addEventListener('click', () => this.changeOrderStatus(order));


        return col;
    }

    setupEventListeners() {
        const addStatusListeners = (nav) => {
            if (!nav) return;
            nav.querySelectorAll('.nav-link').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleStatusClick(e.target.dataset.status));
            });
        };

        addStatusListeners(this.elements.mobileNav);
        addStatusListeners(this.elements.desktopNav);

        const sortButtons = document.querySelectorAll('[data-sort]');
        sortButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSortClick(e.target.dataset.sort));
        });
    }

    handleStatusClick(status) {
        this.currentStatus = status;

        const updateNav = (nav) => {
            if (!nav) return;
            nav.querySelectorAll('.nav-link').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.status === status);
            });
        };

        updateNav(this.elements.mobileNav);
        updateNav(this.elements.desktopNav);

        this.renderOrders();
    }

    handleSortClick(sort) {
        this.sortOrder = sort;

        this.elements.sortDropdown.textContent = sort === 'newest' ? 'Newest First' : 'Oldest First';

        this.renderOrders();
    }

    async changeOrderStatus(order) {
        try {
            const transitions = await this.getAvailableOrderTransitions(order);

            if (transitions.length === 0) {
                throw new Error('No valid next status for this order.');
            }

            let nextStatus;

            // In caso di delivery disponibile logica va modificata
            if (order.status === 'In Preparation') nextStatus = 'Delivered';
            else nextStatus = transitions[0];

            await this.updateOrderStatus(order, nextStatus);

            await this.loadOrders();
            this.renderOrders();

        } catch (error) {
            console.error('Error updating order status:', error);
            alert(error.message || 'Failed to update order status');
        }
    }

    async cancelOrder(order) {

        try {
            const cancelledStatus = 'Cancelled';

            if (!this.orderCanBeCancelled(order)) {
                alert('Order cannot be cancelled.');
                return;
            }

            await this.updateOrderStatus(order, cancelledStatus);
            
            await this.loadOrders();
            this.renderOrders();

        } catch (error) {
            console.error('Error canceling order:', error);
            alert(error.message || 'Failed to cancel order');
        }
    }

    async orderCanBeCancelled(order) {
        const cancelledStatus = 'Cancelled';
        const transitions = await this.getAvailableOrderTransitions(order, true);

        return Array.isArray(transitions) && transitions.includes(cancelledStatus);
    }

    async getAvailableOrderTransitions(order, includeCancel = false) {
        const transitionsRes = await authFetch(`/api/orders/${order._id}/transitions?includeCancel=${includeCancel}`);
        if (!transitionsRes.ok) {
            const err = await transitionsRes.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to fetch transitions');
        }

        const { transitions = [] } = await transitionsRes.json();
        return transitions;

    }


    async updateOrderStatus(order, nextStatus) {

        const response = await authFetch(`/api/orders/${order._id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newStatus: nextStatus })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update status');
        }

    }


    showError(message) {
        this.elements.ordersGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">${message}</div>
      </div>
    `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short'
        });
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    getStatusBadgeClass(status) {
        const statusMap = {
            'Ordered': 'bg-warning',
            'In Preparation': 'bg-info',
            'Ready': 'bg-primary',
            'In delivery': 'bg-success',
            'Delivered': 'bg-secondary',
            'Cancelled': 'bg-danger'
        };

        return statusMap[status] || 'bg-secondary';
    }
}

export async function init() {
    const ordersManager = new OrdersManager();
    await ordersManager.init();
}