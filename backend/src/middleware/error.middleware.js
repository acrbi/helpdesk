// error.middleware.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.path} → ${err.message}`, { stack: err.stack });

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({
      success: false,
      message: 'Error de validación en base de datos',
      errors: err.errors?.map(e => ({ field: e.path, message: e.message })),
    });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ success: false, message: 'Referencia a recurso inexistente' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Error interno del servidor' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
