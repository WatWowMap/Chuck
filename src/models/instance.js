'use strict';

const InstanceType = require('../data/instance-type.js');
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../services/sequelize.js');

class Instance extends Model {
    /**
     * Load all instances.
     * @deprecated Use findAll.
     */
    static getAll() {
        return Instance.findAll();
    }

    /**
     * Get instance by name.
     * @deprecated Use findByPk.
     */
    static getByName(name) {
        return Instance.findByPk(name);
    }

    static async deleteByName(name) {
        const results = await Instance.destroy({
            where: { name: name },
        });

        //console.log('[Instance] DeleteByName:', results);
    }
}

Instance.init({
    name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('circlePokemon', 'circleRaid', 'circleSmartRaid', 'autoQuest', 'pokemonIv'),
        allowNull: false,
    },
    data: {
        type: DataTypes.JSONTEXT('long'),
        allowNull: false,
    },
}, {
    sequelize,
    timestamps: false,
    tableName: 'instance',
});

module.exports = Instance;
