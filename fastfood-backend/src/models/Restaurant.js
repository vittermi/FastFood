const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    address: String,
    phone: String,
    vat: String,
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
