'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../services/sequelize.js');

/**
 * Spawnpoint model class.
 */
class Spawnpoint extends Model {
    static fromPokemon(pokemon, despawnSecond = null, updated = new Date().getTime() / 1000) {
        return Spawnpoint.build({
            id: pokemon.spawnId,
            lat: pokemon.lat,
            lon: pokemon.lon,
            updated,
            despawnSecond,
        });
    }

    /**
     * Get Spawnpoint by spawnpoint id.
     * @param spawnpointId
     * @deprecated Use Spawnpoint.findByPk.
     */
    static getById(spawnpointId) {
        return Spawnpoint.findByPk(spawnpointId);
    }

    upsert() {
        return Spawnpoint.upsert(this.toJSON(), {
            fields: this.despawnSecond === null ? ['lat', 'lon', 'updated'] : undefined,
        });
    }
}
Spawnpoint.init({
    id: {
        type: DataTypes.BIGINT(20).UNSIGNED,
        primaryKey: true,
        allowNull: false,
    },
    lat: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
    },
    lon: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
    },
    updated: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    despawnSecond: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
        field: 'despawn_sec',
    },
}, {
    sequelize,
    timestamps: false,
    indexes: [
        {
            name: 'ix_coords',
            fields: ['lat', 'lon'],
        },
        {
            name: 'ix_updated',
            fields: ['updated'],
        },
    ],
    tableName: 'spawnpoint',
});

module.exports = Spawnpoint;
