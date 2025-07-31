const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    baseDish: { type: mongoose.Schema.Types.ObjectId, ref: 'DishTemplate' },
    name: String,
    type: String,
    ingredients: [String],
    category: String,
    allergens: [String],
    price: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    tags: [String],
    photo: String,
});

module.exports = mongoose.model('Dish', dishSchema);
