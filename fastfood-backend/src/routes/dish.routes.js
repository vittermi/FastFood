const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dish.controller');
const auth = require('../auth.middleware');

router.post('/', auth, dishController.createDish);

router.get('/templates', dishController.getTemplateDishes);
router.get('/:id', dishController.getDishById);

module.exports = router;