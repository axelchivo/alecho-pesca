// scripts/init-admin.js
// Script para inicializar usuario administrador

const mongoose = require('mongoose');
require('dotenv').config();

const userModel = require('../models/userModel');

async function createAdminUser() {
  const adminEmail = 'admin@alechopesca.com';
  const adminPassword = 'admin123';

  try {
    // Conectar a MongoDB si se usa
    const dbType = (process.env.DB_TYPE || 'json').toLowerCase();
    const isMongo = dbType === 'mongo' || dbType === 'mongodb';

    if (isMongo) {
      const mongoUrl = process.env.MONGO_URL;
      if (!mongoUrl) {
        throw new Error('❌ MONGO_URL no está configurada en .env');
      }
      console.log('Conectando a MongoDB...');
      await mongoose.connect(mongoUrl);
      console.log('✅ Conectado a MongoDB');
    }

    // Verificar si ya existe
    const existingUser = await userModel.findByEmail(adminEmail);
    if (existingUser) {
      console.log('✅ Usuario administrador ya existe:', existingUser);
      return;
    }

    // Crear usuario administrador
    const adminUser = await userModel.create({
      name: 'Administrador',
      email: adminEmail,
      password: adminPassword,
      type: 'admin',
      isAdmin: true,
      isVerified: true,
    });

    console.log('✅ Usuario administrador creado exitosamente:', adminUser);
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
    throw error;
  }
}

if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✅ Script completado exitosamente');
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error.message);
      throw error;
    });
}

module.exports = { createAdminUser };