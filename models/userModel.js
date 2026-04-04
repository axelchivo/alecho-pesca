// models/userModel.js
// Usuarios persistidos en data/db.json o PostgreSQL según configuración

const bcrypt = require('bcryptjs');
const config = require('../config');

let UserModel;

// Si está configurado para usar PostgreSQL, usar Sequelize
if (config.dbType === 'postgresql') {
  const { User } = require('./sql');
  UserModel = User;
} else {
  // Mantener compatibilidad con JSON
  const { readDb, writeDb } = require('./db');

  function getUsers() {
    const db = readDb();
    db.users = db.users || [];
    return db.users;
  }

  function saveUsers(users) {
    const db = readDb();
    db.users = users;
    writeDb(db);
  }

  function nextId(users) {
    if (!users.length) return 1;
    return Math.max(...users.map((u) => u.id)) + 1;
  }

  UserModel = {
    getUsers,
    saveUsers,
    nextId,
  };
}

function hashPassword(password) {
  if (!password) return '';
  // Si ya está hasheada (bcrypt), devolverla tal cual
  if (typeof password === 'string' && password.startsWith('$2')) return password;
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(user, plain) {
  if (!user || !plain) return false;
  // Si no es bcrypt, asumimos texto plano y comparamos directamente (para migración)
  const stored = user.password || '';
  if (stored.startsWith('$2')) {
    return bcrypt.compareSync(plain, stored);
  }
  return stored === plain;
}

const userModel = {
  create: async ({ name, email, password, type = 'minorista', isAdmin = false, location = '' }) => {
    if (config.dbType === 'postgresql') {
      const role = isAdmin ? 'admin' : 'user';
      const user = await UserModel.create({
        email,
        password: hashPassword(password),
        role,
      });
      return user.toJSON();
    } else {
      const users = UserModel.getUsers();
      const user = {
        id: UserModel.nextId(users),
        name,
        email,
        password: hashPassword(password),
        type,
        isAdmin,
        location,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      UserModel.saveUsers(users);
      return user;
    }
  },

  findByEmail: async (email) => {
    if (config.dbType === 'postgresql') {
      const user = await UserModel.findOne({ where: { email } });
      return user ? user.toJSON() : null;
    } else {
      const users = UserModel.getUsers();
      return users.find((u) => u.email === email);
    }
  },

  findById: async (id) => {
    if (config.dbType === 'postgresql') {
      const user = await UserModel.findByPk(id);
      return user ? user.toJSON() : null;
    } else {
      const users = UserModel.getUsers();
      return users.find((u) => u.id === parseInt(id));
    }
  },

  update: async (id, updates) => {
    if (config.dbType === 'postgresql') {
      const [affectedRows] = await UserModel.update(
        updates.password ? { ...updates, password: hashPassword(updates.password) } : updates,
        { where: { id } }
      );
      if (affectedRows === 0) return null;
      const user = await UserModel.findByPk(id);
      return user ? user.toJSON() : null;
    } else {
      const users = UserModel.getUsers();
      const user = users.find((u) => u.id === parseInt(id));
      if (!user) return null;
      if (updates.password) updates.password = hashPassword(updates.password);
      Object.assign(user, updates);
      UserModel.saveUsers(users);
      return user;
    }
  },

  verifyPassword,
};

module.exports = userModel;
