// controllers/adminController.js
// Controlador para acciones administrativas (productos, configuración de pagos, etc.)

const fs = require('fs');
const productModel = require('../models/productModel');
const { readDb, writeDb } = require('../models/db');
const { sanitizeString } = require('../utils/sanitize');
const productService = require('../services/productService');
const userService = require('../services/userService');

exports.getProducts = (req, res) => {
  const products = productModel.getAll();
  res.json(products);
};

exports.getProduct = (req, res) => {
  const product = productModel.getById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
};

const IMAGE_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIMETYPES = new Set(['video/mp4', 'video/webm', 'video/ogg']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20MB

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function validateUploadedFiles(files) {
  const invalid = [];
  Array.from(files).forEach((file) => {
    const { mimetype, size, originalname, path } = file;
    const isImage = IMAGE_MIMETYPES.has(mimetype);
    const isVideo = VIDEO_MIMETYPES.has(mimetype);

    if (!isImage && !isVideo) {
      invalid.push(`${originalname} (tipo no permitido: ${mimetype})`);
      if (path) fs.unlinkSync(path);
      return;
    }

    if (isImage && size > MAX_IMAGE_BYTES) {
      invalid.push(
        `${originalname} (imagen demasiado grande: ${formatBytes(size)} > ${formatBytes(MAX_IMAGE_BYTES)})`
      );
      if (path) fs.unlinkSync(path);
      return;
    }

    if (isVideo && size > MAX_VIDEO_BYTES) {
      invalid.push(
        `${originalname} (video demasiado grande: ${formatBytes(size)} > ${formatBytes(MAX_VIDEO_BYTES)})`
      );
      if (path) fs.unlinkSync(path);
      return;
    }
  });
  return invalid;
}

exports.createProduct = (req, res) => {
  try {
    const { name, price, category, rating, image, stock, description, images, videos } = req.body;

    const sanitizedImages = Array.isArray(images)
      ? images.map(sanitizeString)
      : images
        ? [sanitizeString(images)]
        : [];
    const sanitizedVideos = Array.isArray(videos)
      ? videos.map(sanitizeString)
      : videos
        ? [sanitizeString(videos)]
        : [];

    const product = productService.createProduct({
      name: sanitizeString(name),
      price,
      category: sanitizeString(category),
      rating,
      image: sanitizeString(image),
      stock,
      description: sanitizeString(description),
      images: sanitizedImages,
      videos: sanitizedVideos,
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Sanitizar campos que pueden contener texto libre
    if (typeof updates.name === 'string') updates.name = sanitizeString(updates.name);
    if (typeof updates.category === 'string') updates.category = sanitizeString(updates.category);
    if (typeof updates.image === 'string') updates.image = sanitizeString(updates.image);
    if (typeof updates.description === 'string')
      updates.description = sanitizeString(updates.description);

    if (Array.isArray(updates.images)) {
      updates.images = updates.images.map(sanitizeString);
    }
    if (Array.isArray(updates.videos)) {
      updates.videos = updates.videos.map(sanitizeString);
    }

    const product = productService.updateProduct(id, updates);
    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    productService.deleteProduct(id);
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.getSettings = (req, res) => {
  const db = readDb();
  const settings = db.paymentSettings || {};
  // No exponemos tokens sensibles
  const { mercadopagoAccessToken, ...publicSettings } = settings;
  res.json(publicSettings);
};

exports.updateSettings = (req, res) => {
  const db = readDb();
  db.paymentSettings = {
    ...db.paymentSettings,
    ...req.body,
  };
  writeDb(db);
  res.json({ success: true, paymentSettings: db.paymentSettings });
};

exports.getUsers = (req, res) => {
  const { getUsers } = require('../models/userModel');
  const users = getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    type: u.type,
    isAdmin: u.isAdmin,
    location: u.location || '',
    createdAt: u.createdAt,
  }));
  res.json(users);
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, isAdmin, password } = req.body;

    const toUpdate = {};
    if (type) toUpdate.type = type;
    if (typeof isAdmin !== 'undefined') toUpdate.isAdmin = isAdmin;
    if (password) toUpdate.password = password;

    const user = await userService.updateUser(id, toUpdate);
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        isAdmin: user.isAdmin,
        location: user.location || '',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;
  const currentUserId = req.session?.userId;
  if (currentUserId && parseInt(id, 10) === currentUserId) {
    return res.status(400).json({ error: 'No se puede eliminar al usuario actualmente conectado' });
  }

  const db = readDb();
  const users = db.users || [];
  const index = users.findIndex((u) => u.id === parseInt(id, 10));
  if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  users.splice(index, 1);
  db.users = users;
  writeDb(db);

  res.json({ success: true });
};

exports.getReviews = (req, res) => {
  const db = readDb();
  const reviews = db.reviews || [];
  res.json(reviews);
};

exports.deleteReview = (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const reviews = db.reviews || [];
  const index = reviews.findIndex((r) => r.id === parseInt(id, 10));
  if (index === -1) return res.status(404).json({ error: 'Reseña no encontrada' });
  reviews.splice(index, 1);
  db.reviews = reviews;
  writeDb(db);
  res.json({ success: true });
};

exports.uploadMedia = (req, res) => {
  if (!req.files || !req.files.length)
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  const invalid = validateUploadedFiles(req.files);
  if (invalid.length) {
    return res.status(400).json({ error: `Archivos inválidos: ${invalid.join(', ')}` });
  }
  const urls = req.files.map((file) => `/uploads/${file.filename}`);
  res.json({ success: true, urls });
};

exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  const invalid = validateUploadedFiles([req.file]);
  if (invalid.length) {
    return res.status(400).json({ error: `Archivo inválido: ${invalid.join(', ')}` });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url });
};
