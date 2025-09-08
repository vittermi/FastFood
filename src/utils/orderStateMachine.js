const { OrderStatus } = require('./enums');

// todo aggiungi a relazione

const allowedTransitions = {
    [OrderStatus.ORDERED]: [OrderStatus.PREPARATION, OrderStatus.CANCELLED],
    [OrderStatus.PREPARATION]: [OrderStatus.DELIVERY, OrderStatus.DELIVERED],
    [OrderStatus.DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
};

function computeAllowedTransitions(order, { includeCancel = false } = {}) {
    const all = allowedTransitions[order.status] ?? [];
    let nextStatus = includeCancel ? all : all.filter(s => s !== OrderStatus.CANCELLED);
    return nextStatus;
}

function isValidTransition(order, requestedNext) {
    const allowed = computeAllowedTransitions(order, { includeCancel: true });
    return allowed.includes(requestedNext);
}

module.exports = { computeAllowedTransitions, isValidTransition };
