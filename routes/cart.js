// routes/cart.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authController = require('../controllers/authController');

// Checkout y registro de orden (requiere usuario autenticado)
router.post('/', authController.ensureAuthenticated, cartController.checkout);

module.exports = router;
