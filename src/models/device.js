'use strict';

const config = require('../services/config.js');
const MySQLConnector = require('../services/mysql.js');
const db = new MySQLConnector(config.db);

const { DataTypes, Model, Op, Sequelize } = require('sequelize');
const sequelize = require('../services/sequelize.js');

/**
 * Device model class.
 */
class Device extends Model {

    /**
     * Initalize new Device object.
     * @param uuid 
     * @param instanceName 
     * @param accountUsername 
     * @param lastHost 
     * @param lastSeen 
     * @param lastLat 
     * @param lastLon 
     */
    constructor(uuid, instanceName, accountUsername, lastHost, lastSeen, lastLat, lastLon) {
        this.uuid = uuid;
        this.instanceName = instanceName;
        this.accountUsername = accountUsername;
        this.lastHost = lastHost;
        this.lastSeen = lastSeen;
        this.lastLat = lastLat;
        this.lastLon = lastLon;
    }

    /**
     * Get all available devices.
     */
    static getAll() {
        return Device.findAll({});
    }

    /**
     * Get device based on uuid.
     * @param uuid 
     */
    static async getById(uuid) {
        try {
            return await Device.findAll({
                where: { uuid: uuid },
            });
        } catch (err) {
            console.error('[Device] Error:', err);
            return [];
        }
    }

    /**
     * Set last device location.
     * @param uuid 
     * @param lat 
     * @param lon 
     */
    static async setLastLocation(uuid, lat, lon) {
        const results = await Device.update({
            lastLat: lat,
            lastLon: lon,
            lastSeen: Date.now() / 1000,
        }, {
            where: { uuid: uuid },
        });
        console.log('[Device] SetLastLocation:', results);
    }

    /**
     * Update host information for device.
     * @param uuid 
     * @param host 
     */
    static async touch(uuid, host, updateLastSeen) {
        const updateParams = {
            lastHost: host,
        };
        if (updateLastSeen) {
            updateParams['lastSeen'] = Date.now() / 1000;
        }
        const results = await Device.update(updateParams, {
            where: { uuid: uuid },
        });
        console.log('[Device] Touch:', results);
    }

    /**
     * Create device.
     */
    async create() {
        const results = await Device.create({
            uuid: this.uuid,
            instanceName = this.instanceName,
            accountUsername: this.accountUsername,
            lastHost: this.lastHost,
            lastSeen: this.lastSeen,
            lastLat: this.lastLat,
            lastLon: this.lastLon,
        });
        console.log('[Device] Insert:', results);
    }

    /**
     * Save device.
     * @param oldUUID 
     */
    async save(oldUUID = '') {
        const results = await Device.update({
            uuid: this.uuid,
            instanceName: this.instanceName,
            accountUsername: this.accountUsername,
            lastHost: this.lastHost,
            lastSeen: this.lastSeen,
            lastLat: this.lastLat,
            lastLon: this.lastLon,
        }, {
            where: { uuid: oldUUID },
        });
        //console.log('[Device] Save:', results);
    }
}

Device.init({
    uuid: {
        type: DataTypes.STRING(40),
        primaryKey: true,
        allowNull: false,
    },
    instance_name: {
        type: DataTypes.STRING(30),
        allowNull: true,
        defaultValue: null,
    },
    last_host: {
        type: DataTypes.STRING(40),
        allowNull: true,
        defaultValue: null,
    },
    last_seen: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    account_username: {
        type: DataTypes.STRING(128),
        allowNull: false,
        defaultValue: null,
    },
    last_lat: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
        defaultValue: 0,
    },
    last_lon: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'fk_instance_name',
            fields: ['instance_name'],
        },
        {
            name: 'uk_iaccount_username',
            fields: ['account_username'],
        },
    ],
    tableName: 'device',
});

// Export the class
module.exports = Device;
