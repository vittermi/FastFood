const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferences.controller');
const auth = require('../auth.middleware');



//todo add validation
router.post('/', auth, preferencesController.savePreferences);
router.get('/', auth, preferencesController.getPreferences);
router.put('/', auth, preferencesController.updatePreferences);

module.exports = router;