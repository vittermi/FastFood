const mongoose = require('mongoose');

const dishTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ingredients: [String],
    measures: [String],
    allergens: [String],
    type: { type: String },
    tags: [String],
    photo: String
});

module.exports = mongoose.model('DishTemplate', dishTemplateSchema);
