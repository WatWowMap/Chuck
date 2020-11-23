'use strict';

const config = require('../services/config.js');
const MySQLConnector = require('../services/mysql.js');
const db = new MySQLConnector(config.db);

/**
 * Device model class.
 */
class Device {

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
     * @param uuid 
     */
    static async getAll() {
        let sql = `
        SELECT uuid, instance_name, account_username, last_host, last_seen, last_lat, last_lon
        FROM device
        `;
        let result = await db.query(sql)
            .then(x => x)
            .catch(err => { 
                console.error('[Device] Failed to get all devices. Error:', err);
            });
        let devices = [];
        if (result) {
            let keys = Object.values(result);
            keys.forEach(key => {
                devices.push(new Device(
                    key.uuid,
                    key.instance_name,
                    key.account_username,
                    key.last_host || '',
                    key.last_seen || 0,
                    key.last_lat || 0.0,
                    key.last_lon || 0.0
                ));
            });
        }
        return devices;
    }

    /**
     * Get device based on uuid.
     * @param uuid 
     */
    static async getById(uuid) {
        let sql = `
        SELECT uuid, instance_name, account_username, last_host, last_seen, last_lat, last_lon
        FROM device
        WHERE uuid = ?
        LIMIT 1
        `;
        let args = [uuid];
        let result = await db.query(sql, args)
            .then(x => x)
            .catch(err => { 
                console.error('[Device] Failed to get Device with uuid', uuid, 'Error:', err);
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
        let sql = `
        UPDATE device
        SET last_lat = ?, last_lon = ?, last_seen = UNIX_TIMESTAMP()
        WHERE uuid = ?
        `;
        let args = [lat, lon, uuid];
        let results = await db.query(sql, args)
            .then(x => x)
            .catch(err => {
                console.error('[Device] Error:', err);
            });
        //console.log('[Device] SetLastLocation:', results);
    }

    /**
     * Update host information for device.
     * @param uuid 
     * @param host 
     */
    static async touch(uuid, host, updateLastSeen) {
        let sql;
        if (updateLastSeen) {
            sql = `
            UPDATE device
            SET last_host = ?, last_seen = UNIX_TIMESTAMP()
            WHERE uuid = ?
            `;
        } else {
            sql = `
            UPDATE device
            SET last_host = ?
            WHERE uuid = ?
            `;
        }
        let args = [host, uuid];
        let results = await db.query(sql, args)
            .then(x => x)
            .catch(err => {
                console.error('[Device] Error:', err);
            });
        //console.log('[Device] Touch:', results);
    }

    /**
     * Create device.
     */
    async create() {
        let sql = `
        INSERT INTO device (uuid, instance_name, account_username, last_host, last_seen, last_lat, last_lon)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        let args = [this.uuid, this.instanceName, this.accountUsername, this.lastHost, this.lastSeen, this.lastLat, this.lastLon];
        let results = await db.query(sql, args)
            .then(x => x)
            .catch(err => {
                console.error('[Device] Error:', err);
            });
        console.log('[Device] Insert:', results);
    }

    /**
     * Save device.
     * @param oldUUID 
     */
    async save(oldUUID = '') {
       let sql = `
       UPDATE device 
       SET uuid = ?, instance_name = ?, account_username = ?, last_host = ?, last_seen = ?, last_lat = ?, last_lon = ?
       WHERE uuid = ?
       `;
       let args = [this.uuid, this.instanceName, this.accountUsername, this.lastHost, this.lastSeen || 0, this.lastLat || 0, this.lastLon || 0, oldUUID];
       let results = await db.query(sql, args)
           .then(x => x)
           .catch(err => {
               console.error('[Device] Error:', err);
           });
        //console.log('[Device] Save:', results);
    }
}

// Export the class
module.exports = Device;
