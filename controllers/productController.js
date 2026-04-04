// controllers/productController.js
// Lógica relacionada con productos

const productModel = require('../models/productModel');

exports.list = (req, res) => {
  // filtros y paginación mediante query params
  const { category, search, page = 1, limit = 12 } = req.query;
  const all = productModel.filter({ category, search });
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));

  const start = (pageNum - 1) * size;
  const end = start + size;
  const items = all.slice(start, end);

  // Si se pide paginación, devolvemos un objeto con metadatos
  if (req.query.page || req.query.limit) {
    return res.json({
      items,
      total: all.length,
      page: pageNum,
      limit: size,
      totalPages: Math.ceil(all.length / size),
    });
  }

  res.json(items);
};

exports.getById = (req, res) => {
  const product = productModel.getById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
};
