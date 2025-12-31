import { Sequelize } from 'sequelize';
import { config } from './config';
import { getLogger } from './logger';

const log = getLogger('sequelize');

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: config.postgres.host,
    port: Number(config.postgres.port),
    database: config.postgres.name,
    username: config.postgres.user,
    password: config.postgres.password,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    pool: {
        max: 25,
        min: 5,
        acquire: 30000,
        idle: 10000,
    },
    logging:
        config.environment === 'production'
            ? false
            : (msg) => {
                  if (typeof msg === 'string' && msg.toUpperCase().includes('ERROR')) {
                      log.error({ msg }, 'Sequelize');
                      return;
                  }
                  log.debug({ msg }, 'Sequelize');
              },
});

export default sequelize;
