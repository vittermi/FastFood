const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../auth.middleware');

router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getOrders);
router.get('/:id', auth, orderController.getOrderById);
router.put('/:id/status', auth, orderController.updateStatus);

module.exports = router;