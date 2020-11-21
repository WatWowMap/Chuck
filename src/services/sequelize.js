'use strict';

const { DataTypes, Sequelize, ValidationError } = require('sequelize');
const config = require('../config.json');

class JsonTextDataType extends DataTypes.TEXT {
    constructor(length) {
        super(length);
    }

    _sanitize(value, options) {
        return options && options.reviver ? JSON.parse(value, options.reviver) : JSON.parse(value);
    }

    _stringify(value, options) {
        if (value === null) {
            return null;
        } else if (options.space !== undefined) {
            return JSON.stringify(value, options.replacer, options.space);
        } else if (options.replacer !== undefined) {
            return JSON.stringify(value, options.replacer);
        } else {
            return JSON.stringify(value);
        }
    }

    validate(value, options) {
        try {
            this._sanitize(value, options);
        } catch (err) {
            throw ValidationError(err.message);
        }
        return true;
    }
}

module.exports = {
    JsonTextDataType,
    // initialize the singleton database in-place; it should not be closed ever
    sequelize: new Sequelize(config.db.database, config.db.username, config.db.password, {
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
    }),
};
