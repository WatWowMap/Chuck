'use strict';

const { DataTypes, Model, Op, Sequelize } = require('sequelize');
const sequelize = require('../services/sequelize.js');

/**
 * Account model class.
 */
class Account extends Model {

    /**
     * Initialize new Account object.
     * @param username 
     * @param password 
     * @param firstWarningTimestamp 
     * @param failedTimestamp 
     * @param failed 
     * @param level 
     * @param lastEncounterLat 
     * @param lastEncounterLon 
     * @param lastEncounterTime 
     */
    /*
    constructor(username, password, firstWarningTimestamp, failedTimestamp, failed,
        level, lastEncounterLat, lastEncounterLon, lastEncounterTime, spins, tutorial,
        creationTimestampMs, warn, warnExpireTimestamp, warnMessageAcknowledged,
        suspendedMessageAcknowledged, wasSuspended, banned) {
        this.username = username;
        this.password = password;
        if (firstWarningTimestamp > 0) {
            this.firstWarningTimestamp = firstWarningTimestamp;
        }
        if (failedTimestamp > 0) {
            this.failedTimestamp = failedTimestamp;
        }
        this.failed = failed || null;
        this.level = level;
        this.lastEncounterLat = lastEncounterLat || null;
        this.lastEncounterLon = lastEncounterLon || null;
        if (lastEncounterTime > 0) {
            this.lastEncounterTime = lastEncounterTime;
        }
        this.spins = spins || 0;
        this.tutorial = tutorial || 0;
        this.creationTimestampMs = creationTimestampMs;
        this.warn = warn || null;
        this.warnExpireTimestamp = warnExpireTimestamp || null;
        this.warnMessageAcknowledged = warnMessageAcknowledged || null;
        this.suspendedMessageAcknowledged = suspendedMessageAcknowledged || null;
        this.wasSuspended = wasSuspended || null;
        this.banned = banned || null;
    }
    */

    parsePlayerData(playerData) {
        this.creationTimestampMs = parseInt(playerData.player_data.creation_timestamp_ms / 1000);
        this.warn = playerData.warn;
        let warnExpireTimestamp = parseInt(playerData.warn_expire_ms / 1000);
        if (warnExpireTimestamp > 0) {
            this.warnExpireTimestamp = warnExpireTimestamp;
        }
        this.warnMessageAcknowledged = playerData.warn_message_acknowledged;
        this.suspendedMessageAcknowledged = playerData.suspended_message_acknowledged;
        this.wasSuspended = playerData.was_suspended;
        this.banned = playerData.banned;

        if (playerData.warn && !failed) {
            this.failed = 'GPR_RED_WARNING';
            let ts = new Date().getTime() / 1000;
            if (!this.firstWarningTimestamp) {
                this.firstWarningTimestamp = ts;
            }
            this.failedTimestamp = ts;
            console.debug(`[Account] Account Name: ${self.username} - Username: ${playerData.player_data.username} - Red Warning: ${playerData.warn}`);
        }
        if (playerData.banned) {
            this.failed = 'GPR_BANNED';
            this.failedTimestamp = new Date().getTime() / 1000;
            console.debug(`[Account] Account Name: ${this.username} - Username: ${playerData.player_data.username} - Banned: ${playerData.banned}`);
        }
    }

    /**
     * Get new account between minimum and maximum level.
     * @param minLevel
     * @param maxLevel
     */
    static async getNewAccount(minLevel, maxLevel) {
        /*
        let sql = `
        SELECT username, password, level, first_warning_timestamp, failed_timestamp, failed,
            last_encounter_lat, last_encounter_lon, last_encounter_time, spins, tutorial,
            creation_timestamp_ms, warn, warn_expire_ms, warn_message_acknowledged,
            suspended_message_acknowledged, was_suspended, banned
        FROM account
        LEFT JOIN device ON username = account_username
        WHERE first_warning_timestamp is NULL AND failed_timestamp is NULL and device.uuid IS NULL AND level >= ? AND level <= ? AND failed IS NULL AND (last_encounter_time IS NULL OR UNIX_TIMESTAMP() - CAST(last_encounter_time AS SIGNED INTEGER) >= 7200)
        ORDER BY level DESC, RAND()
        LIMIT 1
        `;
        */
        const results = await Account.findOne({
            where: {
                firstWarningTimestamp: { [Op.ne]: null },
                failedTimestamp: { [Op.ne]: null },
                // device.uuid IS NULL,
                level: { [Op.gte]: minLevel, [Op.lte]: maxLevel },
                failed: { [Op.eq]: null },
                lastEncounterTime: { [Op.eq]: null },//, [Op.gte]: 7200 },
                
            }
        });
        return results;
        //return Account.createFromDbResults(results);
    }

