// services/mercadopagoService.js
// Servicio para integración completa con Mercado Pago

const mercadopago = require('mercadopago');
const config = require('../config');

class MercadoPagoService {
  constructor() {
    this.configure();
  }

  configure() {
    const accessToken = config.mercadopago.accessToken;
    if (accessToken) {
      mercadopago.configure({
        access_token: accessToken,
        integrator_id: process.env.MERCADOPAGO_INTEGRATOR_ID // Opcional para integradores certificados
      });
    }
  }

  /**
   * Crea una preferencia de pago para Mercado Pago
   * @param {Object} order - Datos de la orden
   * @param {Array} items - Items de la orden
   * @param {Object} customer - Datos del cliente
   * @param {string} baseUrl - URL base de la aplicación
   * @returns {Object} - Respuesta de Mercado Pago con init_point
   */
  async createPaymentPreference(order, items, customer = {}, baseUrl) {
    try {
      if (!config.mercadopago.accessToken) {
        throw new Error('Mercado Pago no está configurado');
      }

      // Preparar items para Mercado Pago
      const mpItems = items.map(item => ({
        id: item.productId?.toString(),
        title: item.name,
        description: item.name,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.price),
        currency_id: 'ARS', // Moneda Argentina
        category_id: 'artículos_de_pesca' // Categoría específica
      }));

      // Configurar URLs de retorno
      const backUrls = {
        success: `${baseUrl}/cart.html?payment=success&order_id=${order.id}`,
        failure: `${baseUrl}/cart.html?payment=failure&order_id=${order.id}`,
        pending: `${baseUrl}/cart.html?payment=pending&order_id=${order.id}`
      };

      // Configurar preferencia
      const preference = {
        items: mpItems,
        payer: {
          name: customer.name || 'Cliente',
          email: customer.email || 'cliente@ejemplo.com',
          phone: customer.phone ? {
            area_code: customer.phone.area_code,
            number: customer.phone.number
          } : undefined,
          identification: customer.document ? {
            type: customer.document.type || 'DNI',
            number: customer.document.number
          } : undefined
        },
        back_urls: backUrls,
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_methods: [], // Permitir todos los métodos
          excluded_payment_types: [], // Permitir todos los tipos
          installments: 12, // Hasta 12 cuotas
          default_installments: 1
        },
        statement_descriptor: 'Alecho Pesca',
        external_reference: order.id?.toString(),
        expires: false, // La preferencia no expira
        notification_url: `${baseUrl}/api/payments/webhook`, // Webhook para notificaciones
        metadata: {
          order_id: order.id,
          user_id: order.userId,
          user_type: order.userType
        }
      };

      const response = await mercadopago.preferences.create(preference);

      return {
        preference_id: response.body.id,
        init_point: response.body.init_point,
        sandbox_init_point: response.body.sandbox_init_point,
        response: response.body
      };

    } catch (error) {
      console.error('Error creando preferencia de Mercado Pago:', error);
      throw new Error(`Error al crear preferencia de pago: ${error.message}`);
    }
  }

  /**
   * Obtiene información de un pago por ID
   * @param {string} paymentId - ID del pago
   * @returns {Object} - Información del pago
   */
  async getPaymentInfo(paymentId) {
    try {
      const response = await mercadopago.payment.get(paymentId);
      return response.body;
    } catch (error) {
      console.error('Error obteniendo información del pago:', error);
      throw error;
    }
  }

  /**
   * Procesa webhook de Mercado Pago
   * @param {Object} webhookData - Datos del webhook
   * @returns {Object} - Resultado del procesamiento
   */
  async processWebhook(webhookData) {
    try {
      const { type, data } = webhookData;

      if (type === 'payment') {
        const paymentInfo = await this.getPaymentInfo(data.id);

        // Actualizar estado de la orden según el pago
        const orderId = paymentInfo.external_reference;
        const paymentStatus = paymentInfo.status;

        return {
          orderId,
          paymentId: data.id,
          status: paymentStatus,
          amount: paymentInfo.transaction_amount,
          paymentInfo
        };
      }

      return { processed: true, type };

    } catch (error) {
      console.error('Error procesando webhook:', error);
      throw error;
    }
  }

  /**
   * Cancela un pago
   * @param {string} paymentId - ID del pago a cancelar
   * @returns {Object} - Resultado de la cancelación
   */
  async cancelPayment(paymentId) {
    try {
      const response = await mercadopago.payment.cancel(paymentId);
      return response.body;
    } catch (error) {
      console.error('Error cancelando pago:', error);
      throw error;
    }
  }

  /**
   * Reembolsa un pago
   * @param {string} paymentId - ID del pago a reembolsar
   * @param {number} amount - Monto a reembolsar (opcional, total si no se especifica)
   * @returns {Object} - Resultado del reembolso
   */
  async refundPayment(paymentId, amount = null) {
    try {
      const refundData = amount ? { amount } : {};
      const response = await mercadopago.payment.refund(paymentId, refundData);
      return response.body;
    } catch (error) {
      console.error('Error reembolsando pago:', error);
      throw error;
    }
  }

  /**
   * Obtiene métodos de pago disponibles
   * @returns {Array} - Lista de métodos de pago
   */
  async getPaymentMethods() {
    try {
      const response = await mercadopago.payment_methods.list();
      return response.body;
    } catch (error) {
      console.error('Error obteniendo métodos de pago:', error);
      throw error;
    }
  }

  /**
   * Valida si Mercado Pago está configurado correctamente
   * @returns {boolean} - True si está configurado
   */
  isConfigured() {
    return !!(config.mercadopago.accessToken && config.mercadopago.publicKey);
  }

  /**
   * Obtiene la configuración pública para el frontend
   * @returns {Object} - Configuración pública
   */
  getPublicConfig() {
    return {
      publicKey: config.mercadopago.publicKey,
      configured: this.isConfigured()
    };
  }
}

module.exports = new MercadoPagoService();