// controllers/authController.js
// Maneja registro, login y sesiones de usuario

const userModel = require('../models/userModel');
const { sanitizeString } = require('../utils/sanitize');

exports.register = async (req, res) => {
  const { name, email, password, type, isAdmin } = req.body;
  const cleanEmail = sanitizeString(email || '').toLowerCase();
  const existingUser = await userModel.findByEmail(cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'El correo ya está registrado' });
  }

  // Solo un administrador puede crear otro administrador
  const currentUser = await userModel.findById(req.session.userId);  // Verifica si el creador es admin
  if (currentUser && currentUser.isAdmin === false && isAdmin) {
    return res.status(403).json({ error: 'No tienes permiso para crear un administrador' });
  }

  const user = await userModel.create({
    name: sanitizeString(name),
    email: cleanEmail,
    password,
    type: sanitizeString(type),
    isAdmin,  // Permite que el nuevo usuario tenga isAdmin según el valor enviado
  });
  req.session.userId = user.id;
  res.json({ success: true, user });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = sanitizeString(email || '').toLowerCase();
  const user = await userModel.findByEmail(cleanEmail);
  if (!user || !userModel.verifyPassword(user, password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Si estaba en texto plano, se actualiza a hash
  if (user.password && !user.password.startsWith('$2')) {
    await userModel.update(user.id, { password });
  }

  req.session.userId = user.id;
  console.log('🔍 Login - Session ID:', req.session.id);
  console.log('🔍 Login - User ID saved:', req.session.userId);
  console.log('🔍 Login - User isAdmin:', user.isAdmin);
  console.log('🔍 Login - Session cookie config:', req.session.cookie);

  // 🔥 Forzar guardado de sesión
  req.session.save((err) => {
    if (err) {
      console.error('❌ Error guardando sesión:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    console.log('✅ Sesión guardada correctamente');
    res.json({ success: true, user });
  });
};
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'No se pudo cerrar sesión' });
    res.json({ success: true });
  });
};

// middleware para proteger rutas
exports.ensureAuthenticated = async (req, res, next) => {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'No autorizado' });
};

exports.ensureAdmin = async (req, res, next) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const user = await userModel.findById(userId);
  if (!user || !user.isAdmin)
    return res.status(403).json({ error: 'Requiere permisos de administrador' });
  next();
};

exports.getMe = async (req, res) => {
  const userId = req.session?.userId;
  console.log('🔍 /me - Session ID:', req.session?.id);
  console.log('🔍 /me - User ID from session:', userId);
  if (!userId) return res.json({ user: null });
  const user = await userModel.findById(userId);
  console.log('🔍 /me - User found:', user ? user.email : 'null');
  res.json({
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          isAdmin: user.isAdmin,
          location: user.location || '',
        }
      : null,
  });
};

exports.updateMe = async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const user = await userModel.findById(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { name, location, currentPassword, newPassword } = req.body;
  const updates = {};

  if (name) updates.name = sanitizeString(name);
  if (typeof location === 'string') updates.location = sanitizeString(location);

  // Cambiar contraseña si se indica
  if (newPassword) {
    if (!currentPassword || !userModel.verifyPassword(user, currentPassword)) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }
    updates.password = newPassword;
  }

  const updated = await userModel.update(userId, updates);
  res.json({
    success: true,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      type: updated.type,
      isAdmin: updated.isAdmin,
      location: updated.location || '',
    },
  });
};