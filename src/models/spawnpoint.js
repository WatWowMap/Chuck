'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../services/sequelize.js');

/**
 * Spawnpoint model class.
 */
class Spawnpoint extends Model {
    static upsertFromPokemon(pokemon) {
        let despawnSecond = null;
        if (pokemon.expireTimestampVerified && pokemon.expireTimestamp !== null) {
            const date = new Date(pokemon.expireTimestamp * 1000);
            despawnSecond = date.getSeconds() + date.getMinutes() * 60;
        }
        return Spawnpoint.upsert({
            id: pokemon.spawnId,
            lat: pokemon.lat,
            lon: pokemon.lon,
            updated: pokemon.updated,
            despawnSecond,
        }, {
            fields: despawnSecond === null ? ['lat', 'lon', 'updated'] : undefined,
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
