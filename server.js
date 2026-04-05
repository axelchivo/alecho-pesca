const express = require('express');
const session = require('express-session');
const MongoStoreModule = require('connect-mongo');
const MongoStore = MongoStoreModule.create ? MongoStoreModule : MongoStoreModule.default;
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();

// 🔥 IMPORTANTE PARA RENDER (cookies seguras detrás de proxy)
app.set('trust proxy', 1);

// ======================
// Configuración
// ======================
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default_secret';
const DB_TYPE = (process.env.DB_TYPE || 'json').toLowerCase();
const USE_MONGO = DB_TYPE === 'mongo' || DB_TYPE === 'mongodb';
const DATA_DIR = path.join(__dirname, 'data');

// Asegurar directorio de datos
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ======================
// Conexión a MongoDB
// ======================
if (USE_MONGO) {
  if (!MONGO_URL) throw new Error('❌ MONGO_URL no definida');

  mongoose
    .connect(MONGO_URL)
    .then(() => console.log('✅ MongoDB Atlas conectado correctamente'))
    .catch((err) => {
      throw new Error('❌ Error conectando a MongoDB: ' + err.message);
    });
}

// ======================
// Middlewares
// ======================
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ======================
// Sesiones
// ======================
let sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'none', // 🔥 Cambiar a 'none' para cross-site cookies
    secure: true, // 🔥 SIEMPRE true en Render (HTTPS)
  },
};

if (USE_MONGO) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: MONGO_URL,
    ttl: 24 * 60 * 60,
    autoRemove: 'native',
    collectionName: 'sessions',
  });
  console.log('Usando MongoDB para sesiones');
} else {
  console.log('Usando sesiones en memoria (JSON)');
}

app.use(session(sessionConfig));

// 🔥 Debug: Verificar configuración de sesión
console.log('🔍 Session config:', {
  secret: sessionConfig.secret ? 'SET' : 'NOT SET',
  resave: sessionConfig.resave,
  saveUninitialized: sessionConfig.saveUninitialized,
  cookie: sessionConfig.cookie,
  store: sessionConfig.store ? 'MongoStore configured' : 'Memory store'
});

// 🔥 Debug middleware para sesiones
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path} - Session ID:`, req.session?.id);
  console.log(`🔍 ${req.method} ${req.path} - User ID:`, req.session?.userId);
  next();
});

// ======================
// Archivos estáticos
// ======================
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// Rutas
// ======================
const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const reviewsRoutes = require('./routes/reviews');

app.use('/api/products', productsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewsRoutes);

// ======================
// Frontend fallback
// ======================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======================
// Error handler
// ======================
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 400;
  res.status(status).json({ error: err.message || 'Error en el servidor' });
});

// ======================
// Start server
// ======================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});