const mongoose = require('mongoose');
const { UserTypes } = require('../utils/enums');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, enum: Object.values(UserTypes), required: true }
});

module.exports = mongoose.model('User', userSchema);