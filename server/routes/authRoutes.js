const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

router.post('/register', [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password at least 6 chars')
], authController.register);

// Accept either `username` or `email` for login
router.post('/login', [
  body('password').notEmpty().withMessage('Password required')
], authController.login);

module.exports = router;
