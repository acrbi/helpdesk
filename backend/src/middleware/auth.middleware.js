// ─── auth.middleware.js ───────────────────────────────
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'helpdesk_secret_change_in_prod';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token de autorización requerido' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Usuario no válido o inactivo' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Acceso denegado: permisos insuficientes' });
  }
  next();
};

module.exports = { authenticate, authorize };
