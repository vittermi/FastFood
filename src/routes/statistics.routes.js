const express = require('express');
const statisticsController = require('../controllers/statistics.controller');
const auth = require('../auth.middleware');

const router = express.Router();

router.get('/summary', auth, statisticsController.getSummary);

router.get('/orders-per-day', auth, statisticsController.getOrdersPerDay);
router.get('/total-delivered', auth, statisticsController.getTotalDelivered);
router.get('/average-order-price', auth, statisticsController.getAverageOrderPrice);
router.get('/most-ordered-products', auth, statisticsController.getMostOrderedProducts);
router.get('/least-ordered-products', auth, statisticsController.getLeastOrderedProducts);

module.exports = router;
