'use strict';

const path = require('path');
const fs = require('fs');
const sequelize = require('./sequelize.js');
const utils = require('./utils.js');

const migrationsDir = path.resolve(__dirname, '../../migrations');

/**
 * Database migration class
 */
class Migrator {

    constructor() {
        this.done = false;
    }

    async load() {
        let version = 0;
        const createMetadataTableSQL = `
        CREATE TABLE IF NOT EXISTS metadata (
            \`key\` VARCHAR(50) PRIMARY KEY NOT NULL,
            \`value\` VARCHAR(50) DEFAULT NULL
        );`;
        try {
            await sequelize.query(createMetadataTableSQL);
        } catch (err) {
            console.error(`[DBController] Failed to create metadata table: (${err})`);
            process.exit(-1);
        }
        
        const getDBVersionSQL = `
        SELECT \`value\`
        FROM metadata
        WHERE \`key\` = "DB_VERSION"
        LIMIT 1;`;
        const results = await sequelize.query(getDBVersionSQL)
            .then(x => x)
            .catch(err => {
                console.error(`[DBController] Failed to get current database version: (${err})`);
                process.exit(-1);
            });
        if (results.length > 0) {
            version = parseInt(results[0].value);
        }
    
        const newestVersion = this.getNewestDbVersion();
        console.log(`[DBController] Current: ${version}, Latest: ${newestVersion}`);
        if (version < newestVersion) {
            // Wait 30 seconds and let user know we are about to migrate the database and for them to make a backup until we handle backups and rollbacks.
            console.log('[DBController] MIGRATION IS ABOUT TO START IN 30 SECONDS, PLEASE MAKE SURE YOU HAVE A BACKUP!!!');
            await utils.snooze(30 * 1000);
        }
        this.migrate(version, newestVersion);
    }

    static async getEntries() {
        const sql = 'SELECT `key`, `value` FROM metadata';
        const results = await sequelize.query(sql);
        return results;
    }

    async migrate(fromVersion, toVersion) {
        if (fromVersion < toVersion) {
            console.log(`[DBController] Migrating database to version ${(fromVersion + 1)}`);
            await utils.snooze(5 * 1000);
            let migrateSQL;
            try {
                const sqlFile = `${migrationsDir}${path.sep}${fromVersion + 1}.sql`;
                migrateSQL = await utils.readFile(sqlFile);
                migrateSQL.replace('\r', '').replace('\n', '');
            } catch (err) {
                console.error(`[DBController] Migration failed: ${err}`);
                process.exit(-1);
            }
            const sqlSplit = migrateSQL.split(';');
            for (let i = 0; i < sqlSplit.length; i++) {
                const sql = sqlSplit[i];
                const msql = sql.replace('&semi', ';').trim();
                if (msql !== '') {
                    //console.log(`[DBController] Executing: ${msql}`);
                    await sequelize.query(msql)
                        .then(x => x)
                        .catch(async err => {
                            console.error(`[DBController] Migration failed: ${err}`);
                        });
                }
            }
            
            const newVersion = fromVersion + 1;
            const updateVersionSQL = `
            INSERT INTO metadata (\`key\`, \`value\`)
            VALUES("DB_VERSION", ${newVersion})
            ON DUPLICATE KEY UPDATE \`value\` = ${newVersion};`;
            try {
                await sequelize.query(updateVersionSQL);
            } catch (err) {
                console.error(`[DBController] Migration failed: ${err}`);
                process.exit(-1);
            }
            console.log('[DBController] Migration successful');
            this.migrate(newVersion, toVersion);
        }
        if (fromVersion === toVersion) {
            console.log('[DBController] Migration done');
            this.done = true;
        }
    }

    backup() {
        // TODO: Migrator backup
    }

    rollback() {
        // TODO: Migrator rollback
    }

    getNewestDbVersion() {
        let current = 0;
        let keepChecking = true;
        while (keepChecking) {
            if (fs.existsSync(`${migrationsDir}${path.sep}${current + 1}.sql`)) {
                current++;
            } else {
                keepChecking = false;
            }
        }
        return current;
    }

    static async getValueForKey(key) {
        const sql = `
        SELECT value
        FROM metadata
        WHERE \`key\` = ?
        LIMIT 1;`;
        const results = await sequelize.query(sql, {
            replacements: [key],
        })
            .then(x => x)
            .catch(err => {
                console.error(`[DbController] Error: ${err}`);
                return null;
            });
        if (results.length === 0) {
            return null;
        }
        const result = results[0];
        return result.value;
    }

    static async setValueForKey(key, value) {
        const sql = `
        INSERT INTO metadata (\`key\`, \`value\`)
        VALUES(?, ?)
        ON DUPLICATE KEY UPDATE
        value=VALUES(value);`;
        const results = await sequelize.query(sql, {
            replacements: [key, value],
        })
            .then(x => x)
            .catch(err => {
                console.error(`[DbController] Error: ${err}`);
                return null;
            });
        console.info(`[DbController] SetValueForKey: ${results}`);
    }
}

module.exports = Migrator;
