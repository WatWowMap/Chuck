'use strict';

const AssignmentController = require('./assignment-controller.js');
const InstanceType = require('../data/instance-type.js');
const Device = require('../models/device.js');
const Instance = require('../models/instance.js');
const { AutoInstanceController, AutoType } = require('./instances/auto.js');
const { CircleInstanceController, CircleType } = require('./instances/circle.js');
const IVInstanceController = require('./instances/iv.js');
const RedisClient = require('../services/redis.js');
const Pokemon = require('../models/pokemon.js');

class InstanceController {
    static instance = new InstanceController();

    constructor() {
        this.devices = {};
        this.instances = {};

        (async () => {
            await this.init();
        })().catch(err => {
            console.error('[InstanceController] Error:', err);
        });
    }

    async init() {
        let instances = await Instance.getAll();
        let devices = await Device.getAll();
        console.log('[InstanceController] Starting instances...');
        for (let i = 0; i < instances.length; i++) {
            let inst = instances[i];
            console.log(`[InstanceController] Starting ${inst.name}...`);
            this.addInstance(inst);
            console.log(`[InstanceController] Started ${inst.name}`);
            let filtered = devices.filter(x => x.instanceName === inst.name);
            for (let j = 0; j < filtered.length; j++) {
                let device = filtered[j];
                this.addDevice(device);
            }
        }
        console.log('[InstanceController] Done starting instances');

        // Register redis client subscription on event handler
        await RedisClient.onEvent('message', (channel, message) => {
            //console.log('[Redis] Event:', channel, message);
            switch (channel) {
                case 'pokemon_add_queue':
                    this.gotPokemon(Pokemon.build(JSON.parse(message)));
                    break;
            }
        });
        await RedisClient.subscribe('pokemon_add_queue');
    }

    getInstanceController(uuid) {
        if (!this.devices[uuid]) {
            console.error(`[InstanceController] [${uuid}] Not assigned an instance!`);
            return;
        }
        let device = this.devices[uuid];
        let instanceName = device.instanceName;
        if (!device && !instanceName) {
            return null;
        }
        return this.getInstanceControllerByName(instanceName);
    }

    getInstanceControllerByName(name) {
        return this.instances[name];
    }

    addInstance(instance) {
        let instanceController;
        switch (instance.type) {
            case InstanceType.CirclePokemon:
            case InstanceType.CircleRaid:
            case InstanceType.CircleSmartRaid: {
                let coordsArray = [];
                if (instance.data['area']) {
                    coordsArray = instance.data['area'];
                } else {
                    let coords = instance.data['area'];
                    for (let coord in coords) {
                        coordsArray.push({ lat: coord.lat, lon: coord.lon });
                    }
                }
                let minLevel = parseInt(instance.data['min_level'] || 0);
                let maxLevel = parseInt(instance.data['max_level'] || 29);
                switch (instance.type) {
                    case InstanceType.CirclePokemon:
                        instanceController = new CircleInstanceController(instance.name, coordsArray, CircleType.Pokemon, minLevel, maxLevel);
                        break;
                    case InstanceType.CircleRaid:
                        instanceController = new CircleInstanceController(instance.name, coordsArray, CircleType.Raid, minLevel, maxLevel);
                        break;
                    case InstanceType.CircleSmartRaid:
                        // TODO: Smart Raid instance
                        break;
                }
                break;
            }
            case InstanceType.AutoQuest:
            case InstanceType.PokemonIV: {
                let areaArray = [];
                if (instance.data['area']) {
                    //    areaArray = instance.data['area']; //[[Coord]]
                    //} else {
                    let areas = instance.data['area']; //[[[String: Double]]]
                    for (let i = 0; i < areas.length; i++) {
                        let coords = areas[i];
                        for (let j = 0; j < coords.length; j++) {
                            let coord = coords[j];
                            while (areaArray.length !== i + 1) {
                                areaArray.push([]);
                            }
                            areaArray[i].push({ lat: coord['lat'], lon: coord['lon'] });
                        }
                    }
                }
                let timezoneOffset = parseInt(instance.data['timezone_offset'] || 0);
                let areaArrayEmptyInner = [];//[[[CLLocationCoordinate2D]]]()
                for (let i = 0; i < areaArray.length; i++) {
                    let coords = areaArray[i];
                    let polyCoords = [];
                    for (let j = 0; j < coords.length; j++) {
                        let coord = coords[j];
                        polyCoords.push([coord['lon'], coord['lat']]);
                    }
                    areaArrayEmptyInner.push([polyCoords]);
                }

                let minLevel = parseInt(instance.data['min_level'] || 0);
                let maxLevel = parseInt(instance.data['max_level'] || 29);
                if (instance.type === InstanceType.PokemonIV) {
                    let pokemonList = instance.data['pokemon_ids'];
                    let ivQueueLimit = parseInt(instance.data['iv_queue_limit'] || 100);
                    instanceController = new IVInstanceController(instance.name, areaArrayEmptyInner, pokemonList, minLevel, maxLevel, ivQueueLimit);
                } else {
                    let spinLimit = parseInt(instance.data['spin_limit'] || 500);
                    instanceController = new AutoInstanceController(instance.name, areaArrayEmptyInner, AutoType.Quest, timezoneOffset, minLevel, maxLevel, spinLimit);
                }
                break;
            }
        }
        this.instances[instance.name] = instanceController;
    }

