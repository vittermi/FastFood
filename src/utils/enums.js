const UserTypes = Object.freeze({
    CUSTOMER: 'customer',
    RESTAURATEUR: 'restaurateur',
});

const OrderStatus = Object.freeze({
    ORDERED: 'Ordered',
    PREPARATION: 'In Preparation',
    DELIVERY: 'In Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
});

module.exports = {
    UserTypes,
    OrderStatus,
};
