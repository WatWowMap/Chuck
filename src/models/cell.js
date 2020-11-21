'use strict';

const S2N = require('nodes2ts');
const turf = require('@turf/turf');
const S2 = require('s2-geometry').S2;

const { DataTypes, Model, Op } = require('sequelize');
const sequelize = require('../services/sequelize.js');

/**
 * S2NCell model class.
 */
class Cell extends Model {
    // TODO: unused
    static getS2NCellIDs(minLevel, maxLevel, maxCells, polygon) {
        let bbox = turf.bbox(polygon);
        let regionCoverer = new S2N.S2NRegionCoverer();
        regionCoverer.minLevel = minLevel;
        regionCoverer.maxLevel = maxLevel;
        regionCoverer.maxCells = maxCells;
        let region = S2N.S2NLatLngRect.fromLatLng(
            S2N.S2NLatLng.fromDegrees(bbox[1], bbox[0]),
            S2N.S2NLatLng.fromDegrees(bbox[3], bbox[2])
        );
        let cellIDsBBox = regionCoverer.getInteriorCoveringCells(region);
        let cellIDs = [];
        for (let i = 0; i < cellIDsBBox.length; i++) {
            let cellID = cellIDsBBox[i];
            let id = cellID.id.toUnsigned().toString();
            let cell = new S2N.S2NCell(cellID);
            let vertex0 = cell.getVertex(0);
            let vertex1 = cell.getVertex(1);
            let vertex2 = cell.getVertex(2);
            let vertex3 = cell.getVertex(3);
            let coord0 = S2N.S2NLatLng.fromPoint(new S2N.S2NPoint(vertex0.x, vertex0.y, vertex0.z));
            let coord1 = S2N.S2NLatLng.fromPoint(new S2N.S2NPoint(vertex1.x, vertex1.y, vertex1.z));
            let coord2 = S2N.S2NLatLng.fromPoint(new S2N.S2NPoint(vertex2.x, vertex2.y, vertex2.z));
            let coord3 = S2N.S2NLatLng.fromPoint(new S2N.S2NPoint(vertex3.x, vertex3.y, vertex3.z));
            let point0 = turf.point([coord0.lngDegrees, coord0.latDegrees]);
            let point1 = turf.point([coord1.lngDegrees, coord1.latDegrees]);
            let point2 = turf.point([coord2.lngDegrees, coord2.latDegrees]);
            let point3 = turf.point([coord3.lngDegrees, coord3.latDegrees]);
            if (turf.booleanPointInPolygon(point0, polygon) ||
                turf.booleanPointInPolygon(point1, polygon) ||
                turf.booleanPointInPolygon(point2, polygon) ||
                turf.booleanPointInPolygon(point3, polygon)) {
                cellIDs.push(id);
            }
        }
        return cellIDs;
    }

    static getCellIdFromLatLon(lat, lon, level = 15) {
        let key = S2.latLngToKey(lat, lon, level);
        let id = S2.keyToId(key);
        return id;
    }

    static async getByIDs(ids) {
        try {
            let results = await Cell.findAll({
                where: { id: ids },
            });
            return results;
        } catch (err) {
            console.error('[Cell] Error:', err);
            return [];
        }
    }
}
Cell.init({
    id: {
        type: DataTypes.BIGINT(20).UNSIGNED,
        primaryKey: true,
        allowNull: false,
    },
    level: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    centerLat: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
        defaultValue: 0.00000000000000,
    },
    centerLon: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
        defaultValue: 0.00000000000000,
    },
    updated: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: false,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'ix_coords',
            fields: ['centerLat', 'centerLon'],
        },
        {
            name: 'ix_updated',
            fields: ['updated'],
        },
    ],
    tableName: 's2cell',
});

module.exports = Cell;
