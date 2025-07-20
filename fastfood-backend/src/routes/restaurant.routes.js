const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const auth = require('../auth.middleware');


router.post(
    '/',
    auth,
    [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required'),

        body('address')
            .trim()
            .notEmpty().withMessage('Address is required'),

        body('phone')
            .trim()
            .matches(/^\+?[0-9\s\-]{7,}$/).withMessage('Phone number is invalid'),

        body('vat')
            .matches(/^\d{11}$/)
            .withMessage('VAT must be exactly 11 digits'),

        body('hours').isArray({ min: 1 }).withMessage('Hours must be an array with at least one entry'),

        ...days.map(day =>
            body('hours')
                .custom((value) => {
                    const match = value.find(h => h.day === day);
                    if (!match) return true; // it's fine if a day is omitted (closed)
                    if (!match.open || !match.close) throw new Error(`${day} must have open and close`);
                    return true;
                })
        )
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    },
    restaurantController.createRestaurant
);
router.get('/', auth, restaurantController.getRestaurants);
router.get('/:id', auth, restaurantController.getRestaurantById);
router.put(
    '/:id',
    auth,
    [
        check('owner').isEmpty().withMessage('Owner cannot be changed'),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    },
    restaurantController.updateRestaurant
);
router.delete('/:id', auth, restaurantController.deleteRestaurant);