// server.js
const express = require('express');
const session = require('express-session');
const MongoStoreModule = require('connect-mongo');
const MongoStore = MongoStoreModule.create ? MongoStoreModule : MongoStoreModule.default;
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const config = require('./config');

const app = express();
const PORT = config.port;

// Asegurarse que exista el directorio de datos
if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });

// ======================
// Conexión a MongoDB Atlas
// ======================
mongoose.connect(config.mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB conectado correctamente'))
.catch((err) => {
  // En vez de process.exit(), lanzamos el error
  throw new Error('❌ Error conectando a MongoDB: ' + err.message);
});

// ======================
// Middlewares
// ======================
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let sessionConfig = {
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
  },
};

if (config.dbType === 'json') {
  console.log('Usando sesiones en memoria (JSON storage)');
} else {
  sessionConfig.store = MongoStore.create({
    mongoUrl: config.mongoUrl,
    ttl: 24 * 60 * 60,
    autoRemove: 'native',
    collectionName: 'sessions',
  });
  console.log('Usando MongoDB para sesiones');
}

app.use(session(sessionConfig));

// ======================
// Archivos estáticos
// ======================
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// Rutas de la API
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