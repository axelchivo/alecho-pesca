// routes/admin.js
// Rutas administrativas para gestión de productos y configuración de pagos

const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

// Guardar uploads en public/uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/ogg',
]);

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB por archivo
  },
});

// Productos
router.get('/products', authController.ensureAdmin, adminController.getProducts);
router.get('/products/:id', authController.ensureAdmin, adminController.getProduct);
router.post('/products', authController.ensureAdmin, adminController.createProduct);
router.put('/products/:id', authController.ensureAdmin, adminController.updateProduct);
router.delete('/products/:id', authController.ensureAdmin, adminController.deleteProduct);

// Usuarios
router.get('/users', authController.ensureAdmin, adminController.getUsers);
router.put('/users/:id', authController.ensureAdmin, adminController.updateUser);
router.delete('/users/:id', authController.ensureAdmin, adminController.deleteUser);

// Reseñas
router.get('/reviews', authController.ensureAdmin, adminController.getReviews);
router.delete('/reviews/:id', authController.ensureAdmin, adminController.deleteReview);

// Configuración de métodos de pago
router.get('/settings', authController.ensureAdmin, adminController.getSettings);
router.put('/settings', authController.ensureAdmin, adminController.updateSettings);

// Subida de imágenes/videos (para que el admin los use en productos)
router.post(
  '/upload-media',
  authController.ensureAdmin,
  upload.array('files', 20),
  adminController.uploadMedia
);
router.post(
  '/upload-image',
  authController.ensureAdmin,
  upload.single('image'),
  adminController.uploadImage
);

module.exports = router;
