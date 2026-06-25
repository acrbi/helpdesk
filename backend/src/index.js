require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');
const http = require('http');
const { initSocket } = require('./services/socket.service');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
initSocket(server);

(async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión a PostgreSQL establecida');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('📋 Modelos sincronizados con la base de datos');
    }

    server.listen(PORT, () => {
      logger.info(`🚀 HelpDesk Pro API corriendo en puerto ${PORT}`);
      logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
  }
})();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    sequelize.close();
    process.exit(0);
  });
});
