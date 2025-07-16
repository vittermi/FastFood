const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    name: String,
    type: String,
    ingredients: [String],
    allergens: [String],
    price: Number,
    photo: String,
});

module.exports = mongoose.model('Dish', dishSchema);
