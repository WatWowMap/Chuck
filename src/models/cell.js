'use strict';

const S2N = require('nodes2ts');
const turf = require('@turf/turf');
const S2 = require('s2-geometry').S2;

const config = require('../config.json');
const MySQLConnector = require('../services/mysql.js');
const db = new MySQLConnector(config.db);

/**
 * S2Cell model class.
 */
class Cell {

    /**
     * Initialize new Cell object.
     * @param data 
     */
    constructor(id, level, centerLat, centerLon, updated) {
        this.id = id;
        this.level = level;
        this.centerLat = centerLat;
        this.centerLon = centerLon;
        this.updated = updated;
    }

    static getS2CellIDs(minLevel, maxLevel, maxCells, polygon) {
        let bbox = turf.bbox(polygon);
        let regionCoverer = new S2N.S2RegionCoverer();
        regionCoverer.minLevel = minLevel;
        regionCoverer.maxLevel = maxLevel;
        regionCoverer.maxCells = maxCells;
        let region = S2N.S2LatLngRect.fromLatLng(
            S2N.S2LatLng.fromDegrees(bbox[1], bbox[0]),
            S2N.S2LatLng.fromDegrees(bbox[3], bbox[2])
        );
        let cellIDsBBox = regionCoverer.getInteriorCoveringCells(region);
        let cellIDs = [];
        for (let i = 0; i < cellIDsBBox.length; i++) {
            let cellID = cellIDsBBox[i];
            let id = cellID.id.toUnsigned().toString();
            let cell = new S2N.S2Cell(cellID);
            let vertex0 = cell.getVertex(0);
            let vertex1 = cell.getVertex(1);
            let vertex2 = cell.getVertex(2);
            let vertex3 = cell.getVertex(3);
            let coord0 = S2N.S2LatLng.fromPoint(new S2N.S2Point(vertex0.x, vertex0.y, vertex0.z));
            let coord1 = S2N.S2LatLng.fromPoint(new S2N.S2Point(vertex1.x, vertex1.y, vertex1.z));
            let coord2 = S2N.S2LatLng.fromPoint(new S2N.S2Point(vertex2.x, vertex2.y, vertex2.z));
            let coord3 = S2N.S2LatLng.fromPoint(new S2N.S2Point(vertex3.x, vertex3.y, vertex3.z));
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
        return cellIDs
    }

    static getCellIdFromLatLon(lat, lon, level = 15) {
        let key = S2.latLngToKey(lat, lon, level);
        let id = S2.keyToId(key);
        return id;
    }

    static async getByIDs(ids) {
        if (ids.length > 10000) {
            let result = [];
            let count = parseInt(Math.ceil(ids.length / 10000.0));
            for (let i = 0; i < count; i++) {
                let start = 10000 * i;
                let end = Math.min(10000 * (i + 1) - 1, ids.length - 1);
                let slice = ids.slice(start, end);
                let sliceResult = await this.getByIDs(slice);
                if (sliceResult.length > 0) {
                    sliceResult.forEach(x => result.push(x));
                }
            }
            return result;
        }
        if (ids.length === 0) {
            return [];
        }
        let inSQL = '(';
        for (let i = 0; i < ids.length; i++) {
            inSQL += '?';
            if (i !== ids.length - 1) {
                inSQL += ',';
            }
        }
        inSQL += ')';

        let sql = `
        SELECT id, level, center_lat, center_lon, updated
        FROM S2Ncell
        WHERE id IN ${inSQL}
        `;
        //WHERE id IN ${inSQL}
        let cells = [];
        try {
            let results = await db.query(sql, ids);
            if (results && results.length > 0) {
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    cells.push(new Cell(result.id, result.level, result.center_lat, result.center_lon, result.updated));
                }
            }
        } catch (err) {
            console.error('[Cell] Error:', err);
        }
        return cells;
    }
}

module.exports = Cell;
