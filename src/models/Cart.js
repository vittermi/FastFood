const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{
        dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
        quantity: { type: Number, required: true, min: 1 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);