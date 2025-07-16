const mongoose = require('mongoose');
const { OrderStatus } = require('../utils/enums')

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{ dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }, quantity: Number }],
    status: { type: String, enum: Object.values(OrderStatus), default: 'Ordered' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
