const UserTypes = Object.freeze({
    CUSTOMER: 'customer',
    RESTAURATEUR: 'restaurateur',
});

const OrderStatus = Object.freeze({
    ORDERED: 'Ordered',
    PREPARATION: 'In Preparation',
    DELIVERY: 'In Delivery',
    DELIVERED: 'Delivered',
});

module.exports = {
    UserTypes,
    OrderStatus,
};
