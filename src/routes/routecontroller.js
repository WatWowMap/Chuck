'use strict';

const POGOProtos = require('pogo-protos');

const config = require('../services/config.js');
const Account = require('../models/account.js');
const Device = require('../models/device.js');
const { sendResponse, base64_decode } = require('../services/utils.js');
const Consumer = require('../services/consumer.js');

const RpcMethod = {
    GetPlayerOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GET_PLAYER), // 2
    DownloadSettingsResponseProto: parseInt(POGOProtos.Rpc.Method.METHOD_DOWNLOAD_SETTINGS), // 5
    GetGameMasterClientTemplatesOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_DOWNLOAD_ITEM_TEMPLATES), //6
    FortSearchOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_FORT_SEARCH), // 101
    EncounterOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_ENCOUNTER), // 102
    FortDetailsOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_FORT_DETAILS), // 104
    GetMapObjectsOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GET_MAP_OBJECTS), // 106
    GymGetInfoOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GYM_GET_INFO), // 156
    AssetDigestOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GET_ASSET_DIGEST), // 300
    DownloadGmTemplatesResponseProto: parseInt(POGOProtos.Rpc.ClientAction.CLIENT_ACTION_DOWNLOAD_GAME_MASTER_TEMPLATES), // 5004
    GetHoloholoInventoryOutProto: parseInt(POGOProtos.Rpc.ClientAction.CLIENT_ACTION_GET_INVENTORY) // 5005
};

/**
 * RouteController class
 */
class RouteController {

    /**
     * Initialize new RouteController object.
     */
    constructor() {
        this.emptyCells = [];
        this.levelCache = {};
        this.consumers = {};
    }

    /**
     * Handle incoming /raw data
     * @param {*} req
     * @param {*} res
     */
    async handleRawData(req, res) {
        let json = req.body;
        if (!json) {
            console.error('[Raw] Bad data');
            return res.sendStatus(400);
        }

        let contents;
        let trainerLevel = 0;
        let username;
        let uuid;
        let latTarget;
        let lonTarget;

        // handle Android/PogoDroid data
        if (Array.isArray(json)) {
            if (json.length === 0) {
                return;
            }

            trainerLevel = 30;
            uuid = `PogoDroid ${req.headers['origin']}`;
            username = `PogoDroid ${req.headers['origin']}`;
            latTarget = json[0]['lat'];
            lonTarget = json[0]['lng'];

            contents = [];
            for (let message of json) {
                if (message['raw'] === false) {
                    console.warn(`Ignoring non-raw message from ${username}`);
                    continue;
                }

                // PD is sending more then we actually need.
                // let's only care about certain protos
                //if (![2, 5, 6, 101, 102, 104, 106, 156, 300, 5004, 5005].includes(parseInt(message['type']))) {
                //    continue;
                //}

                let responses = [];
                RpcMethod.forEach(function (item) {
                    responses.push(RpcMethod[item]);
                });

                if (!responses.includes(parseInt(message['type']))) {
                    continue;
                }

                contents.push({
                    'data': message['payload'],
                    'method': parseInt(message['type'])
                });
            }
            // handle iOS data
        } else {
            if (json['payload']) {
                json['contents'] = [json];
            }

            contents = json['contents'] || json['protos'] || json['gmo'];
            trainerLevel = parseInt(json['trainerlvl'] || json['trainerLevel']) || 0;
            username = json['username'];
            uuid = json['uuid'];
            latTarget = json['lat_target'];
            lonTarget = json['lon_target'];

            if (uuid && latTarget && lonTarget) {
                try {
                    await Device.setLastLocation(uuid, latTarget, lonTarget);
                } catch (err) {
                    console.error('[Raw] Error:', err);
                }
            }
        }

        return this.handleData(res, contents, trainerLevel, username, uuid);
    }

