'use strict';

const { Sequelize } = require('sequelize');
const config = require('../config.json');

// initialize the singleton database in-place; it should not be closed ever
module.exports = new Sequelize(config.db.database, config.db.username, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    // TODO: customizable?
    dialect: 'mysql',
    dialectOptions: {
        supportBigNumbers: true,
    },
    define: {
        charset: config.db.charset,
    },
    pool: {
        max: config.db.connectionLimit,
    },
});
