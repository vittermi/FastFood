const mongoose = require('mongoose');
const { OrderStatus } = require('../utils/enums')

const orderItemSchema = new mongoose.Schema({
    dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtOrder: { type: Number, required: true, min: 0 }
});

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(OrderStatus), default: 'Ordered' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
