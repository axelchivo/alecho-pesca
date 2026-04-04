// scripts/init-admin.js
// Script para inicializar usuario administrador

const userModel = require('../models/userModel');

async function createAdminUser() {
  const adminEmail = 'admin@alechopesca.com';
  const adminPassword = 'admin123';

  try {
    // Verificar si ya existe
    const existingUser = await userModel.findByEmail(adminEmail);
    if (existingUser) {
      console.log('Usuario administrador ya existe:', existingUser);
      return;
    }

    // Crear usuario administrador
    const adminUser = await userModel.create({
      name: 'Administrador',
      email: adminEmail,
      password: adminPassword,
      type: 'admin',
      isAdmin: true,
    });

    console.log('Usuario administrador creado exitosamente:', adminUser);
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
    throw error;
  }
}

if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('Script completado exitosamente');
    })
    .catch((error) => {
      console.error('Error en el script:', error);
      throw error;
    });
}

module.exports = { createAdminUser };
