'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../services/sequelize.js');
const WebhookController = require('../services/webhook.js');
const Pokestop = require('./pokestop.js');

/**
 * Incident model class.
 */
class Incident extends Model {
    static fromFortFields = [
        'pokestopId',
        'startMs',
        'expirationMs',
        // 'displayType',
        'character',
        // 'pokestopStyle',
        'updatedMs',
    ];
    static fromIncidentDisplay(ms, pokestopId, incidentDisplay) {
        return Incident.build({
            id: incidentDisplay.incident_id,
            pokestopId,
            startMs: incidentDisplay.incident_start_ms,
            expirationMs: incidentDisplay.incident_expiration_ms,
            // displayType: incidentDisplay.incident_display_type,
            character: incidentDisplay.character_display.character,
            // pokestopStyle: incidentDisplay.character_display.style,
            updatedMs: ms,
        });
    }

    async triggerWebhook(pokestop, oldPokestop) {
        let oldIncident = null;
        try {
            oldIncident = await Incident.findByPk(this.id);
        } catch { }
        if (!oldIncident || (oldIncident.expirationMs || 0) < (this.expirationMs || 0)) {
            WebhookController.instance.addInvasionEvent(this.toJson('invasion', oldPokestop));
        }
        return false;
    }

    toJson(pokestop, oldPokestop) {
        return {
            type: "invasion",
            message: {
                pokestop_id: pokestop.id,
                latitude: pokestop.lat,
                longitude: pokestop.lon,
                pokestop_name: pokestop.name || oldPokestop && oldPokestop.name || "Unknown",
                url: pokestop.url || oldPokestop && oldPokestop.url,
                lure_expiration: pokestop.lureExpireTimestamp || 0,
                last_modified: pokestop.lastModifiedTimestamp || 0,
                enabled: pokestop.enabled || true,
                lure_id: pokestop.lureId || 0,
                // pokestop_display: this.displayType,
                incident_expire_timestamp: this.expirationMs / 1000,
                grunt_type: this.character,
                updated: this.updatedMs / 1000,
            }
        };
    }
}
Incident.init({
    id: {
        type: DataTypes.BIGINT(20),
        primaryKey: true,
        allowNull: false,
    },
    startMs: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
    },
    expirationMs: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
    },
    // displayType: {
    //     type: DataTypes.INTEGER(2),
    //     allowNull: false,
    //     defaultValue: 0,
    // },
    character: {
        type: DataTypes.INTEGER(2),
        allowNull: false,
    },
    // style: {
    //     type: DataTypes.INTEGER(2),
    //     allowNull: false,
    //     defaultValue: 0,
    // },
    updatedMs: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'ix_pokestop',
            fields: ['pokestopId', 'expirationMs'],
        },
    ],
    tableName: 'incident',
});

// Export the class
module.exports = Incident;
