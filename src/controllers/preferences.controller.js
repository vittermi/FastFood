const Preference = require('../models/Preference');
const bcrypt = require('bcryptjs');


// funge da mock per il gateway di pagamento, fa anche validazione ecc
async function validateCardAndProcessMock(cardDetails) {

    if (!cardDetails ||
        !cardDetails.cardHolder ||
        !cardDetails.cardNumber ||
        !cardDetails.expiryDate ||
        !cardDetails.cvv) {
        throw new Error('All card details (cardHolder, cardNumber, expiryDate, cvv) are required');
    }

    const payload = {
        cardHolder: cardDetails.cardHolder,
        cardNumber: cardDetails.cardNumber,
        expiryDate: cardDetails.expiryDate,
        cvv: cardDetails.cvv,
    };

    const encoded = await bcrypt.hash(JSON.stringify(payload), 12); // in un'app vera prendi token da payment gateway e.g. Stripe
    return {
        token: encoded,
        cardHolder: cardDetails.cardHolder,
        cardNumber: `**** **** **** ${(cardDetails.cardNumber || '').slice(-4)}`,
        expiryDate: cardDetails.expiryDate,
    };
}


exports.getPreferences = async (req, res) => {
    try {        
        const preferences = await Preference.findOne({ customer: req.user.id }).lean();

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
                message: 'Required consents missing'
            });
        }

        if (paymentType === 'card') {
            if ((!cardDetails || !cardDetails.cardHolder || !cardDetails.cardNumber ||
                !cardDetails.expiryDate || !cardDetails.cvv)) {
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
                preferences.cardDetails = await validateCardAndProcessMock(cardDetails);
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
                preferencesData.cardDetails = validateCardAndProcessMock(cardDetails);
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
            const currentCardDetails = preferences.cardDetails || {};
            const areDetailsEqual =
                currentCardDetails.cardHolder === updates.cardDetails.cardHolder &&
                currentCardDetails.cardNumber === updates.cardDetails.cardNumber &&
                currentCardDetails.expiryDate === updates.cardDetails.expiryDate

            if (!areDetailsEqual) {
                if (updates.paymentType === 'card' || (preferences.paymentType === 'card' && !updates.paymentType))
                    preferences.cardDetails = await validateCardAndProcessMock(updates.cardDetails);
                else preferences.cardDetails = undefined;

            }
        }

        if (updates.allergens) preferences.allergens = updates.allergens;

        if (updates.paymentType) {
            preferences.paymentType = updates.paymentType;
            if (updates.paymentType === 'cash') preferences.cardDetails = undefined;
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