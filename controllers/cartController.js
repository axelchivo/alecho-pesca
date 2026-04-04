// controllers/cartController.js
// Maneja operaciones del carrito (checkout) y guarda pedidos.

const { readDb, writeDb } = require('../models/db');
const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const mercadopagoService = require('../services/mercadopagoService');

async function createMercadoPagoPreference(order, items, customer, baseUrl) {
  try {
    return await mercadopagoService.createPaymentPreference(order, items, customer, baseUrl);
  } catch (error) {
    console.error('Error creando preferencia de Mercado Pago:', error);
    throw error;
  }
}

function calculateTotals(items, userType, paymentMethod) {
  let total = 0;
  const detailedItems = items
    .map((item) => {
      const product = productModel.getById(item.productId);
      if (!product) return null;
      const unitPrice =
        userType === 'mayorista' && typeof product.wholesalePrice === 'number'
          ? product.wholesalePrice
          : product.price;
      const subtotal = unitPrice * item.quantity;
      total += subtotal;
      return {
        productId: product.id,
        name: product.name,
        price: unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    })
    .filter(Boolean);

  // Descuento para mayorista
  const discountRate = userType === 'mayorista' ? 0.1 : 0;
  const discount = total * discountRate;
  const afterDiscount = total - discount;

  // Recargos por forma de pago
  const paymentSettings = readDb().paymentSettings || {};
  const surchargeRates = {
    credito: paymentSettings.creditSurcharge || 0,
    debito: paymentSettings.debitSurcharge || 0,
    mercado_pago: paymentSettings.mercadoPagoFee || 0,
    transferencia: paymentSettings.transferFee || 0,
    efectivo: paymentSettings.cashFee || 0,
  };

  const surchargeRate = surchargeRates[paymentMethod] ?? 0;
  const surcharge = afterDiscount * surchargeRate;

  const finalTotal = afterDiscount + surcharge;

  return { total, discount, surcharge, finalTotal, items: detailedItems, surchargeRate };
}

exports.checkout = async (req, res) => {
  const { items, paymentMethod = 'efectivo', paymentDetails } = req.body;
  const userId = req.session?.userId;
  const user = userId ? await userModel.findById(userId) : null;
  const userType = user?.type || req.body?.userType || 'minorista';

  if (!items || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Carrito vacío' });
  }

  // Verificar stock
  for (const item of items) {
    const product = productModel.getById(item.productId);
    if (!product) {
      return res.status(400).json({ error: `Producto ${item.productId} no encontrado` });
    }
    if (product.stock != null && item.quantity > product.stock) {
      return res.status(400).json({ error: `No hay stock suficiente para ${product.name}` });
    }
  }

  const totals = calculateTotals(items, userType, paymentMethod);

  // Reducir stock después de confirmar
  for (const item of items) {
    productModel.adjustStock(item.productId, -item.quantity);
  }

  // Guardar pedido en el almacenamiento
  const db = readDb();
  db.orders = db.orders || [];
  const orderId = db.orders.length ? Math.max(...db.orders.map((o) => o.id)) + 1 : 1;
  const order = {
    id: orderId,
    userId: userId || null,
    userType,
    items: totals.items,
    total: totals.total,
    discount: totals.discount,
    surcharge: totals.surcharge,
    surchargeRate: totals.surchargeRate,
    finalTotal: totals.finalTotal,
    paymentMethod,
    paymentDetails: paymentDetails || null,
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  writeDb(db);

  // Si es Mercado Pago intentamos generar preference de pago y devolver URL
  let redirectUrl = null;
  let preferenceId = null;
  if (paymentMethod === 'mercado_pago') {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      // Preparar datos del cliente
      const customer = user ? {
        name: user.name || 'Cliente',
        email: user.email,
        phone: user.phone ? {
          area_code: user.phone.split('-')[0] || '',
          number: user.phone.split('-')[1] || user.phone
        } : undefined,
        document: user.document ? {
          type: 'DNI',
          number: user.document
        } : undefined
      } : {};

      const mpResponse = await createMercadoPagoPreference(order, totals.items, customer, baseUrl);
      redirectUrl = mpResponse.init_point;
      preferenceId = mpResponse.preference_id;

      // Guardar el preference_id en la orden
      order.paymentId = preferenceId;
      writeDb(db); // Actualizar la orden con el paymentId

    } catch (err) {
      // No bloqueamos la compra por errores de integración, solo informamos
      console.error('Mercado Pago error:', err);
    }
  }

  res.json({
    success: true,
    message: 'Compra procesada (simulada)',
    order,
    redirectUrl,
    preferenceId
  });
};
