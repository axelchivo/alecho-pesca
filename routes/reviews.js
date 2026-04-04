// routes/reviews.js
// Rutas para manejar reseñas de clientes

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

router.get('/', reviewController.list);
router.post('/', authController.ensureAuthenticated, reviewController.create);

module.exports = router;
