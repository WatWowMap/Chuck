'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../services/sequelize.js');
const Device = require('./device.js');
const Instance = require('./instance.js');

/**
 * Assignment model class.
 */
class Assignment extends Model {

    /**
     * Get all available assignments.
     * @deprecated Use findAll.
     */
    static getAll() {
        return Assignment.findAll();
    }

    /**
     * Get all available assignments.
     * @param id
     * @deprecated Use findByPk.
     */
    static getById(id) {
        return Assignment.findByPk(id);
    }

    /**
     * Delete an instance by ID.
     * @param id
     */
    static deleteById(id) {
        return Assignment.destroy({
            where: { id },
        });
    }

    /**
     * Delete everything.
     */
    static deleteAll() {
        return Assignment.destroy();
    }
}

Assignment.init({
    deviceUuid: DataTypes.STRING,
    instanceName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    time: {
        type: DataTypes.MEDIUMINT(6).UNSIGNED,
        allowNull: false,
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
        type: DataTypes.DATE,
        defaultValue: null,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'assignment_fk_instance_name',
            fields: ['instanceName'],
        },
        {
            name: 'assignment_unique',
            unique: true,
            fields: ['deviceUuid', 'instanceName', 'time', 'date'],
        }
    ],
    tableName: 'assignment',
});

Device.Assignments = Device.hasMany(Assignment, { foreignKey: 'deviceUuid' });
Assignment.Device = Assignment.belongsTo(Device, { foreignKey: 'deviceUuid' });

Instance.Assignments = Instance.hasMany(Assignment, { foreignKey: 'instanceName' });
Assignment.Instance = Assignment.belongsTo(Instance, { foreignKey: 'instanceName' });

Instance.OwnedAssignments = Instance.hasMany(Assignment, { foreignKey: 'sourceInstanceName' });
Assignment.SourceInstance = Assignment.belongsTo(Instance, { foreignKey: 'sourceInstanceName' });

module.exports = Assignment;
