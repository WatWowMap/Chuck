'use strict';

const S2 = require('nodes2ts');
const POGOProtos = require('pogo-protos');

const config = require('./config.js');
const Account = require('../models/account.js');
const Gym = require('../models/gym.js');
const Pokemon = require('../models/pokemon.js');
const Pokestop = require('../models/pokestop.js');

const sequelize = require('./sequelize.js');
const Cell = require('../models/cell');
const Weather = require('../models/weather');

// this needs to be an arbitrary fixed order in order to prevent deadlocks
const stringCompare = (field) => (a, b) => (a[field] > b[field]) - (a[field] < b[field]);

/**
 * Consumer database class
 */
class Consumer {

    constructor(username) {
        this.username = username;
    }

    updateWildPokemon(wildPokemon) {
        return wildPokemon.map(async wild => {
            try {
                await Pokemon.updateFromWild(this.username, wild.timestampMs, wild.cell, wild.data);
            } catch (err) {
                console.error('[Wild] Error:', err);
            }
        });
    }

    updateNearbyPokemon(nearbyPokemon) {
        return nearbyPokemon.map(async nearby => {
            try {
                await Pokemon.updateFromNearby(this.username, nearby.timestampMs, nearby.cell, nearby.data);
            } catch (err) {
                console.error('[Nearby] Error:', err);
            }
        });
    }

    async updateForts(forts) {
        if (forts.length > 0) {
            const updatedGyms = [];
            const updatedGymsWithUrl = [];
            const updatedPokestops = [];
            for (let i = 0; i < forts.length; i++) {
                let fort = forts[i];
                try {
                    switch (fort.data.fort_type) {
                        case POGOProtos.Rpc.FortType.GYM: {
                            if (!config.dataparser.parse.gym) {
                                continue;
                            }
                            const gym = Gym.fromFort(fort.cell, fort.data);
                            await gym.triggerWebhook();
                            if (gym.url) {
                                updatedGymsWithUrl.push(gym.toJSON());
                            } else {
                                updatedGyms.push(gym.toJSON());
                            }
                            break;
                        }
                        case POGOProtos.Rpc.FortType.CHECKPOINT: {
                            if (!config.dataparser.parse.pokestops) {
                                continue;
                            }
                            const pokestop = Pokestop.fromFort(fort.cell, fort.data);
                            await pokestop.triggerWebhook(false);
                            updatedPokestops.push(pokestop.toJSON());
                            break;
                        }
                    }
                } catch (err) {
                    console.error('[Forts] Error:', err);
                }
            }
            if (updatedGyms.length > 0 || updatedGymsWithUrl.length > 0) {
                try {
                    let result = await Gym.bulkCreate(updatedGyms.sort(stringCompare('id')), {
                        updateOnDuplicate: Gym.fromFortFields,
                    });
                    //console.log('[Gym] Result:', result.length);
                    await Gym.bulkCreate(updatedGymsWithUrl.sort(stringCompare('id')), {
                        updateOnDuplicate: ['url'].concat(Gym.fromFortFields),
                    });
                } catch (err) {
                    console.error('[Gym] Error:', err);
                    //console.error('sql:', sqlUpdate);
                    //console.error('args:', args);
                }
            }
            if (updatedPokestops.length > 0) {
                try {
                    let result = await Pokestop.bulkCreate(updatedPokestops.sort(stringCompare('id')), {
                        updateOnDuplicate: Pokestop.fromFortFields,
                    });
                    //console.log('[Pokestop] Result:', result.length);
                } catch (err) {
                    console.error('[Pokestop] Error:', err);
                }
            }
        }
    }

    static fortColumns = [
        'lat',
        'lon',
        'name',
        'url',
        'updated',
    ];

