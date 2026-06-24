const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');
const logger = require('../utils/logger');

const JWT_SECRET  = process.env.JWT_SECRET  || 'helpdesk_secret_change_in_prod';
const JWT_REFRESH = process.env.JWT_REFRESH || 'helpdesk_refresh_change_in_prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

function signAccess(payload)  { return jwt.sign(payload, JWT_SECRET,  { expiresIn: JWT_EXPIRES }); }
function signRefresh(payload) { return jwt.sign(payload, JWT_REFRESH, { expiresIn: '7d' }); }

// POST /auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, skills, phone } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, message: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      id: uuidv4(), name, email,
      password: hash,
      role: role || 'technician',
      skills: skills || [],
      phone: phone || null,
    });

    const { password: _, refreshToken: __, ...safe } = user.toJSON();
    res.status(201).json({ success: true, data: safe });
  } catch (err) { next(err); }
};

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken  = signAccess(payload);
    const refreshToken = signRefresh({ id: user.id });

    await user.update({ lastLogin: new Date(), refreshToken });

    const { password: _, refreshToken: __, ...safe } = user.toJSON();
    res.json({ success: true, data: safe, accessToken, refreshToken });
  } catch (err) { next(err); }
};

// POST /auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Token requerido' });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const accessToken = signAccess({ id: user.id, email: user.email, role: user.role });
    res.json({ success: true, accessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    next(err);
  }
};

// POST /auth/logout
exports.logout = async (req, res, next) => {
  try {
    if (req.user) await User.update({ refreshToken: null }, { where: { id: req.user.id } });
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch (err) { next(err); }
};

// GET /auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};