    /**
     * Handle data
     * @param {*} res
     * @param {*} contents
     * @param {*} trainerLevel
     * @param {*} username
     * @param {*} uuid
     * @param {*} lastTarget
     * @param {*} lonTarget
     */
    async handleData(res, contents, trainerLevel, username, uuid) {
        if (username && trainerLevel > 0) {
            let oldLevel = this.levelCache[username];
            if (oldLevel !== trainerLevel) {
                await Account.setLevel(username, trainerLevel);
                this.levelCache[username] = trainerLevel;
            }
        }

        if (!contents) {
            console.error('[Raw] Invalid PROTO');
            return res.sendStatus(400);
        }

        let wildPokemons = [];
        let nearbyPokemons = [];
        let clientWeathers = [];
        let forts = [];
        let fortDetails = [];
        let gymInfos = [];
        let quests = [];
        let fortSearch = [];
        let encounters = [];
        let cells = [];
        let playerData = [];

        //Refs Added....
        let inventoryData = [];
        let gameMasterData = [];
        let getItemTemplatesData = [];
        let assetDigestData = [];
        let settingsData = [];
        //

        let isEmptyGMO = true;
        let isInvalidGMO = true;
        let containsGMO = false;

        for (let i = 0; i < contents.length; i++) {
            const rawData = contents[i];
            let data = {};
            let method = parseInt(POGOProtos.Rpc.Method.METHOD_UNSET);
            if (rawData['data'] && rawData['method']) {
                data = rawData['data'];
                method = parseInt(rawData['method']);
            } else {
                console.error('[Raw] Unhandled proto:', rawData);
                return res.sendStatus(400);
            }

            switch (method) {
                case RpcMethod.GetPlayerOutProto:
                    try {
                        let gpr = POGOProtos.Rpc.GetPlayerOutProto.decode(base64_decode(data));
                        if (gpr) {
                            if (gpr.success) {
                                let data = gpr.player;
                                //console.debug('[Raw] GetPlayerData:', data);
                                playerData.push(data);
                            }
                        } else {
                            console.error('[Raw] Malformed GetPlayerOutProto');
                        }
                    } catch (err) {
                        console.error('[Raw] Unable to decode GetPlayerOutProto');
                    }
                    break;
                case RpcMethod.GetHoloholoInventoryOutProto:
                    if (config.dataparser.parse.inventory) {
                        try {
                            let ghi = POGOProtos.Rpc.GetHoloholoInventoryOutProto.decode(base64_decode(data));
                            if (ghi) {
                                if (ghi.success) {
                                    let data = ghi.inventory_delta;
                                    //TODO: Need //comment
                                    console.debug('[Raw] GetInventoryData:', data);
                                    inventoryData.push(data);
                                }
                            } else {
                                console.error('[Raw] Malformed GetHoloholoInventoryOutProto');
                            }
                        } catch (err) {
                            console.error('[Raw] Unable to decode GetHoloholoInventoryOutProto');
                        }
                    }
                    break;
                case RpcMethod.DownloadGmTemplatesResponseProto:
                    if (config.dataparser.parse.gamemaster) {
                        try {
                            let gm = POGOProtos.Rpc.DownloadGmTemplatesResponseProto.decode(base64_decode(data));
                            if (gm) {
                                if (gm.result === POGOProtos.Rpc.DownloadGmTemplatesResponseProto.Result.COMPLETE) {
                                    //TODO: Need //comment
                                    console.debug('[Raw] GetGameMasterData:', gm);
                                    gameMasterData.push(gm);
                                }
                            } else {
                                console.error('[Raw] Malformed DownloadGmTemplatesResponseProto');
                            }
                        } catch (err) {
                            console.error('[Raw] Unable to decode DownloadGmTemplatesResponseProto');
                        }
                    }
                    break;
                case RpcMethod.DownloadSettingsResponseProto:
                    if (config.dataparser.parse.downloadsettings) {
                        try {
                            let ds = POGOProtos.Rpc.DownloadSettingsResponseProto.decode(base64_decode(data));
                            if (ds) {
                                if (ds.result === POGOProtos.Rpc.DownloadSettingsResponseProto.Result.SUCCESS) {
                                    //TODO: Need //comment
                                    console.debug('[Raw] GetSettingsData:', ds);
                                    settingsData.push(ds);
                                }
                            } else {
                                console.error('[Raw] Malformed DownloadSettingsResponseProto');
                            }
                        } catch (err) {
                            console.error('[Raw] Unable to decode DownloadSettingsResponseProto');
                        }
                    }
                    break;
                case RpcMethod.AssetDigestOutProto:
                    if (config.dataparser.parse.assetdigest) {
                        try {
                            let ad = POGOProtos.Rpc.AssetDigestOutProto.decode(base64_decode(data));
                            if (ad) {
                                if (ad.result === POGOProtos.Rpc.AssetDigestOutProto.Result.SUCCESS) {
                                    //TODO: Need //comment
                                    console.debug('[Raw] GetAssetDigestData:', ad);
                                    assetDigestData.push(ad);
                                }
                            } else {
                                console.error('[Raw] Malformed AssetDigestOutProto');
                            }
                        } catch (err) {
                            console.error('[Raw] Unable to decode AssetDigestOutProto');
                        }
                    }
                    break;
                case RpcMethod.GetGameMasterClientTemplatesOutProto:
                    if (config.dataparser.parse.getforgamemaster) {
                        try {
                            let ggm = POGOProtos.Rpc.GetGameMasterClientTemplatesOutProto.decode(base64_decode(data));
                            if (ggm) {
                                if (ggm.result === POGOProtos.Rpc.GetGameMasterClientTemplatesOutProto.Result.SUCCESS) {
                                    //TODO: Need //comment
                                    console.debug('[Raw] GetItemTemplatesData:', ggm);
                                    getItemTemplatesData.push(ggm);
                                }
                            } else {
                                console.error('[Raw] Malformed GetGameMasterClientTemplatesOutProto');
                            }
                        } catch (err) {
                            console.error('[Raw] Unable to decode GetGameMasterClientTemplatesOutProto');
                        }
                    }
                    break;
                case RpcMethod.FortSearchOutProto:
                    try {
                        let fsr = POGOProtos.Rpc.FortSearchOutProto.decode(base64_decode(data));
                        if (fsr) {
                            if (config.dataparser.parse.quests && fsr.challenge_quest && fsr.challenge_quest.quest) {
                                let quest = fsr.challenge_quest.quest;
                                quests.push(quest);
                            }
                            fortSearch.push(fsr);
                        } else {
                            console.error('[Raw] Malformed FortSearchOutProto');
                        }
                    } catch (err) {
                        console.error('[Raw] Unable to decode FortSearchOutProto');
                    }
                    break;
                case RpcMethod.EncounterOutProto:
                    if (config.dataparser.parse.encounters && trainerLevel >= 30) {
                        try {
                            let er = POGOProtos.Rpc.EncounterOutProto.decode(base64_decode(data));
                            if (er && er.status === POGOProtos.Rpc.EncounterOutProto.Status.ENCOUNTER_SUCCESS) {
                                encounters.push(er);
                            } else if (!er) {
                                console.error('[Raw] Malformed EncounterOutProto');
                            }
                        } catch (err) {
                            console.error('[Raw] Unable to decode EncounterOutProto');
                        }
                    }
                    break;
                case RpcMethod.FortDetailsOutProto:
                    try {
                        let fdr = POGOProtos.Rpc.FortDetailsOutProto.decode(base64_decode(data));
                        if (fdr) {
                            fortDetails.push(fdr);
                        } else {
                            console.error('[Raw] Malformed FortDetailsOutProto');
                        }
                    } catch (err) {
                        console.error('[Raw] Unable to decode FortDetailsOutProto');
                    }
                    break;
                case RpcMethod.GetMapObjectsOutProto:
                    containsGMO = true;
                    try {
                        let gmo = POGOProtos.Rpc.GetMapObjectsOutProto.decode(base64_decode(data));
                        if (gmo) {
                            isInvalidGMO = false;
                            let mapCellsNew = gmo.map_cell;
                            if (mapCellsNew.length === 0) {
                                console.debug(`[Raw] [${uuid}] Map cells are empty`);
                                return res.sendStatus(400);
                            }
                            mapCellsNew.forEach(mapCell => {
                                if (config.dataparser.parse.pokemon) {
                                    let timestampMs = parseInt(BigInt(mapCell.as_of_time_ms).toString());
                                    let wildNew = mapCell.wild_pokemon;
                                    wildNew.forEach((wildPokemon) => {
                                        wildPokemons.push({
                                            cell: mapCell.s2_cell_id,
                                            data: wildPokemon,
                                            timestampMs: timestampMs
                                        });
                                    });
                                    let nearbyNew = mapCell.nearby_pokemon;
                                    nearbyNew.forEach(nearbyPokemon => {
                                        nearbyPokemons.push({
                                            cell: mapCell.s2_cell_id,
                                            data: nearbyPokemon,
                                            timestampMs: timestampMs,
                                        });
                                    });
                                }
                                let fortsNew = mapCell.fort;
                                fortsNew.forEach(fort => {
                                    forts.push({
                                        cell: mapCell.s2_cell_id,
                                        data: fort
                                    });
                                });
                                cells.push(mapCell.s2_cell_id);
                            });
                            if (config.dataparser.parse.weather) {
                                let weather = gmo.client_weather;
                                weather.forEach(wmapCell => {
                                    clientWeathers.push({
                                        cell: wmapCell.s2_cell_id,
                                        data: wmapCell
                                    });
                                });
                            }
                            if (wildPokemons.length === 0 && nearbyPokemons.length === 0 && forts.length === 0) {
                                cells.forEach(cell => {
                                    let count = this.emptyCells[cell];
                                    if (!count) {
                                        this.emptyCells[cell] = 1;
                                    } else {
                                        this.emptyCells[cell] = count + 1;
                                    }
                                    if (count === 3) {
                                        console.debug('[Raw] Cell', cell.toString(), 'was empty 3 times in a row. Assuming empty.');
                                        cells.push(cell);
                                    }
                                });
                                console.debug('[Raw] GMO is empty.');
                            } else {
                                cells.forEach(cell => this.emptyCells[cell] = 0);
                                isEmptyGMO = false;
                            }
                        } else {
                            console.error('[Raw] Malformed GetMapObjectsOutProto');
                        }
                    } catch (err) {
                        console.error('[Raw] Unable to decode GetMapObjectsOutProto');
                    }
                    break;
                case RpcMethod.GymGetInfoOutProto:
                    try {
                        let ggi = POGOProtos.Rpc.GymGetInfoOutProto.decode(base64_decode(data));
                        if (ggi) {
                            gymInfos.push(ggi);
                        } else {
                            console.error('[Raw] Malformed GymGetInfoOutProto');
                        }
                    } catch (err) {
                        console.error('[Raw] Unable to decode GymGetInfoOutProto');
                    }
                    break;
                default:
                    console.error('[Raw] Invalid method or data provided:', method, data);
            }
        }

        if (!this.consumers[username]) {
            this.consumers[username] = new Consumer(username);
        }

        let total = wildPokemons.length + nearbyPokemons.length + clientWeathers.length + forts.length + fortDetails.length + gymInfos.length + quests.length + encounters.length + cells.length;
        let startTime = process.hrtime();
        let jobs = [];

        if (playerData.length > 0) {
            jobs = this.consumers[username].updatePlayerData(playerData);
        }

        if (clientWeathers.length > 0) {
            jobs.push(this.consumers[username].updateWeather(clientWeathers));
        }

        if (cells.length > 0) {
            await this.consumers[username].updateCells(cells);
        }

        if (wildPokemons.length > 0) {
            jobs = jobs.concat(this.consumers[username].updateWildPokemon(wildPokemons));
        }

        if (nearbyPokemons.length > 0) {
            jobs = jobs.concat(this.consumers[username].updateNearbyPokemon(nearbyPokemons));
        }

        if (encounters.length > 0) {
            jobs = jobs.concat(this.consumers[username].updateEncounters(encounters));
        }

        if (forts.length > 0) {
            jobs.push(this.consumers[username].updateForts(forts));
        }

        if (fortDetails.length > 0) {
            jobs.push(this.consumers[username].updateFortDetails(fortDetails));
        }

        if (gymInfos.length > 0) {
            jobs.push(this.consumers[username].updateGymInfos(gymInfos));
        }

        if (quests.length > 0) {
            jobs.push(this.consumers[username].updateQuests(quests));
        }

        await Promise.all(jobs);

        let endTime = process.hrtime(startTime);
        let ms = (endTime[0] * 1000000000 + endTime[1]) / 1000000;

        if (total > 0) {
            console.log(`[Raw] [${uuid}] Update Count: ${total} parsed in ${ms} ms`);
        }

        const responseData = {
            'nearby': nearbyPokemons.length,
            'wild': wildPokemons.length,
            'forts': forts.length,
            'quests': quests.length,
            'fort_search': fortSearch.length,
            'encounters': encounters.length,
            'level': trainerLevel,
            'only_empty_gmos': containsGMO && isEmptyGMO,
            'only_invalid_gmos': containsGMO && isInvalidGMO,
            'contains_gmos': containsGMO
        };

        sendResponse(res, 'ok', responseData);
    }
}

module.exports = RouteController;