    async updateFortDetails(fortDetails) {
        // Update Forts
        if (fortDetails.length > 0) {
            let ts = new Date().getTime() / 1000;
            const updatedGyms = [];
            const updatedPokestops = [];

            for (let i = 0; i < fortDetails.length; i++) {
                let details = fortDetails[i];
                const record = {
                    id: details.fort_id,
                    lat: details.latitude,
                    lon: details.longitude,
                    name: details.name ? details.name : '',
                    url: details.image_url.length > 0 ? details.image_url[0] : '',
                    updated: ts,
                    firstSeenTimestamp: ts,
                };
                switch (details.type) {
                    case POGOProtos.Rpc.FortType.GYM:
                        updatedGyms.push(record);
                        break;
                    case POGOProtos.Rpc.FortType.CHECKPOINT:
                        updatedPokestops.push(record);
                        break;
                }
            }

            if (updatedGyms.length > 0) {
                try {
                    const result = await Gym.bulkCreate(updatedGyms.sort(stringCompare('id')), {
                        updateOnDuplicate: Consumer.fortColumns,
                    });
                    //console.log('[FortDetails] Result:', result.length);
                } catch (err) {
                    console.error('[FortDetails] Error:', err);
                }
            }

            if (updatedPokestops.length > 0) {
                try {
                    const result = await Pokestop.bulkCreate(updatedPokestops.sort(stringCompare('id')), {
                        updateOnDuplicate: Consumer.fortColumns,
                    });
                    //console.log('[FortDetails] Result:', result.length);
                } catch (err) {
                    console.error('[FortDetails] Error:', err);
                }
            }
        }
    }

