const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const userController = require('../controllers/user.controller');
const auth = require('../auth.middleware');
const { UserTypes } = require('../utils/enums'); 

router.post(
    '/',
    [
        check('username').notEmpty().withMessage('Username is required'),
        check('email').isEmail(),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        check('userType').isIn(Object.values(UserTypes)).withMessage('Invalid user type'),
    ], 
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    },
    userController.register
);

router.patch(
    '/:id', 
    [
        check('email').isEmail(),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        check('currentPassword').notEmpty().withMessage('Please insert current password'),
        check('userType').isIn(Object.values(UserTypes)).withMessage('Invalid user type'),
    ],
    auth,
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    },
    userController.update
);

router.delete('/:id', auth, userController.remove);

module.exports = router;
