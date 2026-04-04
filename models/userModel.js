// models/userModel.js
// Usuarios persistidos en MongoDB o JSON según configuración

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config');

const isMongo = config.dbType === 'mongo' || config.dbType === 'mongodb';

let UserModel;

if (isMongo) {
  const userSchema = new mongoose.Schema(
    {
      name: { type: String, trim: true, required: true },
      email: { type: String, trim: true, lowercase: true, required: true, unique: true },
      password: { type: String, required: true },
      type: { type: String, default: 'minorista' },
      isAdmin: { type: Boolean, default: false },
      location: { type: String, default: '' },
    },
    {
      timestamps: { createdAt: 'createdAt', updatedAt: false },
      toJSON: {
        virtuals: true,
        versionKey: false,
        transform(doc, ret) {
          ret.id = ret._id?.toString();
          delete ret._id;
        },
      },
    }
  );

  UserModel = mongoose.models.User || mongoose.model('User', userSchema);
} else {
  // Mantener compatibilidad con JSON
  const { readDb, writeDb } = require('./db');

  const getUsers = () => {
    const db = readDb();
    db.users = db.users || [];
    return db.users;
  };

  const saveUsers = (users) => {
    const db = readDb();
    db.users = users;
    writeDb(db);
  };

  const nextId = (users) => {
    if (!users.length) return 1;
    return Math.max(...users.map((u) => u.id)) + 1;
  };

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
    if (isMongo) {
      const user = await UserModel.create({
        name,
        email,
        password: hashPassword(password),
        type,
        isAdmin,
        location,
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
    if (isMongo) {
      return UserModel.findOne({ email }).lean();
    } else {
      const users = UserModel.getUsers();
      return users.find((u) => u.email === email);
    }
  },

  findById: async (id) => {
    if (isMongo) {
      return UserModel.findById(id).lean();
    } else {
      const users = UserModel.getUsers();
      return users.find((u) => u.id === parseInt(id));
    }
  },

  update: async (id, updates) => {
    if (isMongo) {
      if (updates.password) updates.password = hashPassword(updates.password);
      const user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      return user;
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
