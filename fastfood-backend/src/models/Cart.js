const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: { type: [{ dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }, quantity: Number }], default: [] },
})

module.exports = mongoose.model('Cart', cartSchema);