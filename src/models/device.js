'use strict';

const { DataTypes, Model, Op, Sequelize } = require('sequelize');
const sequelize = require('../services/sequelize.js');

/**
 * Device model class.
 */
class Device extends Model {

    /**
     * Get all available devices.
     * @deprecated Use findAll.
     */
    static getAll() {
        return Device.findAll();
    }

    /**
     * Get device based on uuid.
     * @param uuid
     * @deprecated Use findByPk.
     */
    static getById(uuid) {
        return Device.findByPk(uuid);
    }

    /**
     * Get device based on account username.
     * @param username 
     */
    static async getByAccountUsername(username) {
        let sql = `
        SELECT uuid, instance_name, account_username, last_host, last_seen, last_lat, last_lon
        FROM device
        WHERE account_username = ?
        LIMIT 1
        `;
        let args = [username];
        let result = await db.query(sql, args)
            .then(x => x)
            .catch(err => { 
                console.error('[Device] Failed to get Device with account username', username, 'Error:', err);
            });
        let device;
        if (result) {
            let keys = Object.values(result);
            keys.forEach(key => {
                device = new Device(
                    key.uuid,
                    key.instance_name,
                    key.account_username,
                    key.last_host || '',
                    key.last_seen || 0,
                    key.last_lat || 0.0,
                    key.last_lon || 0.0
                );
            });
        }
        return device;
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
        //console.log('[Device] SetLastLocation:', results);
    }

    /**
     * Set device account username.
     * @param uuid 
     * @param username 
     */
    static async setAccountUsername(uuid, username) {
        if (username === '') {
            username = null;
        }
        let sql = `
        UPDATE device
        SET account_username = ?
        WHERE uuid = ?
        `;
        let args = [username, uuid];
        let results = await db.query(sql, args)
            .then(x => x)
            .catch(err => {
                console.error('[Device] Error:', err);
            });
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
            updateParams.lastSeen = Date.now() / 1000;
        }
        const results = await Device.update(updateParams, {
            where: { uuid: uuid },
        });
        console.log('[Device] Touch:', results);
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
        allowNull: true,
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