    /**
     * Get account with username.
     * @param username 
     */
    static async getWithUsername(username) {
        try {
            return await Account.findOne({
                where: { username: username },
            });
        } catch (err) {
            console.error('[Account] Failed to get Account with username', username, 'Error:', err);
            return null;
        }
    }

    /**
     * Add encounter data to specified account.
     * @param username 
     * @param newLat 
     * @param newLon 
     * @param encounterTime 
     */
    static async didEncounter(username, newLat, newLon, encounterTime) {
        const results = await Account.update({
            lastEncounterLat: newLat,
            lastEncounterLon: newLon,
            lastEncounterTime: encounterTime,
        }, {
            where: { username: username },
        });
        //console.log('[Account] DidEncounter:', results);
    }

    /**
     * Set account level.
     * @param username 
     * @param level 
     */
    static async setLevel(username, level) {
        const results = await Account.update({
            level: level,
        }, {
            where: { username: username },
        });
        //console.log('[Account] SetLevel:', result);
    }

    /**
     * Set account spin count.
     * @param username 
     * @param level 
     */
    static async spin(username) {
        const results = await Account.increment('spins', {
            by: 1,
            where: { username: username }
        });
        //console.log('[Account] Spin:', result);
    }

    static async getStats() {
        let sql = `
        SELECT
            a.level AS level,
            COUNT(level) AS total,
            SUM(failed IS NULL AND first_warning_timestamp IS NULL) AS good,
            SUM(failed = 'banned') AS banned,
            SUM(first_warning_timestamp IS NOT NULL) AS warning,
            SUM(failed = 'invalid_credentials') AS invalid_creds,
            SUM(failed != 'banned' AND failed != 'invalid_credentials') AS other,
            SUM(last_encounter_time IS NOT NULL AND UNIX_TIMESTAMP() - CAST(last_encounter_time AS SIGNED INTEGER) < 7200) AS cooldown,
            SUM(spins >= 500) AS spin_limit,
            (SELECT count(username) FROM device as d LEFT JOIN accounts_dashboard as ad ON ad.username = d.account_username WHERE a.level = ad.level) AS in_use
        FROM account AS a
        GROUP BY level
        ORDER BY level DESC
        `;
        let results = await db.query(sql);        
        let stats = [];
        for (let i = 0; i < results.length; i++) {
            let result = results[i];
            let level = result.level || 0;
            let total = result.total || 0;
            let good = result.good || 0;
            let banned = result.banned || 0;
            let warning = result.warning || 0;
            let invalid = result.invalid_creds || 0;
            let other = result.other || 0;
            let cooldown = result.cooldown || 0;
            let spinLimit = result.spin_limit || 0;
            let inUse = result.in_use || 0;
            stats.push({
                "level": level,
                "total": total,
                "good": good,
                "banned": banned,
                "warning": warning,
                "invalid": invalid,
                "other": other,
                "cooldown": cooldown,
                "spin_limit": spinLimit,
				"in_use": inUse,
            });
        }
        return stats;
    }

