const UserTypes = Object.freeze({
    CUSTOMER: 'customer',
    RESTAURATEUR: 'restaurateur',
});

const OrderStatus = Object.freeze({
    ORDERED: 'Ordered',
    PREPARATION: 'In Preparation',
    READY: 'Ready',
    DELIVERY: 'In delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
});

module.exports = {
    UserTypes,
    OrderStatus,
};
