// routes/payment.js
// Endpoint público para obtener configuraciones de pago (tasas de recargo)

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const paymentWebhookController = require('../controllers/paymentWebhookController');
const mercadopagoService = require('../services/mercadopagoService');

router.get('/settings', paymentController.getSettings);

// Configuración pública de Mercado Pago para el frontend
router.get('/mercadopago/config', (req, res) => {
  try {
    const config = mercadopagoService.getPublicConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo configuración de Mercado Pago' });
  }
});

// Webhook para notificaciones de Mercado Pago
router.post('/webhook', express.raw({ type: 'application/json' }), paymentWebhookController.handleWebhook);

// Endpoint para obtener información de un pago (solo para admin)
router.get('/payment/:id', async (req, res) => {
  try {
    // Verificar que sea admin
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const paymentInfo = await mercadopagoService.getPaymentInfo(req.params.id);
    res.json(paymentInfo);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo información del pago' });
  }
});

module.exports = router;
