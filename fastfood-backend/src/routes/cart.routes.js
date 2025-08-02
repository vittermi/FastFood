const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const auth = require('../auth.middleware');

router.post('/', auth, cartController.addToCart);
router.get('/', auth, cartController.getCart);
router.delete('/', auth,  cartController.clearCart);
router.delete('/:dishId', auth, cartController.removeDishFromCart);

module.exports = router;