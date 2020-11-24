'use strict';

const InstanceType = require('../data/instance-type.js');
const { DataTypes, Model, Op, Sequelize } = require('sequelize');
const sequelize = require('../services/sequelize.js');

class Instance extends Model {

    /**
     * Initialize new Instance object.
     * @param name Name of the instance.
     * @param type Type of instance.
     * @param data Instance data containing area coordinates, minimum and maximum account level, etc.
     */
    constructor(name, type, data, count = 0) {
        this.name = name;
        this.type = type;
        this.data = data;
        this.count = count;
    }

    /**
     * Load all instances.
     */
    static async getAll() {
        return Instance.findAll({});
    }

    /**
     * Get instance by name.
     */
    static async getByName(name) {
        try {
            return await Instance.findOne({
                where: { name: name },
            });
        } catch (err) {
            console.error('[Instance] Error:', err);
            return null;
        }
    }

    static async deleteByName(name) {
        const results = await Instance.destroy({
            where: { name: name },
        });

        //console.log('[Instance] DeleteByName:', results);
    }

    async save() {
        const results = await Instance.update({
            name: this.uuid,
            type: this.type,
            data: this.data,
        });

        //console.log('[Instance] Save:', results);
    }
}

Instance.init({
    name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM(['circlePokemon','circleRaid','circleSmartRaid','autoQuest','pokemonIv']),
        allowNull: false,
    },
    data: {
        type: DataTypes.STRING.LONG,
        allowNull: false,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    tableName: 'instance',
});

module.exports = Instance;