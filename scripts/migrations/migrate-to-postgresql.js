// scripts/migrations/migrate-to-postgresql.js
// Script para migrar datos de JSON a PostgreSQL

const config = require('../../config');
const { readDb } = require('../../models/db');
const { User, Product, Order, OrderItem, syncDatabase } = require('../../models/sql');

async function migrateUsers() {
  console.log('Migrando usuarios...');

  const db = readDb();
  const jsonUsers = db.users || [];

  for (const jsonUser of jsonUsers) {
    try {
      // Verificar si ya existe
      const existingUser = await User.findOne({ where: { email: jsonUser.email } });
      if (existingUser) {
        console.log(`Usuario ${jsonUser.email} ya existe, saltando...`);
        continue;
      }

      // Crear usuario en PostgreSQL
      await User.create({
        email: jsonUser.email,
        password: jsonUser.password,
        role: jsonUser.isAdmin ? 'admin' : 'user',
        createdAt: jsonUser.createdAt ? new Date(jsonUser.createdAt) : new Date(),
      });

      console.log(`Usuario ${jsonUser.email} migrado exitosamente`);
    } catch (error) {
      console.error(`Error migrando usuario ${jsonUser.email}:`, error);
    }
  }
}

async function migrateProducts() {
  console.log('Migrando productos...');

  const db = readDb();
  const jsonProducts = db.products || [];

  for (const jsonProduct of jsonProducts) {
    try {
      // Verificar si ya existe
      const existingProduct = await Product.findOne({ where: { name: jsonProduct.name } });
      if (existingProduct) {
        console.log(`Producto ${jsonProduct.name} ya existe, saltando...`);
        continue;
      }

      // Crear producto en PostgreSQL
      await Product.create({
        name: jsonProduct.name,
        description: jsonProduct.description || '',
        price: parseFloat(jsonProduct.price) || 0,
        category: jsonProduct.category || 'General',
        imageUrl: jsonProduct.imageUrl || null,
        stock: parseInt(jsonProduct.stock) || 0,
        isActive: jsonProduct.isActive !== false,
        createdAt: jsonProduct.createdAt ? new Date(jsonProduct.createdAt) : new Date(),
      });

      console.log(`Producto ${jsonProduct.name} migrado exitosamente`);
    } catch (error) {
      console.error(`Error migrando producto ${jsonProduct.name}:`, error);
    }
  }
}

async function migrateOrders() {
  console.log('Migrando órdenes...');

  const db = readDb();
  const jsonOrders = db.orders || [];

  for (const jsonOrder of jsonOrders) {
    try {
      // Buscar usuario por email
      const user = await User.findOne({ where: { email: jsonOrder.userEmail } });
      if (!user) {
        console.log(`Usuario ${jsonOrder.userEmail} no encontrado, saltando orden...`);
        continue;
      }

      // Crear orden en PostgreSQL
      const order = await Order.create({
        userId: user.id,
        total: parseFloat(jsonOrder.total) || 0,
        status: jsonOrder.status || 'pending',
        paymentMethod: jsonOrder.paymentMethod || null,
        paymentId: jsonOrder.paymentId || null,
        paymentStatus: jsonOrder.paymentStatus || 'pending',
        shippingAddress: jsonOrder.shippingAddress || null,
        createdAt: jsonOrder.createdAt ? new Date(jsonOrder.createdAt) : new Date(),
      });

      // Migrar items de la orden
      if (jsonOrder.items && Array.isArray(jsonOrder.items)) {
        for (const item of jsonOrder.items) {
          const product = await Product.findOne({ where: { name: item.name } });
          if (product) {
            await OrderItem.create({
              orderId: order.id,
              productId: product.id,
              quantity: parseInt(item.quantity) || 1,
              price: parseFloat(item.price) || 0,
            });
          }
        }
      }

      console.log(`Orden ${order.id} migrada exitosamente`);
    } catch (error) {
      console.error(`Error migrando orden:`, error);
    }
  }
}

async function runMigration() {
  try {
    console.log('Iniciando migración de JSON a PostgreSQL...');

    // Solo ejecutar si está configurado para PostgreSQL
    if (config.dbType !== 'postgresql') {
      console.log('La aplicación no está configurada para usar PostgreSQL. Establece DB_TYPE=postgresql en tu .env');
      return;
    }

    // Sincronizar base de datos
    await syncDatabase();

    // Migrar datos
    await migrateUsers();
    await migrateProducts();
    await migrateOrders();

    console.log('Migración completada exitosamente!');
  } catch (error) {
    console.error('Error durante la migración:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Script de migración completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en la migración:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, migrateUsers, migrateProducts, migrateOrders };