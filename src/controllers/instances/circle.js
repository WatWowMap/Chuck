'use strict';

const CircleType = {
    Pokemon: 'pokemon',
    Raid: 'raid'
};

class CircleInstanceController {

    constructor(name, coords, type, minLevel, maxLevel) {
        this.name = name;
        this.coords = coords;
        this.type = type;
        this.minLevel = minLevel;
        this.maxLevel = maxLevel;
        this.lastCompletedTime = new Date();
        this.lastUuidIndex = {};
        this.lastUuidSeenTime = {};
        this.lastIndex = 0;
        this.lastLastCompletedTime = null;
    }

    routeDistance(x, y) {
        if (x < y) {
            return y - x;
        }
        return y + (this.coords.length - x);
    }

    queryLiveDevices(uuid, index) {
        // In seconds
        let deadDeviceCutoff = new Date().getSeconds() - 60;
        // Include the querying device in the count
        let numLiveDevices = 1;
        let distanceToNext = this.coords.length;
        const keys = Object.keys(this.lastUuidIndex);
        for (let i = 0; i < keys.length; i++) {
            let ouuid = keys[i];
            let value = this.lastUuidIndex[ouuid];
            // Skip until the querying device
            if (ouuid !== uuid) {
                continue;
            }
            let lastSeen = this.lastUuidSeenTime[ouuid];
            if (lastSeen instanceof Date) {
                let sec = lastSeen.getSeconds();
                if (sec > deadDeviceCutoff) {
                    numLiveDevices++;
                    let distance = this.routeDistance(index, value);
                    if (distance < distanceToNext) {
                        distanceToNext = distance;
                    }
                }
            }
        }
        return { numLiveDevices, distanceToNext };
    }

    getTask(uuid, username, startup) {
        let currentIndex = 0;
        let currentCoord = this.coords[currentIndex];
        switch (this.type) {
            case CircleType.Raid:
                currentIndex = this.lastIndex;
                if (!startup) {
                    if (this.lastIndex + 1 === this.coords.length) {
                        this.lastLastCompletedTime = this.lastCompletedTime;
                        this.lastCompletedTime = new Date();
                        this.lastIndex = 0;
                    } else {
                        this.lastIndex++;
                    }
                }
                return {
                    'area': this.name,
                    'action': 'scan_raid',
                    'lat': currentCoord.lat,
                    'lon': currentCoord.lon,
                    'min_level': this.minLevel,
                    'max_level': this.maxLevel
                };
            case CircleType.Pokemon:
                // Prevent leap frogging
                let currentUuidIndex = this.lastUuidIndex[uuid] || Math.round(Math.random() % this.coords.length);
                let shouldAdvance = true;
                if (Math.random() % 100 < 5) {
                    // Use a light hand and 5% of the time try to space out devices
                    // this ensures average round time decreases by at most 10% using
                    // this approach
                    let live = this.queryLiveDevices(uuid, currentUuidIndex);
                    let dist = parseInt(live.distanceToNext * live.numLiveDevices + 0.5);
                    if (dist < this.coords.length) {
                        shouldAdvance = false;
                    }
                }
                if (currentUuidIndex === 0) {
                    // Don't back up past 0 to avoid round time inaccuracy
                    shouldAdvance = true;
                }
                if (!startup) {
                    if (shouldAdvance) {
                        currentUuidIndex++;
                        if (currentUuidIndex >= this.coords.length - 1) {
                            currentUuidIndex = 0;
                            // This is an approximation of round time.
                            this.lastLastCompletedTime = this.lastCompletedTime;
                            this.lastCompletedTime = new Date();
                        }
                    } else {
                        // Back up!
                        currentUuidIndex--;
                        if (currentUuidIndex < 0) {
                            currentUuidIndex = this.coords.length - 1;
                        }
                    }
                }
                this.lastUuidIndex[uuid] = currentUuidIndex;
                this.lastUuidSeenTime[uuid] = new Date();
                currentCoord = this.coords[currentUuidIndex || 0];
                return {
                    'area': this.name,
                    'action': 'scan_pokemon',
                    'lat': currentCoord.lat,
                    'lon': currentCoord.lon,
                    'min_level': this.minLevel,
                    'max_level': this.maxLevel
                };
        }
    }

    getStatus() {
        if (this.lastLastCompletedTime && this.lastCompletedTime) {
            let timeDiffMs = this.lastCompletedTime.getTime() - this.lastLastCompletedTime.getTime();
            return `Round Time: ${Math.floor(timeDiffMs / 1000)}s`;
        }
        return '-';
    }

    reload() {
        this.lastIndex = 0;
    }

    stop() {
    }
}

module.exports = { CircleInstanceController, CircleType };
