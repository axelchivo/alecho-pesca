// controllers/paymentController.js
// Exponer configuraciones de métodos de pago para uso en el frontend

const { readDb } = require('../models/db');

exports.getSettings = (req, res) => {
  const db = readDb();
  res.json(db.paymentSettings || {});
};
