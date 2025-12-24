import { Sequelize } from 'sequelize';
import { config } from './config';

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: config.postgres.host,
    port: Number(config.postgres.port),
    database: config.postgres.name,
    username: config.postgres.user,
    password: config.postgres.password,
    logging: (msg) => {
        if (msg.includes('ERROR')) console.log(msg);
    },
});

export default sequelize;
