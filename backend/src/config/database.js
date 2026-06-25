const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'helpdesk_pro',
  process.env.DB_USER     || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: (msg) => {
      if (process.env.DB_LOGGING === 'true') logger.debug(msg);
    },
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000,
    },
    define: {
      underscored:   true,
      timestamps:    true,
      paranoid:      true,   // soft delete
      freezeTableName: false,
    },
  }
);

module.exports = { sequelize, Sequelize };
