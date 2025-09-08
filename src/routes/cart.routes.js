const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const auth = require('../auth.middleware');

router.post('/', auth, cartController.addToCart);
router.get('/', auth, cartController.getCart);
router.delete('/', auth,  cartController.clearCart);

router.patch('/:dishId', auth, cartController.updateDishQuantity);

module.exports = router;