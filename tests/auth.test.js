// tests/auth.test.js
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
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

// Limpiar base de datos antes de cada test
beforeEach(() => {
  db.clearUsers();
});

describe('Auth Routes', () => {
  test('POST /auth/register - debería registrar un usuario', async () => {
    const response = await request(app).post('/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      type: 'pescador',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('test@example.com');
  });

  test('POST /auth/register - debería rechazar email duplicado', async () => {
    // Registrar primero
    await request(app).post('/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      type: 'pescador',
    });

    // Intentar registrar de nuevo
    const response = await request(app).post('/auth/register').send({
      name: 'Another User',
      email: 'test@example.com',
      password: 'password456',
      type: 'pescador',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('El correo ya está registrado');
  });

  test('POST /auth/login - debería loguear con credenciales correctas', async () => {
    // Registrar usuario
    await request(app).post('/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      type: 'pescador',
    });

    // Loguear
    const response = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('POST /auth/login - debería rechazar credenciales inválidas', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Credenciales inválidas');
  });

  test('GET /auth/me - debería devolver usuario si está logueado', async () => {
    // Registrar y loguear
    await request(app).post('/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      type: 'pescador',
    });

    const agent = request.agent(app);
    await agent.post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await agent.get('/auth/me');
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('test@example.com');
  });

  test('GET /auth/me - debería devolver null si no está logueado', async () => {
    const response = await request(app).get('/auth/me');
    expect(response.status).toBe(200);
    expect(response.body.user).toBe(null);
  });

  test('POST /auth/logout - debería cerrar sesión', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await agent.post('/auth/logout');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
