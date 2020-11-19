'use strict';

const S2 = require('nodes2ts');
const turf = require('@turf/turf');

const AssignmentController = require('../assignment-controller.js');
const Account = require('../../models/account.js');
const Cell = require('../../models/cell.js');
const Pokestop = require('../../models/pokestop.js');

const AutoType = {
    Quest: 'quest'
};

const CooldownTimes = {
    '0.3': 0.16,
    '1': 1,
    '2': 2,
    '4': 3,
    '5': 4,
    '8': 5,
    '10': 7,
    '15': 9,
    '20': 12,
    '25': 15,
    '30': 17,
    '35': 18,
    '45': 20,
    '50': 20,
    '60': 21,
    '70': 23,
    '80': 24,
    '90': 25,
    '100': 26,
    '125': 29,
    '150': 32,
    '175': 34,
    '201': 37,
    '250': 41,
    '300': 46,
    '328': 48,
    '350': 50,
    '400': 54,
    '450': 58,
    '500': 62,
    '550': 66,
    '600': 70,
    '650': 74,
    '700': 77,
    '751': 82,
    '802': 84,
    '839': 88,
    '897': 90,
    '900': 91,
    '948': 95,
    '1007': 98,
    '1020': 102,
    '1100': 104,
    '1180': 109,
    '1200': 111,
    '1221': 113,
    '1300': 117,
    '1344': 119
};

class AutoInstanceController {

    constructor(name, polygon, type, timezoneOffset, minLevel, maxLevel, spinLimit) {
        this.name = name;
        this.polygon = polygon;
        this.type = type;
        this.timezoneOffset = timezoneOffset;
        this.minLevel = minLevel;
        this.maxLevel = maxLevel;
        this.spinLimit = spinLimit;
        this.shouldExit = false;
        this.bootstrapCellIDs = [];
        this.bootstrapTotalCount = 0;
        this.allStops = [];
        this.todayStops = [];
        this.todayStopsTries = {};
        this.doneDate = null;

        this.update()
            .then(x => x)
            .catch(err => {
                console.error('[AutoInstanceController] Failed to update instance:', this.name, err);
            });
        this.bootstrap()
            .then(x => x)
            .catch(err => {
                console.error('[AutoInstanceController] Failed to bootstrap instance:', this.name, err);
            });
        this.setClearQuestsTimer();
    }

    setClearQuestsTimer() {
        let date = new Date();
        // TODO: timeZone
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();
        let timeLeftSeconds = (23 - hour) * 3600 + (59 - minute) * 60 + (60 - second);
        let at = new Date(date.getTime() + (timeLeftSeconds * 1000));
        console.debug(`[AutoInstanceController] [${this.name}] Clearing Quests in ${timeLeftSeconds.toLocaleString()}s at ${at.toLocaleString()} (Currently: ${date.toLocaleString()})`);

        this.clearQuestsTimer = setInterval(() => this.clearQuests(), timeLeftSeconds * 1000);
    }

    async bootstrap() {
        console.log(`[AutoInstanceController] [${this.name}] Checking Bootstrap Status...`);
        let start = new Date();
        let totalCount = 0;
        let missingCellIDs = [];
        let multiPolygon = turf.multiPolygon(this.polygon);
        for (let i = 0; i < multiPolygon.geometry.coordinates.length; i++) {
            let coords = multiPolygon.geometry.coordinates[i];
            // Make sure first and last coords are the same
            if (coords[0][0] !== coords[0][coords[0].length - 1]) {
                coords[0].push(coords[0][0]);
            }
            let polygon = turf.polygon(coords);
            // Get all cells within geofence
            let cellIDs = Cell.getS2CellIDs(15, 15, 1000, polygon);
            totalCount += cellIDs.length;
            let cells = [];
            try {
                cells = await Cell.getByIDs(cellIDs);
            } catch (err) {
                console.log('[AutoInstanceController] Error:', err);
            }
            let existingCellIDs = cells.map(x => x.id);
            for (let j = 0; j < cellIDs.length; j++) {
                let cellID = cellIDs[j];
                let contains = existingCellIDs.includes(cellID);
                // If cell id doesn't exist, add to bootstrap list
                if (!contains) {
                    missingCellIDs.push(cellID);
                }
            }
        }
        console.log(`[AutoInstanceController] [${this.name}] Bootstrap Status: ${totalCount - missingCellIDs.length}/${totalCount} after ${(new Date().getSeconds() - start.getSeconds()).toFixed(2)}s)`);
        this.bootstrapCellIDs = missingCellIDs;
        this.bootstrapTotalCount = totalCount;
    }

