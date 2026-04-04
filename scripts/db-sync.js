// scripts/db-sync.js
// Script para sincronizar la base de datos

const { syncDatabase } = require('../models/sql');

async function main() {
  try {
    await syncDatabase();
    console.log('Base de datos sincronizada exitosamente');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error.message);
    process.exit(1);
  }
}

main();