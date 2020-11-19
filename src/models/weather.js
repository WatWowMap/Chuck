'use strict';

const S2 = require('nodes2ts');

/**
 * Weather model class.
 */
class Weather {

    /**
     * Initialize new Weather object.
     * @param data 
     */
    constructor(id, level, latitude, longitude, gameplayCondition, windDirection, cloudLevel, rainLevel, windLevel, snowLevel, fogLevel, seLevel, severity, warnWeather, updated) {
        this.id = id;
        this.level = level;
        this.latitude = latitude;
        this.longitude = longitude;
        this.gameplayCondition = gameplayCondition;
        this.windDirection = windDirection;
        this.cloudLevel = cloudLevel;
        this.rainLevel = rainLevel;
        this.windLevel = windLevel;
        this.snowLevel = snowLevel;
        this.fogLevel = fogLevel;
        this.seLevel = seLevel;
        this.severity = severity;
        this.warnWeather = warnWeather;
        this.updated = updated;
    }

    /**
     * Get Weather object as sql string
     */
    toSql() {
        return `
        (
            ${this.id},
            ${this.level},
            ${this.latitude},
            ${this.longitude},
            ${this.gameplayCondition},
            ${this.windDirection},
            ${this.cloudLevel},
            ${this.rainLevel},
            ${this.windLevel},
            ${this.snowLevel},
            ${this.fogLevel},
            ${this.seLevel},
            ${this.severity},
            ${this.warnWeather},
            ${this.updated}
        )
        `;
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
                updated: this.updated || 1
            }
        };
    }
}

module.exports = Weather;