    async updateGymInfos(gymInfos) {
        if (gymInfos.length > 0) {
            const ts = new Date().getTime() / 1000;
            const updatedGyms = [];
            let trainersSQL = [];
            let defendersSQL = [];
            for (let i = 0; i < gymInfos.length; i++) {
                let info = gymInfos[i];
                try {
                    if (!info.gym_status_and_defenders) {
                        console.error('[GymInfos] Invalid gym_status_and_defenders provided, skipping...', info);
                        continue;
                    }
                    let id = info.gym_status_and_defenders.pokemon_fort_proto.fort_id;
                    let gymDefenders = info.gym_status_and_defenders.gym_defender;
                    if (config.dataparser.parse.gymDefenders && gymDefenders) {
                        for (let i = 0; i < gymDefenders.length; i++) {
                            const gymDefender = gymDefenders[i];
                            const trainer = gymDefender.trainer_public_profile;
                            const defender = gymDefender.motivated_pokemon;
                            //trainer_public_profile
                            //motivated_pokemon
                            //deployment_totals { deployment_duration_ms, times_fed }
                            trainersSQL.push(`
                            (
                                '${trainer.name}',
                                ${trainer.level},
                                ${trainer.team},
                                ${trainer.battles_won},
                                ${trainer.km_walked},
                                ${trainer.caught_pokemon},
                                ${trainer.experience.toString()},
                                ${trainer.combat_rank},
                                ${trainer.combat_rating},
                                UNIX_TIMESTAMP()
                            )
                            `);
                            defendersSQL.push(`
                            (
                                ${defender.pokemon.id.toString()},
                                ${defender.pokemon.pokemon_id},
                                ${defender.cp_when_deployed},
                                ${defender.cp_now},
                                ${defender.berry_value},
                                ${gymDefender.deployment_totals.times_fed},
                                ${gymDefender.deployment_totals.deployment_duration_ms / 1000},
                                '${defender.pokemon.owner_name}',
                                '${id}',
                                ${defender.pokemon.individual_attack},
                                ${defender.pokemon.individual_defense},
                                ${defender.pokemon.individual_stamina},
                                ${defender.pokemon.move1},
                                ${defender.pokemon.move2},
                                ${defender.pokemon.battles_attacked || 0},
                                ${defender.pokemon.battles_defended || 0},
                                ${defender.pokemon.pokemon_display.gender},
                                ${defender.pokemon.hatched_from_egg || false},
                                ${defender.pokemon.pvp_combat_stats ? defender.pokemon.pvp_combat_stats.num_won || 0 : 0},
                                ${defender.pokemon.pvp_combat_stats ? defender.pokemon.pvp_combat_stats.num_total || 0 : 0},
                                ${defender.pokemon.npc_combat_stats ? defender.pokemon.npc_combat_stats.num_won || 0 : 0},
                                ${defender.pokemon.npc_combat_stats ? defender.pokemon.npc_combat_stats.num_total || 0 : 0},
                                UNIX_TIMESTAMP()
                            )
                            `);
                        }
                    }
                    updatedGyms.push({
                        id,
                        lat: info.gym_status_and_defenders.pokemon_fort_proto.latitude,
                        lon: info.gym_status_and_defenders.pokemon_fort_proto.longitude,
                        name: info.name ? info.name : '',
                        url: info.url ? info.url : '',
                        updated: ts,
                        firstSeenTimestamp: ts,
                    });
                } catch (err) {
                    console.error('[GymInfos] Error:', err);
                }
            }
            if (updatedGyms.length > 0) {
                try {
                    const result = await Gym.bulkCreate(updatedGyms.sort(stringCompare('id')), {
                        updateOnDuplicate: Consumer.fortColumns,
                    });
                    //console.log('[GymInfos] Result:', result.length);
                } catch (err) {
                    console.error('[GymInfos] Error:', err);
                }
            }
            if (trainersSQL.length > 0) {
                let sql = 'INSERT INTO trainer (name, level, team_id, battles_won, km_walked, pokemon_caught, experience, combat_rank, combat_rating, updated) VALUES';
                sql += trainersSQL.join(',');
                sql += `
                ON DUPLICATE KEY UPDATE
                    level=VALUES(level),
                    team_id=VALUES(team_id),
                    battles_won=VALUES(battles_won),
                    km_walked=VALUES(km_walked),
                    pokemon_caught=VALUES(pokemon_caught),
                    experience=VALUES(experience),
                    combat_rank=VALUES(combat_rank),
                    combat_rating=VALUES(combat_rating),
                    updated=VALUES(updated)
                `;
                try {
                    let result = await sequelize.query(sql);
                    //console.log('[GymInfos] Result:', result[0].length);
                } catch (err) {
                    console.error('[Trainers] Error:', err);
                }
            }
            if (defendersSQL.length > 0) {
                let sql = `
                INSERT INTO gym_defender (
                    id, pokemon_id, cp_when_deployed, cp_now, berry_value, times_fed, deployment_duration,
                    trainer_name, fort_id, atk_iv, def_iv, sta_iv, move_1, move_2, battles_attacked, battles_defended,
                    gender, hatched_from_egg, pvp_combat_won, pvp_combat_total, npc_combat_won, npc_combat_total, updated
                ) VALUES`;
                sql += defendersSQL.join(',');
                sql += `
                ON DUPLICATE KEY UPDATE
                    pokemon_id=VALUES(pokemon_id),
                    cp_when_deployed=VALUES(cp_when_deployed),
                    cp_now=VALUES(cp_now),
                    berry_value=VALUES(berry_value),
                    times_fed=VALUES(times_fed),
                    deployment_duration=VALUES(deployment_duration),
                    trainer_name=VALUES(trainer_name),
                    fort_id=VALUES(fort_id),
                    atk_iv=VALUES(atk_iv),
                    def_iv=VALUES(def_iv),
                    sta_iv=VALUES(sta_iv),
                    move_1=VALUES(move_1),
                    move_2=VALUES(move_2),
                    battles_attacked=VALUES(battles_attacked),
                    battles_defended=VALUES(battles_defended),
                    gender=VALUES(gender),
                    hatched_from_egg=VALUES(hatched_from_egg),
                    pvp_combat_won=VALUES(pvp_combat_won),
                    pvp_combat_total=VALUES(pvp_combat_total),
                    npc_combat_won=VALUES(npc_combat_won),
                    npc_combat_total=VALUES(npc_combat_total),
                    updated=VALUES(updated)
                `;
                try {
                    let result = await sequelize.query(sql);
                    //console.log('[GymInfos] Result:', result[0].length);
                } catch (err) {
                    console.error('[Defenders] Error:', err);
                    console.error('sql:', sql);
                }
            }
        }
    }

