const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User does not exist' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Wrong password' });

        const refreshToken = jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });
        const accessToken = jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.json({ accessToken });
    } catch (err) {
        console.error(`Error processing login request: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.refresh = (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.sendStatus(401);

        jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return res.sendStatus(403);

            const payload = { id: decoded.id, userType: decoded.userType };

            const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION,
            });
            
            console.log(`User ${decoded.id} token refreshed successfully`);
            res.json({ accessToken });
        });
    } catch (err) {
        console.error(`Error processing token refresh: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.logout = (_req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict'
    });
    res.json({ message: 'Logged out' });
};
