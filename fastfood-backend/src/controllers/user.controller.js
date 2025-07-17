const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    console.log('Processing register request:', req.body);
    try {
        const { username, email, password, userType } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword, userType });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        console.error(`Error processing register request: ${err}`);
        res.status(500).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'User updated' });
    } catch (err) {
        console.error(`Error processing update request: ${err}`);
        res.status(400).json({ message: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(`Error processing remove request: ${err}`);
        res.status(400).json({ message: err.message });
    }
};