    async updateCells(cells) {
        if (cells.length > 0) {
            let updatedCells = [];
            let ts = new Date().getTime() / 1000;
            for (let i = 0; i < cells.length; i++) {
                let cellId = BigInt(cells[i]).toString();
                try {
                    let s2cell = new S2.S2Cell(new S2.S2CellId(cellId));
                    let center = s2cell.getRectBound().getCenter();
                    //s2cell.capBound.rectBound.center.lng.degrees
                    updatedCells.push({
                        id: cellId,
                        level: s2cell.level,
                        centerLat: center.latDegrees,
                        centerLon: center.lngDegrees,
                        updated: ts,
                    });
                } catch (err) {
                    console.error('[Cell] Error:', err);
                }
            }
            try {
                let result = await Cell.bulkCreate(updatedCells.sort(stringCompare('id')), {
                    updateOnDuplicate: [
                        'level',
                        'centerLat',
                        'centerLon',
                        'updated',
                    ],
                });
                //console.log('[Cell] Result:', result.length);
            } catch (err) {
                console.error('[Cell] Error:', err);
            }
        }
    }

    async updateWeather(weather) {
        if (weather.length > 0) {
            let updatedWeather = [];
            let ts = new Date().getTime() / 1000;
            for (let i = 0; i < weather.length; i++) {
                let conditions = weather[i];
                try {
                    const weather = Weather.fromClientWeather(conditions.cell.toString(), conditions.data, ts);
                    await weather.triggerWebhook();
                    updatedWeather.push(weather.toJSON());
                } catch (err) {
                    console.error('[Weather] Error:', err);
                }
            }
            let result = await Weather.bulkCreate(updatedWeather.sort(stringCompare('id')), {
                updateOnDuplicate: Weather.fromClientWeatherFields,
            });
            //console.log('[Weather] Result:', result.length);
        }
    }

    updateEncounters(encounters) {
        return encounters.map(async encounter => {
            try {
                await Pokemon.updateFromEncounter(encounter, this.username);
            } catch (err) {
                console.error('[Encounter] Error:', err);
            }
        });
    }

    async updateQuests(quests) {
        if (quests.length > 0) {
            let updatedPokestops = [];
            for (let i = 0; i < quests.length; i++) {
                let quest = quests[i];
                let pokestop = await Pokestop.fromQuest(quest);
                if (await pokestop.triggerWebhook(true)) {
                    console.warn('[Quest] Found a quest belonging to a new stop, skipping...');
                    continue;
                }
                updatedPokestops.push(pokestop.toJSON());
            }
            if (updatedPokestops.length > 0) {
                try {
                    let result = await Pokestop.bulkCreate(updatedPokestops.sort(stringCompare('id')), {
                        updateOnDuplicate: Pokestop.fromQuestFields,
                    });
                    //console.log('[Quest] Result:', result.length);
                } catch (err) {
                    console.error('[Quest] Error:', err);
                }
            }
        }
    }

    updatePlayerData(playerData) {
        return playerData.map(async data => {
            if (!data || !data.player_data) {
                // Don't try and process empty data
                return;
            }
            try {
                let account = null;
                try {
                    account = await Account.findByPk(this.username);
                } catch (err) {
                    console.error('[Account] Error:', err);
                }
                if (account !== null) {
                    account.parsePlayerData(data);
                    await account.save();   // todo: handle race?
                }
            } catch (err) {
                console.error('[Account] Error:', err);
            }
        });
    }
}

module.exports = Consumer;
