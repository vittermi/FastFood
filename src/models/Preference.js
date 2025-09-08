const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    allergens: [String],
    paymentType: { type: String, enum: ['cash', 'card'], default: 'cash' },
    cardDetails: {
        token: String,
        cardHolder: String,
        cardNumber: String,
        expiryDate: String,
    },
    consents: {
        tos: { type: Boolean, required: true },
        privacy: { type: Boolean, required: true },
        offers: { type: Boolean, default: false }
    }
});

module.exports = mongoose.model('Preference', preferenceSchema);
