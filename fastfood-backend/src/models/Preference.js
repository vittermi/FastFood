const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dishTypes: [String]
});

module.exports = mongoose.model('Preference', preferenceSchema);
