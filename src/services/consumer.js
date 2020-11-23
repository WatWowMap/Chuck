'use strict';

const S2 = require('nodes2ts');
const POGOProtos = require('pogo-protos');

const config = require('./config.js');
const Account = require('../models/account.js');
const Gym = require('../models/gym.js');
const Pokemon = require('../models/pokemon.js');
const Pokestop = require('../models/pokestop.js');

const MySQLConnector = require('../services/mysql.js');
const Cell = require('../models/cell');
const Weather = require('../models/weather');
const db = new MySQLConnector(config.db);

/**
 * Consumer database class
 */
class Consumer {

    constructor(username) {
        this.username = username;
        this.gymIdsPerCell = {};
        this.stopsIdsPerCell = {};
    }

    async updatePokemon(wildPokemon, nearbyPokemon) {
        if (wildPokemon.length > 0) {
            for (let i = 0; i < wildPokemon.length; i++) {
                let wild = wildPokemon[i];
                try {
                    await Pokemon.updateFromWild(wild.cell, wild.timestampMs, wild.data);
                } catch (err) {
                    console.error('[Wild] Error:', err.stack);
                }
            }
        }
        if (nearbyPokemon.length > 0) {
            for (let i = 0; i < nearbyPokemon.length; i++) {
                let nearby = nearbyPokemon[i];
                try {
                    await Pokemon.updateFromNearby(this.username, nearby.timestampMs, nearby.cell, nearby.data);
                } catch (err) {
                    console.error('[Nearby] Error:', err.stack);
                }
            }
        }
    }

