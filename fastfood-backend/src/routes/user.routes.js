const express = require('express');
const router = express.Router();
const { check, ValidationResult } = require('express-validator');
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth.middleware');
const { UserType } = require('../utils/enums'); 

router.post(
    '/',
    [
        check('username').notEmpty().withMessage('Username is required'),
        check('email').isEmail(),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        check('userType').isIn(Object.values(UserType)).withMessage('Invalid user type'),
    ], 
    (req, res, next) => {
        const errors = ValidationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    },
    userController.register
);
router.put('/:id', auth, userController.update);
router.delete('/:id', auth, userController.remove);

module.exports = router;