    async update() {
        switch (this.type) {
            case AutoType.Quest:
                this.allStops = [];
                let multiPolygon = turf.multiPolygon(this.polygon);
                for (let i = 0; i < multiPolygon.geometry.coordinates.length; i++) {
                    try {
                        let coords = multiPolygon.geometry.coordinates[i];
                        // Make sure first and last coords are the same
                        if (coords[0][0] !== coords[0][coords[0].length - 1]) {
                            coords[0].push(coords[0][0]);
                        }
                        let polygon = turf.polygon(coords);
                        let bounds = turf.bbox(polygon);
                        // Get all existing pokestops within geofence bounds
                        let stops = await Pokestop.getAll(bounds[1], bounds[3], bounds[0], bounds[2]);
                        for (let j = 0; j < stops.length; j++) {
                            let stop = stops[j];
                            let position = turf.point([stop.lon, stop.lat]);
                            // Check if pokestop is within geofence
                            if (turf.booleanPointInPolygon(position, polygon)) {
                                this.allStops.push(stop);
                            }
                        }
                    } catch (err) {
                        console.error('[AutoInstanceController] Error:', err);
                    }
                }
                this.todayStops = [];
                this.todayStopsTries = {};
                this.doneDate = null;
                for (let i = 0; i < this.allStops.length; i++) {
                    let stop = this.allStops[i];
                    if (!stop.questType && stop.enabled) {
                        this.todayStops.push(stop);
                    }
                }
                break;
        }
    }

