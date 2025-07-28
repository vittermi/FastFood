const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dish.controller');
const auth = require('../auth.middleware');

router.get('/', dishController.getDishes);
router.get('/:id', dishController.getDishById);
router.get('/:restaurantId/dishes', dishController.getDishesForRestaurant);

router.post('/', auth, dishController.createDish);

module.exports = router;