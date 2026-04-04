// controllers/paymentWebhookController.js
// Maneja webhooks de Mercado Pago y actualiza estados de pago

const { readDb, writeDb } = require('../models/db');
const mercadopagoService = require('../services/mercadopagoService');

exports.handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;

    console.log('Webhook recibido:', webhookData);

    // Procesar el webhook con el servicio de Mercado Pago
    const result = await mercadopagoService.processWebhook(webhookData);

    if (result.type === 'payment') {
      // Actualizar el estado de la orden
      await updateOrderPaymentStatus(result.orderId, result.status, result.paymentId);

      console.log(`Orden ${result.orderId} actualizada con estado de pago: ${result.status}`);
    }

    // Responder a Mercado Pago
    res.status(200).send('OK');

  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).send('Error interno');
  }
};

/**
 * Actualiza el estado de pago de una orden
 * @param {string} orderId - ID de la orden
 * @param {string} paymentStatus - Estado del pago (approved, pending, rejected, etc.)
 * @param {string} paymentId - ID del pago en Mercado Pago
 */
async function updateOrderPaymentStatus(orderId, paymentStatus, paymentId) {
  const db = readDb();

  // Buscar la orden
  const order = db.orders?.find(o => o.id == orderId);
  if (!order) {
    console.warn(`Orden ${orderId} no encontrada`);
    return;
  }

  // Mapear estados de Mercado Pago a estados de orden
  const statusMapping = {
    'approved': 'paid',
    'pending': 'pending',
    'in_process': 'pending',
    'rejected': 'cancelled',
    'cancelled': 'cancelled',
    'refunded': 'cancelled',
    'charged_back': 'cancelled'
  };

  const newStatus = statusMapping[paymentStatus] || 'pending';

  // Actualizar la orden
  order.status = newStatus;
  order.paymentId = paymentId;
  order.paymentStatus = paymentStatus;
  order.updatedAt = new Date().toISOString();

  writeDb(db);

  console.log(`Orden ${orderId} actualizada: status=${newStatus}, paymentStatus=${paymentStatus}`);
}