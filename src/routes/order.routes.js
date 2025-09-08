const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../auth.middleware');

router.post('/', auth, orderController.createOrder);

router.get('/restaurant', auth, orderController.getOrdersByRestaurant);
router.get('/customer', auth, orderController.getOrdersByCustomer);
router.get('/statuses', orderController.getOrderStatuses);

router.get('/:id', auth, orderController.getOrderById);

router.get('/:id/transitions', auth, orderController.getAvailableTransitions);
router.put('/:id/status', auth, orderController.updateStatus);

module.exports = router;