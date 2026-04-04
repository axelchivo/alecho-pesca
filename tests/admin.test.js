// tests/admin.test.js
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const adminRoutes = require('../routes/admin');
const authRoutes = require('../routes/auth');
const userModel = require('../models/userModel');
const db = require('../models/db');

// Configurar app de prueba
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Limpiar base de datos antes de cada test
beforeEach(() => {
  db.clearUsers();
  db.clearProducts();
});

describe('Admin Routes', () => {
  let adminAgent;
  let userAgent;

  beforeEach(async () => {
    // Crear usuario admin
    await request(app).post('/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      type: 'admin',
    });

    // Hacer admin manualmente
    const admin = userModel.findByEmail('admin@example.com');
    userModel.update(admin.id, { isAdmin: true });

    // Crear usuario normal
    await request(app).post('/auth/register').send({
      name: 'Normal User',
      email: 'user@example.com',
      password: 'user123',
      type: 'pescador',
    });

    // Agentes con sesión
    adminAgent = request.agent(app);
    await adminAgent.post('/auth/login').send({
      email: 'admin@example.com',
      password: 'admin123',
    });

    userAgent = request.agent(app);
    await userAgent.post('/auth/login').send({
      email: 'user@example.com',
      password: 'user123',
    });
  });

  test('GET /admin/products - debería requerir admin', async () => {
    const response = await userAgent.get('/admin/products');
    expect(response.status).toBe(403);
  });

  test('GET /admin/products - admin debería obtener productos', async () => {
    const response = await adminAgent.get('/admin/products');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /admin/products - debería crear producto', async () => {
    const response = await adminAgent.post('/admin/products').send({
      name: 'Test Product',
      price: 100,
      category: 'cañas',
      stock: 10,
      description: 'Test description',
    });

    expect(response.status).toBe(200);
    expect(response.body.product.name).toBe('Test Product');
  });

  test('PUT /admin/products/:id - debería actualizar producto', async () => {
    // Crear producto
    const createRes = await adminAgent.post('/admin/products').send({
      name: 'Test Product',
      price: 100,
      category: 'cañas',
      stock: 10,
      description: 'Test description',
    });

    const productId = createRes.body.product.id;

    // Actualizar
    const updateRes = await adminAgent.put(`/admin/products/${productId}`).send({
      name: 'Updated Product',
      price: 150,
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.product.name).toBe('Updated Product');
  });

  test('DELETE /admin/products/:id - debería eliminar producto', async () => {
    // Crear producto
    const createRes = await adminAgent.post('/admin/products').send({
      name: 'Test Product',
      price: 100,
      category: 'cañas',
      stock: 10,
      description: 'Test description',
    });

    const productId = createRes.body.product.id;

    // Eliminar
    const deleteRes = await adminAgent.delete(`/admin/products/${productId}`);
    expect(deleteRes.status).toBe(200);

    // Verificar que no existe
    const getRes = await adminAgent.get(`/admin/products/${productId}`);
    expect(getRes.status).toBe(404);
  });

  test('GET /admin/users - debería obtener usuarios', async () => {
    const response = await adminAgent.get('/admin/users');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('GET /admin/settings - debería obtener configuración', async () => {
    const response = await adminAgent.get('/admin/settings');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('creditSurcharge');
  });

  test('PUT /admin/settings - debería actualizar configuración', async () => {
    const response = await adminAgent.put('/admin/settings').send({
      creditSurcharge: 0.1,
      debitSurcharge: 0.02,
    });

    expect(response.status).toBe(200);
    expect(response.body.paymentSettings.creditSurcharge).toBe(0.1);
  });
});
