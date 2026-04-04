// config.js
// Centraliza configuración de la aplicación (env vars + defaults)

const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'fishing-secret-key',
  mongoUrl: process.env.MONGO_URL,
  dataDir: DATA_DIR,
  dbType: process.env.DB_TYPE || 'json',
  isTest: process.env.NODE_ENV === 'test',

  // Configuración de PostgreSQL
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'alecho_pesca',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },

  // Configuración de Mercado Pago
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
  },
};
