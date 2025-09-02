const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dish.controller');
const auth = require('../auth.middleware');

router.post('/', auth, dishController.createDish);

router.get('/templates', dishController.getTemplateDishes);
router.get('/templates/:id', dishController.getTemplateDishById);

router.get('/categories', dishController.getDishCategories);
router.get('/:id', dishController.getDishById);

router.patch('/:id', auth, dishController.updateDish);
router.delete('/:id', auth, dishController.deleteDish);

module.exports = router;