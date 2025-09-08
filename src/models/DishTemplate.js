const mongoose = require('mongoose');

const dishTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ingredients: { type: [String], required: true },
    allergens: [String],
    category: { type: String },
    tags: [String],
    photo: String
});

module.exports = mongoose.model('DishTemplate', dishTemplateSchema);
