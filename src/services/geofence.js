'use strict';

const turf = require('@turf/turf');

class GeofenceService {
    static instance = new GeofenceService();

    constructor() {
    }

    static inMultiPolygon(polygons, lat, lon) {
        let multiPolygon = turf.multiPolygon(polygons);
        for (let i = 0; i < multiPolygon.geometry.coordinates.length; i++) {
            try {
                let coords = multiPolygon.geometry.coordinates[i];
                // Make sure first and last coords are the same
                // TODO: should probably put some fail safes
                if (coords[0][0] !== coords[0][coords[0].length - 1]) {
                    coords[0].push(coords[0][0]);
                }
                let polygon = turf.polygon(coords);
                let position = turf.point([lon, lat]);
                // Check if position is within geofence
                if (turf.booleanPointInPolygon(position, polygon)) {
                    return true;
                }
            } catch (err) {
                console.error('[GeofenceService] InMultiPolygon:', err);
            }
        }
        return false;
    }
}

module.exports = GeofenceService;
