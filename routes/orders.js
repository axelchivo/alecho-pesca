// routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

router.get('/', authController.ensureAuthenticated, orderController.getOrders);

module.exports = router;
