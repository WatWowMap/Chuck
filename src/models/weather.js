'use strict';

const S2 = require('nodes2ts');
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../services/sequelize.js');
const WebhookController = require('../services/webhook.js');
const config = require('../services/config.js');

/**
 * Weather model class.
 */
class Weather extends Model {
    static fromClientWeatherFields = [
        'level',
        'latitude',
        'longitude',
        'gameplayCondition',
        'windDirection',
        'cloudLevel',
        'rainLevel',
        'windLevel',
        'snowLevel',
        'fogLevel',
        'seLevel',
        'severity',
        'warnWeather',
        'updated',
    ];
    static fromClientWeather(id, data, updated) {
        const s2cell = new S2.S2Cell(new S2.S2CellId(id));
        const center = s2cell.getRectBound().getCenter();
        const record = {
            id,
            level: s2cell.level,
            latitude: center.latDegrees,
            longitude: center.lngDegrees,
            gameplayCondition: data.gameplay_weather.gameplay_condition,
            windDirection: data.display_weather.wind_direction,
            cloudLevel: data.display_weather.cloud_level,
            rainLevel: data.display_weather.rain_level,
            windLevel: data.display_weather.wind_level,
            snowLevel: data.display_weather.snow_level,
            fogLevel: data.display_weather.fog_level,
            seLevel: data.display_weather.special_effect_level,
            updated,
        };
        const mostSevere = data.alerts.reduce((maxIndex, value, index, arr) => {
            return maxIndex < 0 || value.severity > arr[maxIndex].severity ? index : maxIndex;
        }, -1);
        if (mostSevere >= 0) {
            record.severity = data.alerts[mostSevere].severity;
            record.warnWeather = data.alerts[mostSevere].warn_weather;
        }
        return Weather.build(record);
    }

    async triggerWebhook() {
        if (!config.webhooks.enabled || config.urls.length === 0) {
            return;
        }

        WebhookController.instance.addWeatherEvent(this.toJson());
    }

    /**
     * Get Weather object as JSON object with correct property keys for webhook payload
     */
    toJson() {
        let s2cell = new S2.S2Cell(new S2.S2CellId(this.id));
        let polygon = [];
        for (let i = 0; i <= 3; i++) {
            let vertex = s2cell.getVertex(i);
            polygon.push([ vertex.x, vertex.y ]);
        }
        return {
            type: 'weather',
            message: {
                s2_cell_id: this.id,
                level: this.level,
                latitude: this.latitude,
                longitude: this.longitude,
                polygon: polygon,
                gameplay_condition: this.gameplayCondition,
                wind_direction: this.windDirection,
                cloud_level: this.cloudLevel,
                rain_level: this.rainLevel,
                wind_level: this.windLevel,
                snow_level: this.snowLevel,
                fog_level: this.fogLevel,
                special_effect_level: this.seLevel,
                severity: this.severity,
                warn_weather: this.warnWeather,
                updated: this.updated
            }
        };
    }
}
Weather.init({
    id: {
        type: DataTypes.BIGINT(30),
        primaryKey: true,
        allowNull: false,
    },
    level: {
        type: DataTypes.TINYINT(2).UNSIGNED,
        defaultValue: null,
    },
    latitude: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
        defaultValue: 0.00000000000000,
    },
    longitude: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
        defaultValue: 0.00000000000000,
    },
    gameplayCondition: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    windDirection: {
        type: DataTypes.MEDIUMINT(8),
        defaultValue: null,
    },
    cloudLevel: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    rainLevel: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    windLevel: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    snowLevel: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    fogLevel: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    seLevel: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
        field: 'special_effect_level',
    },
    severity: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    warnWeather: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    updated: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    tableName: 'weather',
});

module.exports = Weather;
