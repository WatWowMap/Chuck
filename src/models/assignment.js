'use strict';

const config = require('../config.json');
const MySQLConnector = require('../services/mysql.js');
const db = new MySQLConnector(config.db);

/**
 * Assignment model class.
 */
class Assignment {

    /**
     * Initialize new Assignment object.
     */
    constructor(id, instanceName, sourceInstanceName, deviceUUID, time = 0, date = null, enabled = true) {
        this.id = id;
        this.instanceName = instanceName;
        this.sourceInstanceName = sourceInstanceName || null;
        this.deviceUUID = deviceUUID;
        this.time = time;
        this.date = date;
        this.enabled = enabled;
    }

    static async getAll() {
        let sql = `
        SELECT id, device_uuid, instance_name, source_instance_name, time, date, enabled
        FROM assignment
        `;
        let results = await db.query(sql);
        let assignments = [];
        if (results && results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                let result = results[i];
                assignments.push(new Assignment(
                    result.id,
                    result.instance_name,
                    result.source_instance_name,
                    result.device_uuid,
                    result.time,
                    result.date,
                    result.enabled
                ));
            }
        }
        return assignments;
    }

    static async getById(id) {
        let sql = `
        SELECT id, device_uuid, instance_name, source_instance_name, time, date, enabled
        FROM assignment
        WHERE id = ?
        `;
        let args = [id];
        let results = await db.query(sql, args);
        if (results && results.length > 0) {
            let result = results[0];
            return new Assignment(
                result.id,
                result.instance_name,
                result.source_instance_name,
                result.device_uuid,
                result.time,
                result.date,
                result.enabled
            );
        }
        return null;
    }

    static async deleteById(id) {
        let sql = `
        DELETE FROM assignment
        WHERE id = ?
        `;
        let args = [id];
        try {
            let results = await db.query(sql, args);
            //console.log('[Assignment] DeleteById:', results);
        } catch (err) {
            console.error('[Assignment] Error:', err);
        }
    }

    static async deleteAll() {
        let sql = `
        DELETE FROM assignment
        `;
        try {
            let results = await db.query(sql);
            //console.log('[Assignment] DeleteAll:', results);
        } catch (err) {
            console.error('[Assignment] Error:', err);
        }
    }

    async save() {
        let sql = `
        INSERT INTO assignment (id, device_uuid, instance_name, source_instance_name, time, date, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            device_uuid=VALUES(device_uuid),
            instance_name=VALUES(instance_name),
            source_instance_name=VALUES(source_instance_name),
            time=VALUES(time),
            date=VALUES(date),
            enabled=VALUES(enabled)
        `;
        let args = [this.id, this.deviceUUID, this.instanceName, this.sourceInstanceName, this.time || 0, this.date, this.enabled];
        try {
            let results = await db.query(sql, args);
            //console.log('[Assignment] Save:', results);
        } catch (err) {
            console.error('[Assignment] Error:', err);
        }
    }
}

module.exports = Assignment;