    encounterCooldown(distanceM) {
        let dist = distanceM / 1000;
        let keys = Object.keys(CooldownTimes);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let data = CooldownTimes[key];
            if (key >= dist) {
                return parseInt(data * 60);
            }
        }
        return 0;
    }

    async getTask(uuid, username, startup) {
        switch (this.type) {
            case AutoType.Quest:
                if (this.bootstrapCellIDs.length > 0) {
                    let target = this.bootstrapCellIDs.pop();
                    if (target) {
                        let cell = new S2.S2Cell(new S2.S2CellId(target));
                        let center = cell.getCenter();
                        let point = new S2.S2Point(center.x, center.y, center.z);
                        let latlng = S2.S2LatLng.fromPoint(point);
                        // Get all cells touching a 630 (-5m for error) circle at center
                        let radians = 0.00009799064306948; // 625m
                        let circle = new S2.S2Cap(center, (radians * radians) / 2);
                        let coverer = new S2.S2RegionCoverer();
                        coverer.minLevel = 15;
                        coverer.maxLevel = 15;
                        coverer.maxCells = 100;
                        let cellIDs = coverer.getCoveringCells(circle);
                        for (let i = 0; i < cellIDs.length; i++) {
                            let cellID = cellIDs[i];
                            let id = cellID.id.toUnsigned().toString();
                            let index = this.bootstrapCellIDs.indexOf(id);
                            if (index) {
                                this.bootstrapCellIDs.splice(index, 1);
                            }
                        }
                        if (this.bootstrapCellIDs.length === 0) {
                            // TODO: await this.bootstrap(); // <--- Causes bootstrap loop for some reason
                            //if (this.bootstrapCellIDs.length === 0) {
                                await this.update();
                            //}
                        }
                        return {
                            'area': this.name,
                            'action': 'scan_raid',
                            'lat': latlng.latDegrees,
                            'lon': latlng.lngDegrees
                        };
                    } else {
                        return null;
                    }
                } else {
                    if (!this.todayStops) {
                        this.todayStops = [];
                        this.todayStopsTries = {};
                    }
                    if (!this.allStops) {
                        this.allStops = [];
                    }
                    if (this.allStops.length === 0) {
                        return null;
                    }
                    if (this.todayStops.length === 0) {
                        let ids = this.allStops.map(x => x.id);
                        let newStops = [];
                        try {
                            newStops = await Pokestop.getByIds(ids);
                        } catch (err) {
                            console.error('[AutoInstanceController] Failed to get list of Pokestops with ids:', err);
                        }

                        for (let i = 0; i < newStops.length; i++) {
                            let stop = newStops[i];
                            let count = this.todayStopsTries[stop.id] || 0;
                            if (!stop.questType && stop.enabled && count <= 5) {
                                this.todayStops.push(stop);
                            }
                        }
                        if (this.todayStops.length === 0) {
                            AssignmentController.instance.instanceControllerDone(this.name);
                            return null;
                        }
                    }

                    let lastLat;
                    let lastLon;
                    let lastTime;
                    let account;

                    try {
                        if (username) {
                            account = await Account.getWithUsername(username);
                            lastLat = account.lastEncounterLat;
                            lastLon = account.lastEncounterLon;
                            lastTime = account.lastEncounterTime;
                        } else {
                            //lastLat = Double(DBController.global.getValueForKey(key: "AIC_\(uuid)_last_lat") ?? "")
                            //lastLon = Double(DBController.global.getValueForKey(key: "AIC_\(uuid)_last_lon") ?? "")
                            //lastTime = UInt32(DBController.global.getValueForKey(key: "AIC_\(uuid)_last_time") ?? "")
                        }
    
                    } catch (err) {
                        console.error('[AutoInstanceController] Error:', err);
                    }

                    if (username && account) {
                        if (account.spins >= this.spinLimit) {
                            return {
                                'action': 'switch_account',
                                'min_level': this.minLevel,
                                'max_level': this.maxLevel
                            };
                        } else {
                            await Account.spin(username);
                        }
                    }

                    let newLat;
                    let newLon;
                    let encounterTime;
                    let pokestop;
                    if (lastLat && lastLon) {
                        let current = turf.point([lastLon, lastLat]);
                        let closest;
                        let closestDistance = 10000000000000000;
                        let todayStopsC = this.todayStops;
                        if (todayStopsC.length === 0) {
                            return null;
                        }
                        for (let i = 0; i < todayStopsC.length; i++) {
                            let stop = todayStopsC[i];
                            let coord = turf.point([stop.lon, stop.lat]);
                            let dist = turf.distance(current, coord);
                            if (dist < closestDistance) {
                                closest = stop;
                                closestDistance = dist;
                            }
                        }

                        if (!closest) {
                            return null;
                        }

                        newLat = closest.lat;
                        newLon = closest.lon;
                        pokestop = closest;
                        let now = new Date().getTime() / 1000;
                        if (!lastTime) {
                            encounterTime = now;
                        } else {
                            let encounterTimeT = lastTime + this.encounterCooldown(closestDistance);
                            if (encounterTimeT < now) {
                                encounterTime = now;
                            } else {
                                encounterTime = encounterTimeT;
                            }
                            if (encounterTime - now >= 7200) {
                                encounterTime = now + 7200;
                            }
                        }
                        let index = this.todayStops.indexOf(pokestop);
                        if (index) {
                            this.todayStops.splice(index, 1);
                        }
                    } else {
                        let stop = this.todayStops[0];
                        if (!stop) {
                            return null;
                        }
                        newLat = stop.lat;
                        newLon = stop.lon;
                        pokestop = stop;
                        encounterTime = new Date().getTime() / 1000;
                        this.todayStops.shift();
                    }

                    if (!this.todayStopsTries[pokestop.id]) {
                        this.todayStopsTries[pokestop.id] = 1;
                    } else {
                        this.todayStopsTries[pokestop.id]++;
                    }

                    if (username && account) {
                        await Account.didEncounter(username, newLat, newLon, encounterTime);
                    } else {
                        // TODO:
                    }

                    let delayT = parseInt(new Date().getTime() / 1000 - encounterTime);
                    let delay;
                    if (delayT < 0) {
                        delay = 0;
                    } else {
                        delay = delayT + 1;
                    }
                    console.log(`[AutoInstanceController] [${uuid}] Delaying by ${delay}s`);

                    if (this.todayStops.length === 0) {
                        let ids = this.allStops.map(x => x.id);
                        let newStops = [];
                        try {
                            newStops = await Pokestop.getByIds(ids);
                        } catch (err) {
                            console.error('[AutoInstanceController] Failed to get list of Pokestops by ids:', err);
                        }

                        for (let i = 0; i < newStops.length; i++) {
                            let stop = newStops[i];
                            if (!stop.questType && stop.enabled) {
                                this.todayStops.push(stop);
                            }
                        }
                        if (this.todayStops.length === 0) {
                            console.log(`[AutoInstanceController] [${this.name}] Instance done`);
                            AssignmentController.instance.instanceControllerDone(this.name);
                        }
                    }

                    return {
                        'area': this.name,
                        'action': 'scan_quest',
                        'lat': newLat,
                        'lon': newLon,
                        'delay': delay,
                        'min_level': this.minLevel,
                        'max_level': this.maxLevel,

                    };
                }
        }
    }

    async getStatus() {
        switch (this.type) {
        case AutoType.Quest:
            if (this.bootstrapCellIDs.length > 0) {
                let totalCount = this.bootstrapTotalCount;
                let count = totalCount - this.bootstrapCellIDs.length;
                let percentage;
                if (totalCount > 0) {
                    percentage = parseFloat(count) / parseFloat(totalCount) * 100;
                } else {
                    percentage = 100;
                }
                return `Bootstrapping ${count}/${totalCount} (${percentage.toFixed(2)}%)`;
            } else {
                let ids = this.allStops.map(x => x.id);
                let currentCountDb = (await Pokestop.getQuestCountIn(ids)) || 0;
                let maxCount = this.allStops.length || 0;
                let currentCount = maxCount - (this.todayStops.length || 0);
                let percentage;
                if (maxCount > 0) {
                    percentage = parseFloat(currentCount) / parseFloat(maxCount) * 100;
                } else {
                    percentage = 100;
                }
                let percentageReal;
                if (maxCount > 0) {
                    percentageReal = parseFloat(currentCountDb) / parseFloat(maxCount) * 100;
                } else {
                    percentageReal = 100;
                }
                return `Status: ${currentCountDb}|${currentCount}/${maxCount} (${percentageReal.toFixed(1)}|${percentage.toFixed(2)}%` +
                    `${this.doneDate ? (`, Completed: @${doneDate.toString('HH:mm')}` || ')') : ')'}`;
            }
        }
    }

    async reload() {
        await this.update();
    }

    stop() {
        this.shouldExit = true;
        clearInterval(this.clearQuestsTimer);
    }

    async clearQuests() {
        clearInterval(this.clearQuestsTimer);
        this.setClearQuestsTimer();

        if (this.shouldExit) {
            return;
        }
        if (!this.allStops || this.allStops.length === 0) {
            console.warn(`[AutoInstanceController] [${this.name}] Tried clearing quests but no pokestops.`);
            return;
        }
        console.debug(`[AutoInstanceController] [${this.name}] Getting pokestop ids`);
        let ids = this.allStops.map(x => x.id);
        console.debug(`[AutoInstanceController] [${this.name}] Clearing Quests for ids: ${ids}.`);
        try {
            await Pokestop.clearQuests(ids);
        } catch (err) {
            console.error(`[AutoInstanceController] [${this.name} Failed to clear quests:`, err);
            if (this.shouldExit) {
                return;
            }
        }
        await this.update();
    }
}

module.exports = { AutoType, CooldownTimes, AutoInstanceController };
