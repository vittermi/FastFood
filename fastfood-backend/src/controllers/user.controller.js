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
        console.error(`Error processing register request: ${err.message}`);

        if (err.name === 'ValidationError')
            return res.status(400).json({ message: 'Invalid input', details: err.errors });

        if (err.code === 11000)
            return res.status(409).json({ message: 'Duplicate field', field: Object.keys(err.keyPattern)[0] });

        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.update = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

        await User.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'User updated' });
    } catch (err) {
        console.error(`Error updating user: ${err.message}`);

        if (err.name === 'ValidationError')
            return res.status(400).json({ message: 'Invalid input', details: err.errors });

        if (err.code === 11000)
            return res.status(409).json({ message: 'Duplicate field', field: Object.keys(err.keyPattern)[0] });

        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.remove = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(`Error processing remove request: ${err}`);

        if (err.name === 'ValidationError')
            return res.status(400).json({ message: 'Invalid input', details: err.errors });

        res.status(500).json({ message: 'Internal server error' });
    }
};
