// controllers/reviewController.js
// Manejador de reseñas de clientes

const { readDb, writeDb } = require('../models/db');

exports.list = (req, res) => {
  const db = readDb();
  const all = db.reviews || [];
  const productId = req.query.productId ? parseInt(req.query.productId, 10) : null;

  const filtered = productId ? all.filter((r) => r.productId === productId) : all;
  res.json(filtered.slice(0, 50)); // limitar
};

exports.create = (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const { rating, comment, orderId, productId } = req.body;
  const user = require('../models/userModel').findById(userId);
  const db = readDb();
  db.reviews = db.reviews || [];

  if (!productId) {
    return res.status(400).json({ error: 'Debe especificar el producto para la reseña' });
  }

  if (!orderId) {
    return res.status(400).json({ error: 'Debe especificar el pedido para dejar una reseña' });
  }

  const order = (db.orders || []).find((o) => o.id === parseInt(orderId, 10));
  if (!order || order.userId !== userId) {
    return res.status(400).json({ error: 'No se puede dejar una reseña para este pedido' });
  }

  // Verificar que el pedido incluya el producto
  const bought =
    Array.isArray(order.items) && order.items.some((i) => i.productId === parseInt(productId, 10));
  if (!bought) {
    return res.status(400).json({ error: 'El pedido no contiene este producto' });
  }

  // Evitar múltiples reseñas para el mismo pedido/producto por el mismo usuario
  const exists = db.reviews.find(
    (r) => r.orderId === orderId && r.userId === userId && r.productId === parseInt(productId, 10)
  );
  if (exists) {
    return res.status(400).json({ error: 'Ya escribiste una reseña para este pedido y producto' });
  }

  const review = {
    id: db.reviews.length ? Math.max(...db.reviews.map((r) => r.id)) + 1 : 1,
    userId,
    userName: user?.name || 'Cliente',
    productId: parseInt(productId, 10),
    rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
    comment: (comment || '').trim(),
    orderId: parseInt(orderId, 10),
    createdAt: new Date().toISOString(),
  };

  db.reviews.unshift(review);
  writeDb(db);

  res.json({ success: true, review });
};
