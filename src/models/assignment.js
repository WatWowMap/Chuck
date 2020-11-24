'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../services/sequelize.js');

/**
 * Assignment model class.
 */
class Assignment extends Model {

    /**
     * Get all available assignments.
     * @deprecated Use findAll.
     */
    static async getAll() {
        return Assignment.findAll();
    }

    /**
     * Get all available assignments.
     * @param id
     * @deprecated Use findByPk.
     */
    static async getById(id) {
        return Instance.findByPk(id);
    }

     /**
     * Delete an instance by ID.
     * @param id
     */
    static async deleteById(id) {
        const results = await Assignment.destroy({
            where: { id: id },
        });

        //console.error('[Assignment] Error:', results);
    }

     /**
     * Delete everything.
     */
    static async deleteAll() {
        const results = await Assignment.destroy({});

        //console.error('[Assignment] Error:', results);
    }
}

Assignment.init({
    deviceUuid: {
        type: DataTypes.STRING,
        unique: true,
    },
    instanceName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    time: {
        type: DataTypes.MEDIUMINT(6).UNSIGNED,
        allowNull: false,
        unique: true,
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
    },
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    sourceInstanceName: {
        type: DataTypes.STRING,
        defaultValue: null,
    },
    date: {
        type: DataTypes.MEDIUMINT.UNSIGNED,
        defaultValue: null,
        unique: true,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'assignment_fk_instance_name',
            fields: ['instance_name'],
        },
    ],
    tableName: 'assignment',
});

Device.Assignments = Device.hasMany(Assignment, {
    foreignKey: 'deviceUuid',
});
Assignment.Device = Assignment.belongsTo(Device);

Instance.Assignments = Instance.hasMany(Assignment, {
    foreignKey: 'instanceName',
});
Assignment.Instance = Assignment.belongsTo(Instance);

Instance.Assignments = Instance.hasMany(Assignment, {
    foreignKey: 'sourceInstanceName',
});
Assignment.Instance = Assignment.belongsTo(Instance);

module.exports = Assignment;