    reloadAll() {
        for (let name in this.instances) {
            let instance = this.instances[name];
            instance.reload();
        }
    }

    reloadInstance(newInstance, oldInstanceName) {
        let oldInstance = this.instances[oldInstanceName];
        if (oldInstance) {
            for (let uuid in this.devices) {
                let device = this.devices[uuid];
                if (device.instanceName === oldInstance.name) {
                    device.instanceName = newInstance.name
                    this.devices[uuid] = device;
                }
            }
            this.instances[oldInstanceName].stop();
            this.instances[oldInstanceName] = null;
        }
        this.addInstance(newInstance);
    }


    async removeInstance(instance) {
        await this.removeInstanceByName(instance.name);
    }

    async removeInstanceByName(name) {
        this.instances[name].stop();
        this.instances[name] = null;
        for (let device in this.devices.filter(x => x.instanceName === name)) {
            this.devices[device.uuid] = null;
        }
        await AssignmentController.instance.setup();
    }

    addDevice(device) {
        if (!this.devices[device.uuid]) {
            this.devices[device.uuid] = device;
        }
    }

    async removeDevice(device) {
        await this.removeDeviceByName(device.uuid);
    }

    async reloadDevice(newDevice, oldDeviceUUID) {
        await this.removeDeviceByName(oldDeviceUUID);
        this.addDevice(newDevice);
    }

    async removeDeviceByName(name) {
        /*delete*/ this.devices[name] = null;
        // TODO: await AssignmentController.instance.setup();
    }

    getDeviceUUIDsInInstance(instanceName) {
        let uuids = [];
        for (let uuid in this.devices) {
            let device = this.devices[uuid];
            if (device.instanceName === instanceName) {
                uuids.push(uuid);
            }
        }
        return uuids;
    }

    async getInstanceStatus(instance) {
        if (this.instances[instance.name]) {
            try {
                const status = await this.instances[instance.name].getStatus();
                return status;
            } catch (err) {
                console.error('[InstanceController] Failed to get instance status for instance:', instance.name);
                return 'ERROR';
            }
        } else {
            return 'Starting...';
        }
    }

    gotPokemon(pokemon) {
        for (let inst in this.instances) {
            let instObj = this.instances[inst];
            if (instObj instanceof IVInstanceController) {
                try {
                    instObj.addPokemon(pokemon);
                } catch (err) {
                    console.error('Failed to add pokemon to IV queue:', instObj.name, err);
                }
            }
        }
    }

    getIVQueue(name) {
        if (this.instances[name]) {
            const instance = this.instances[name];
            return instance.getQueue();
        }
        return [];
    }
}

module.exports = InstanceController;