    async updateForts(forts) {
        if (forts.length > 0) {
            const updatedGyms = [];
            const updatedPokestops = [];
            for (let i = 0; i < forts.length; i++) {
                let fort = forts[i];
                try {
                    switch (fort.data.type) {
                        case POGOProtos.Map.Fort.FortType.GYM: {
                            if (!config.dataparser.parse.gym) {
                                continue;
                            }
                            const gym = Gym.fromFort(fort.cell, fort.data);
                            await gym.triggerWebhook();
                            updatedGyms.push(gym.toJSON());

                            if (!this.gymIdsPerCell[fort.cell]) {
                                this.gymIdsPerCell[fort.cell] = [];
                            }
                            this.gymIdsPerCell[fort.cell.toString()].push(fort.data.id.toString());
                            break;
                        }
                        case POGOProtos.Map.Fort.FortType.CHECKPOINT: {
                            if (!config.dataparser.parse.pokestops) {
                                continue;
                            }
                            const pokestop = Pokestop.fromFort(fort.cell, fort.data);
                            await pokestop.triggerWebhook(false);
                            updatedPokestops.push(pokestop.toJSON());

                            if (!this.stopsIdsPerCell[fort.cell]) {
                                this.stopsIdsPerCell[fort.cell] = [];
                            }
                            this.stopsIdsPerCell[fort.cell.toString()].push(fort.data.id.toString());
                            break;
                        }
                    }
                } catch (err) {
                    console.error('[Forts] Error:', err);
                }
            }
            if (updatedGyms.length > 0) {
                try {
                    let result = await Gym.bulkCreate(updatedGyms, {
                        updateOnDuplicate: Gym.fromFortFields,
                    });
                    //console.log('[Gym] Result:', result.length);
                } catch (err) {
                    console.error('[Gym] Error:', err);
                    //console.error('sql:', sqlUpdate);
                    //console.error('args:', args);
                }
            }
            if (updatedPokestops.length > 0) {
                try {
                    let result = await Pokestop.bulkCreate(updatedPokestops, {
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
                    url: details.image_urls.length > 0 ? details.image_urls[0] : '',
                    updated: ts,
                    firstSeenTimestamp: ts,
                };
                switch (details.type) {
                    case POGOProtos.Map.Fort.FortType.GYM:
                        updatedGyms.push(record);
                        break;
                    case POGOProtos.Map.Fort.FortType.CHECKPOINT:
                        updatedPokestops.push(record);
                        break;
                }
            }

            if (updatedGyms.length > 0) {
                try {
                    const result = await Gym.bulkCreate(updatedGyms, {
                        updateOnDuplicate: Consumer.fortColumns,
                    });
                    //console.log('[FortDetails] Result:', result.length);
                } catch (err) {
                    console.error('[FortDetails] Error:', err.stack);
                }
            }

            if (updatedPokestops.length > 0) {
                try {
                    const result = await Pokestop.bulkCreate(updatedGyms, {
                        updateOnDuplicate: Consumer.fortColumns,
                    });
                    //console.log('[FortDetails] Result:', result.length);
                } catch (err) {
                    console.error('[FortDetails] Error:', err.stack);
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
                    let id = info.gym_status_and_defenders.pokemon_fort_proto.id;
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
                                ${trainer.team_color},
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
                                ${defender.pokemon.move_1},
                                ${defender.pokemon.move_2},
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
                    const result = await Gym.bulkCreate(updatedGyms, {
                        updateOnDuplicate: fortColumns,
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
                    let result = await db.query(sql);
                    //console.log('[GymInfos] Result:', result.affectedRows);
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
                    let result = await db.query(sql);
                    //console.log('[GymInfos] Result:', result.affectedRows);
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
               
                if (!this.gymIdsPerCell[cellId]) {
                    this.gymIdsPerCell[cellId] = [];
                }
                if (!this.stopsIdsPerCell[cellId]) {
                    this.stopsIdsPerCell[cellId] = [];
                } 
            }
            let result = await Cell.bulkCreate(updatedCells, {
                updateOnDuplicate: [
                    'level',
                    'centerLat',
                    'centerLon',
                    'updated',
                ],
            });
            //console.log('[Cell] Result:', result.length);
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
            let result = await Weather.bulkCreate(updatedWeather, {
                updateOnDuplicate: Weather.fromClientWeatherFields,
            });
            //console.log('[Weather] Result:', result.length);
        }
    }

    async updateEncounters(encounters) {
        if (encounters.length > 0) {
            for (let i = 0; i < encounters.length; i++) {
                let encounter = encounters[i];
                try {
                    await Pokemon.updateFromEncounter(encounter, this.username);
                } catch (err) {
                    console.error('[Encounter] Error:', err);
                }
            }
        }
    }

    async updateQuests(quests) {
        if (quests.length > 0) {
            let updatedPokestops = [];
            for (let i = 0; i < quests.length; i++) {
                let quest = quests[i];
                let pokestop = Pokestop.fromQuest(quest);
                if (await pokestop.triggerWebhook(true)) {
                    console.warn('[Quest] Found a quest belonging to a new stop, skipping...');
                    continue;
                }
                updatedPokestops.push(pokestop.toJSON());
            }
            if (updatedPokestops.length > 0) {
                try {
                    let result = await Pokestop.bulkCreate(updatedPokestops, {
                        updateOnDuplicate: Pokestop.fromQuestFields,
                    });
                    //console.log('[Quest] Result:', result.length);
                } catch (err) {
                    console.error('[Quest] Error:', err.stack);
                }
            }
        }
    }

    async updatePlayerData(playerData) {
        if (playerData.length > 0) {
            let playerDataSQL = [];
            for (let i = 0; i < playerData.length; i++) {
                let data = playerData[i];
                if (!data || !data.player_data) {
                    // Don't try and process empty data
                    continue;
                }
                try {
                    let account;
                    try {
                        account = await Account.getWithUsername(this.username);
                    } catch (err) {
                        console.error('[Account] Error:', err);
                        account = null;
                    }
                    if (account instanceof Account) {
                        // Add quest data to pokestop object
                        account.parsePlayerData(data);
                        playerDataSQL.push(account.toSql());
                    }
                } catch (err) {
                    console.error('[Account] Error:', err);
                }
            }

            if (playerDataSQL.length > 0) {
                let sqlUpdate = `INSERT INTO account (
                    username, password, first_warning_timestamp, failed, level,
                    last_encounter_lat, last_encounter_lon, last_encounter_time,
                    spins, tutorial, creation_timestamp_ms, warn, warn_expire_ms,
                    warn_message_acknowledged, suspended_message_acknowledged,
                    was_suspended, banned, creation_timestamp, warn_expire_timestamp
                ) VALUES
                `;
                sqlUpdate += playerDataSQL.join(',');
                //console.log('sql:', sqlUpdate);
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                    password=VALUES(password),
                    first_warning_timestamp=VALUES(first_warning_timestamp),
                    failed=VALUES(failed),
                    level=VALUES(level),
                    last_encounter_lat=VALUES(last_encounter_lat),
                    last_encounter_lon=VALUES(last_encounter_lon),
                    last_encounter_time=VALUES(last_encounter_time),
                    spins=VALUES(spins),
                    tutorial=VALUES(tutorial),
                    creation_timestamp_ms=VALUES(creation_timestamp_ms),
                    warn=VALUES(warn),
                    warn_expire_ms=VALUES(warn_expire_ms),
                    warn_message_acknowledged=VALUES(warn_message_acknowledged),
                    suspended_message_acknowledged=VALUES(suspended_message_acknowledged),
                    was_suspended=VALUES(was_suspended),
                    banned=VALUES(banned)
                `;
                let result = await db.query(sqlUpdate);
                console.log('[PlayerData] Result:', result.affectedRows);
            }
        }
    }
}

module.exports = Consumer;
