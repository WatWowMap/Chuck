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
     * @param name
     * @deprecated Use findByPk.
     */
    static getByName(name) {
        return Instance.findByPk(name);
    }

    /**
     * Delete an instance by its name.
     * @param name
     */
    static async deleteByName(name) {
        const results = await Instance.destroy({
            where: { name: name },
        });

        //console.log('[Instance] DeleteByName:', results);
    }

    static fromString(type) {
        switch (type) {
            case 'circle_pokemon':
            case 'circlepokemon':
                return 'Circle Pokemon';
            case 'circle_raid':
            case 'circleraid':
                return 'Circle Raid';
            case 'circle_smart_raid':
                return 'Smart Circle Raid';
            case 'auto_quest':
            case 'autoquest':
                return 'Auto Quest';
            case 'pokemon_iv':
            case 'pokemoniv':
                return 'Pokemon IV';
        }
        return null;
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
