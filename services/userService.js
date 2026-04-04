// services/userService.js
// Servicio de lógica de negocio para usuarios

const userModel = require('../models/userModel');
const { sanitizeString } = require('../utils/sanitize');

class UserService {
  // Validar datos de usuario
  validateUserData(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate || data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('El nombre es requerido');
      }
    }

    if (!isUpdate || data.email !== undefined) {
      if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
        errors.push('Email válido requerido');
      }
    }

    if (!isUpdate || data.password !== undefined) {
      if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
        errors.push('La contraseña debe tener al menos 6 caracteres');
      }
    }

    if (data.type && !['pescador', 'minorista', 'mayorista'].includes(data.type)) {
      errors.push('Tipo de usuario inválido');
    }

    return errors;
  }

  // Crear usuario
  async createUser(data) {
    const errors = this.validateUserData(data);
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }

    const cleanEmail = sanitizeString(data.email).toLowerCase();
    if (await userModel.findByEmail(cleanEmail)) {
      throw new Error('El correo ya está registrado');
    }

    return await userModel.create({
      name: sanitizeString(data.name),
      email: cleanEmail,
      password: data.password,
      type: data.type || 'minorista',
      isAdmin: data.isAdmin || false,
      location: data.location ? sanitizeString(data.location) : '',
    });
  }

  // Actualizar usuario
  async updateUser(id, data) {
    const errors = this.validateUserData(data, true);
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = sanitizeString(data.name);
    if (data.email !== undefined) updateData.email = sanitizeString(data.email).toLowerCase();
    if (data.password !== undefined) updateData.password = data.password;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin;
    if (data.location !== undefined) updateData.location = sanitizeString(data.location);

    const user = await userModel.update(id, updateData);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  // Cambiar contraseña con verificación
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!userModel.verifyPassword(user, currentPassword)) {
      throw new Error('Contraseña actual incorrecta');
    }

    if (newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }

    await userModel.update(userId, { password: newPassword });
    return true;
  }

  // Obtener perfil público de usuario
  async getPublicProfile(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      type: user.type,
      location: user.location || '',
      createdAt: user.createdAt,
    };
  }

  // Buscar usuarios (solo admin)
  searchUsers({ search, type, limit, offset } = {}) {
    let users = userModel.getUsers();

    if (type) {
      users = users.filter((u) => u.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower)
      );
    }

    // Paginación
    const total = users.length;
    if (offset) users = users.slice(offset);
    if (limit) users = users.slice(0, limit);

    // Remover datos sensibles
    users = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      type: u.type,
      isAdmin: u.isAdmin,
      location: u.location || '',
      createdAt: u.createdAt,
    }));

    return { users, total };
  }

  // Obtener estadísticas de usuarios
  getUserStats() {
    const users = userModel.getUsers();
    const totalUsers = users.length;
    const adminUsers = users.filter((u) => u.isAdmin).length;
    const userTypes = users.reduce((acc, u) => {
      acc[u.type] = (acc[u.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
      userTypes,
    };
  }
}

module.exports = new UserService();
