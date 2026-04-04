// controllers/orderController.js
// Registra pedidos en el sistema (archivo JSON)

const { readDb, writeDb } = require('../models/db');

exports.createOrder = (req, res) => {
  const { items, total, discount, finalTotal } = req.body;
  const userId = req.session?.userId || null;
  const db = readDb();

  const order = {
    id: db.orders?.length ? Math.max(...db.orders.map((o) => o.id)) + 1 : 1,
    userId,
    items,
    total,
    discount,
    finalTotal,
    createdAt: new Date().toISOString(),
  };

  db.orders = db.orders || [];
  db.orders.push(order);
  writeDb(db);

  res.json({ success: true, order });
};

exports.getOrders = (req, res) => {
  const db = readDb();
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const user = require('../models/userModel').findById(userId);
  const all = req.query.all === 'true' || req.query.all === '1';
  if (user?.isAdmin && all) {
    return res.json(db.orders || []);
  }

  const orders = (db.orders || []).filter((o) => o.userId === userId);
  res.json(orders);
};