    static async getStatCounts() {
        let sql = `
        SELECT 
            SUM(spins >= 3500) AS spin_limit_count,
            SUM(
                last_encounter_time IS NOT NULL
                AND UNIX_TIMESTAMP() - CAST(last_encounter_time AS SIGNED INTEGER) < 7200
            ) AS cooldown_count,
            SUM(failed IS NULL AND first_warning_timestamp IS NOT NULL) AS warned_count,
            SUM(failed IS NOT NULL) AS failed_count,
            SUM(
                level >= 30
                AND level <= 40
                AND first_warning_timestamp IS NULL
                AND failed IS NULL
            ) AS good_iv_count,
            SUM(level >= 30) AS iv_count,
            SUM(failed='banned' AND failed_timestamp >= UNIX_TIMESTAMP(NOW() - INTERVAL 1 DAY)) as banned_1day,
            SUM(failed='banned' AND failed_timestamp >= UNIX_TIMESTAMP(NOW() - INTERVAL 7 DAY)) as banned_7days,
            SUM(failed='banned') as banned_total,
            SUM(first_warning_timestamp >= UNIX_TIMESTAMP(NOW() - INTERVAL 1 DAY)) as warning_1day,
            SUM(first_warning_timestamp >= UNIX_TIMESTAMP(NOW() - INTERVAL 7 DAY)) as warning_7days,
            SUM(first_warning_timestamp IS NOT NULL) as warning_total
        FROM account;
        `;
        let results = await db.query(sql);
        if (results && results.length > 0) {
            const result = results[0];
            result.banned_1day = result.banned_1day || 0;
            result.banned_7days = result.banned_7days || 0;
            result.banned_total = result.banned_total || 0;
            result.warning_1day = result.warning_1day || 0;
            result.warning_7days = result.warning_7days || 0;
            result.warning_total = result.warning_total || 0;
            return result;
        }
        return null;
    }

    static async getDeviceAccountStats() {
        let sql = `
        SELECT
            SUM(
                first_warning_timestamp is NULL
                AND failed_timestamp is NULL 
                AND device.uuid IS NULL
                AND failed IS NULL
                AND (
                    last_encounter_time IS NULL
                    OR UNIX_TIMESTAMP() - CAST(last_encounter_time AS SIGNED INTEGER) >= 7200
                    AND spins < 400
                )
            ) AS new_count,
            SUM(device.uuid IS NOT NULL) AS in_use_count
        FROM account
        LEFT JOIN device ON username = account_username
            
        `;
        let results = await db.query(sql);
        if (results && results.length > 0) {
            const result = results[0];
            return result;
        }
        return null;
    }

    static async getTotalCount() {
        const results = await Account.count();
        return results || 0;
    }
}

Account.init({
    username: {
        type: DataTypes.STRING(32),
        primaryKey: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING(32),
        allowNull: false,
    },
    first_warning_timestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: true,
        defaultValue: null,
    },
    failed_timestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: true,
        defaultValue: null,
    },
    failed: {
        type: DataTypes.STRING(32),
        allowNull: true,
        defaultValue: null,
    },
    level: {
        type: DataTypes.TINYINT(3),
        allowNull: false,
        defaultValue: 0,
    },
    last_encounter_lat: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: true,
        defaultValue: null,
    },
    last_encounter_lon: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: true,
        defaultValue: null,
    },
    last_encounter_time: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: true,
        defaultValue: null,
    },
    spins: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    tutorial: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    creation_timestamp_ms: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: true,
        defaultValue: null,
    },
    warn: {
        type: DataTypes.TINYINT(1),
        allowNull: true,
        defaultValue: null,
    },
    warn_expire_ms: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: true,
        defaultValue: null,
    },
    warn_message_acknowledged: {
        type: DataTypes.TINYINT(1),
        allowNull: true,
        defaultValue: null,
    },
    suspended_message_acknowledged: {
        type: DataTypes.TINYINT(1),
        allowNull: true,
        defaultValue: null,
    },
    was_suspended: {
        type: DataTypes.TINYINT(1),
        allowNull: true,
        defaultValue: null,
    },
    banned: {
        type: DataTypes.TINYINT(1),
        allowNull: true,
        defaultValue: null,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    tableName: 'account',
});

// Export the class
module.exports = Account;
