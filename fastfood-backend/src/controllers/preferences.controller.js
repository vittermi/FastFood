const Preference = require('../models/Preference');


exports.getPreferences = async (req, res) => {
    try {
        const preferences = await Preference.findOne({ customer: req.user.id });

        if (!preferences) return res.status(404).json({ message: 'No preferences found for this user' });
        
        res.json(preferences);
    } catch (err) {
        console.error(`Error fetching preferences: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.savePreferences = async (req, res) => {
    try {
        const { allergens, paymentType, cardDetails, consents } = req.body;

        if (!consents.tos || !consents.privacy) {
            return res.status(400).json({
                message: 'Required consents missing',
            });
        }

        if (paymentType === 'card') {
            if (!cardDetails || !cardDetails.cardHolder || !cardDetails.cardNumber ||
                !cardDetails.expiryDate || !cardDetails.cvv) {
                return res.status(400).json({
                    message: 'Card details are required for card payment type'
                });
            }
        }

        let preferences = await Preference.findOne({ customer: req.user.id });

        if (preferences) {
            preferences.allergens = allergens;
            preferences.paymentType = paymentType;
            preferences.consents = consents;

            if (paymentType === 'card') {
                preferences.cardDetails = cardDetails;
            } else {
                preferences.cardDetails = undefined;
            }

            await preferences.save();
            res.json({ message: 'Preferences updated successfully', preferences });
        } else {
            const preferencesData = {
                customer: req.user.id,
                allergens,
                paymentType,
                consents
            };

            if (paymentType === 'card') {
                preferencesData.cardDetails = cardDetails;
            }

            preferences = new Preference(preferencesData);
            await preferences.save();
            res.status(201).json({
                message: 'Preferences saved successfully',
                preferences
            });
        }
    } catch (err) {
        console.error(`Error saving preferences: ${err.message}`);

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Invalid input',
                details: err.errors
            });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.updatePreferences = async (req, res) => {
    try {
        const preferences = await Preference.findOne({ customer: req.user.id });

        if (!preferences) {
            return res.status(404).json({ message: 'No preferences found for this user' });
        }

        const updates = req.body;

        if (updates.consents) {
            preferences.consents = {
                ...preferences.consents,
                ...updates.consents
            };
        }

        if (updates.cardDetails && (preferences.paymentType === 'card' || updates.paymentType === 'card')) {
            preferences.cardDetails = {
                ...preferences.cardDetails,
                ...updates.cardDetails
            };
        }

        if (updates.allergens) preferences.allergens = updates.allergens;
        if (updates.paymentType) {
            preferences.paymentType = updates.paymentType;
            // If changing to cash, remove card details
            if (updates.paymentType === 'cash') {
                preferences.cardDetails = undefined;
            }
        }

        await preferences.save();
        res.json({
            message: 'Preferences updated successfully',
            preferences
        });
    } catch (err) {
        console.error(`Error updating preferences: ${err.message}`);

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Invalid input',
                details: err.errors
            });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.deletePreferences = async (req, res) => {
    try {
        const result = await Preference.deleteOne({ customer: req.user.id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No preferences found for this user' });
        }

        res.json({ message: 'Preferences deleted successfully' });
    } catch (err) {
        console.error(`Error deleting preferences: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};
