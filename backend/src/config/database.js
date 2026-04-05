const { getEnv } = require('./env');

const env = getEnv();

const databaseConfig = {
  connectionString: env.database.url,
  pool: {
    min: env.database.poolMin,
    max: env.database.poolMax,
  },
  statementTimeoutMs: env.database.statementTimeoutMs,
  ssl: false,
};

module.exports = { databaseConfig };