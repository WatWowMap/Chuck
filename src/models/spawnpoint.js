'use strict';

const config = require('../config.json');
const MySQLConnector = require('../services/mysql.js');
const db = new MySQLConnector(config.db);

/**
 * Spawnpoint model class.
 */
class Spawnpoint {

    /**
     * Initialize new Spawnpoint object.
     * @param data 
     */
    constructor(id, lat, lon, despawnSecond, updated) {
        this.id = id;
        this.lat = lat;
        this.lon = lon;
        this.despawnSecond = despawnSecond;
        this.updated = updated;
    }

    /**
     * Get Spawnpoint by spawnpoint id.
     * @param spawnpointId 
     */
    static async getById(spawnpointId) {
        let sql = `
            SELECT id, lat, lon, updated, despawn_sec
            FROM spawnpoint
            WHERE id = ?
        `;
        let args = [spawnpointId];
        let results = await db.query(sql, args)
            .then(x => x)
            .catch(err => {
                console.error('[Spawnpoint] Error:', err);
            });
        if (results) {
            for (let i = 0; i < results.length; i++) {
                let result = results[i];
                return new Spawnpoint(
                    result.id,
                    result.lat,
                    result.lon,
                    result.despawn_sec,
                    result.updated
                );
            }
        }
        return null;
    }

    /**
     * Save Spawnpoint model data.
     */
    async save(update = false) {
        let oldSpawnpoint;
        try {
            oldSpawnpoint = await Spawnpoint.getById(this.id);
        } catch (err) {
            oldSpawnpoint = null;
        }
        this.updated = new Date().getTime() / 1000;

        if (!update && oldSpawnpoint) {
            return;
        }
        
        if (oldSpawnpoint) {
            if (!this.despawnSecond && oldSpawnpoint.despawnSecond) {
                this.despawnSecond = oldSpawnpoint.despawnSecond;
            }            
            if (this.lat === oldSpawnpoint.lat &&
                this.lon === oldSpawnpoint.lon &&
                this.despawnSecond === oldSpawnpoint.despawnSecond) {
                return;
            }
        }

        let sql = `
            INSERT INTO spawnpoint (id, lat, lon, despawn_sec, updated)
            VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())
            ON DUPLICATE KEY UPDATE
                lat=VALUES(lat),
                lon=VALUES(lon),
                updated=VALUES(updated),
                despawn_sec=VALUES(despawn_sec)
        `;
        let args = [this.id, this.lat, this.lon, this.despawnSecond || null];
        try {
            let results = await db.query(sql, args);
            //console.log('spawnpoint results:', results);
        } catch (err) {
            console.error('[Spawnpoint] Error:', err);
        }
    }
}

module.exports = Spawnpoint;