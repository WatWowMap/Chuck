'use strict';

const S2 = require('nodes2ts');
const POGOProtos = require('pogo-protos');

const config = require('../config.json');
const Account = require('../models/account.js');
const Gym = require('../models/gym.js');
const Pokemon = require('../models/pokemon.js');
const Pokestop = require('../models/pokestop.js');
const Spawnpoint = require('../models/spawnpoint.js');

const MySQLConnector = require('../services/mysql.js');
const WebhookController = require('../services/webhook.js');
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

    // TODO: Get fort id
    async updatePokemon(wildPokemon, nearbyPokemon) {
        if (wildPokemon.length > 0) {
            let wildSQL = [];
            let ts = new Date().getTime() / 1000;
            for (let i = 0; i < wildPokemon.length; i++) {
                let wild = wildPokemon[i];
                try {
                    let pokemon = new Pokemon({
                        username: this.username,
                        cellId: wild.cell,
                        timestampMs: wild.timestampMs,
                        wild: wild.data
                    });
                    if (!pokemon.lat && pokemon.pokestopId) {
                        if (!pokemon.pokestopId) {
                            continue;
                        }
                        let pokestop;
                        try {
                            pokestop = await Pokestop.getById(pokemon.pokestopId);
                        } catch (err) {
                            console.error('[Wild] Error:', err);
                        }
                        if (!pokestop) {
                            continue;
                        }
                        pokemon.lat = pokestop.lat;
                        pokemon.lon = pokestop.lon;
                    }
                    pokemon.changed = ts;
                    if (!pokemon.firstSeenTimestamp) {
                        pokemon.firstSeenTimestamp = new Date().getTime() / 1000;
                    }
                    await pokemon.update();

                    wildSQL.push(pokemon.toSql());
                } catch (err) {
                    console.error('[Wild] Error:', err);
                }
            }
            if (wildSQL.length > 0) {
                let sqlUpdate = `
                INSERT INTO pokemon (
                    id, pokemon_id, lat, lon, spawn_id, expire_timestamp, atk_iv, def_iv, sta_iv,
                    move_1, move_2, gender, form, cp, level, weather, costume, weight, size,
                    display_pokemon_id, pokestop_id, updated, first_seen_timestamp, changed, cell_id,
                    expire_timestamp_verified, shiny, username, capture_1, capture_2, capture_3,
                    pvp_rankings_great_league, pvp_rankings_ultra_league
                ) VALUES
                `;
                sqlUpdate += wildSQL.join(',');
                //console.log('sql:', sqlUpdate);
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                    pokemon_id=VALUES(pokemon_id),
                    lat=VALUES(lat),
                    lon=VALUES(lon),
                    spawn_id=VALUES(spawn_id),
                    expire_timestamp=VALUES(expire_timestamp),
                    atk_iv=VALUES(atk_iv),
                    def_iv=VALUES(def_iv),
                    sta_iv=VALUES(sta_iv),
                    move_1=VALUES(move_1),
                    move_2=VALUES(move_2),
                    gender=VALUES(gender),
                    form=VALUES(form),
                    cp=VALUES(cp),
                    level=VALUES(level),
                    weather=VALUES(weather),
                    costume=VALUES(costume),
                    weight=VALUES(weight),
                    size=VALUES(size),
                    display_pokemon_id=VALUES(display_pokemon_id),
                    pokestop_id=VALUES(pokestop_id),
                    updated=VALUES(updated),
                    first_seen_timestamp=VALUES(first_seen_timestamp),
                    changed=VALUES(changed),
                    cell_id=VALUES(cell_id),
                    expire_timestamp_verified=VALUES(expire_timestamp_verified),
                    shiny=VALUES(shiny),
                    username=VALUES(username),
                    capture_1=VALUES(capture_1),
                    capture_2=VALUES(capture_2),
                    capture_3=VALUES(capture_3),
                    pvp_rankings_great_league=VALUES(pvp_rankings_great_league),
                    pvp_rankings_ultra_league=VALUES(pvp_rankings_ultra_league)                    
                `;
                try {
                    let result = await db.query(sqlUpdate);
                    //console.log('[Wild] Result:', result.affectedRows);
                } catch (err) {
                    console.error('[Wild] Error:', err);
                    console.error('[Wild] sql:', sqlUpdate);
                }
            }
        }
        if (nearbyPokemon.length > 0) {
            let nearbySQL = [];
            let ts = new Date().getTime() / 1000;
            for (let i = 0; i < nearbyPokemon.length; i++) {
                let nearby = nearbyPokemon[i];
                try {
                    let pokemon = new Pokemon({
                        username: this.username,
                        cellId: nearby.cell,
                        //timestampMs: nearbyPokemon.timestamp_ms,
                        nearby: nearby.data
                    });
                    if (!pokemon.lat && pokemon.pokestopId) {
                        if (!pokemon.pokestopId) {
                            continue;
                        }
                        let pokestop;
                        try {
                            pokestop = await Pokestop.getById(pokemon.pokestopId);
                        } catch (err) {
                            console.error('[Nearby] Error:', err.message);
                        }
                        if (!pokestop) {
                            continue;
                        }
                        pokemon.lat = pokestop.lat;
                        pokemon.lon = pokestop.lon;
                    }
                    if (!pokemon.lat) {
                        continue;
                    }
                    pokemon.changed = ts;
                    if (!pokemon.firstSeenTimestamp) {
                        pokemon.firstSeenTimestamp = new Date().getTime() / 1000;
                    }
                    await pokemon.update();

                    nearbySQL.push(pokemon.toSql());
                } catch (err) {
                    console.error('[Nearby] Error:', err.message);
                }
            }
            if (nearbySQL.length > 0) {
                let sqlUpdate = `
                INSERT INTO pokemon (
                    id, pokemon_id, lat, lon, spawn_id, expire_timestamp, atk_iv, def_iv, sta_iv,
                    move_1, move_2, gender, form, cp, level, weather, costume, weight, size,
                    display_pokemon_id, pokestop_id, updated, first_seen_timestamp, changed, cell_id,
                    expire_timestamp_verified, shiny, username, capture_1, capture_2, capture_3,
                    pvp_rankings_great_league, pvp_rankings_ultra_league
                ) VALUES
                `;
                sqlUpdate += nearbySQL.join(',');
                //console.log('sql:', sqlUpdate);
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                pokemon_id=VALUES(pokemon_id),
                lat=VALUES(lat),
                lon=VALUES(lon),
                spawn_id=VALUES(spawn_id),
                expire_timestamp=VALUES(expire_timestamp),
                atk_iv=VALUES(atk_iv),
                def_iv=VALUES(def_iv),
                sta_iv=VALUES(sta_iv),
                move_1=VALUES(move_1),
                move_2=VALUES(move_2),
                gender=VALUES(gender),
                form=VALUES(form),
                cp=VALUES(cp),
                level=VALUES(level),
                weather=VALUES(weather),
                costume=VALUES(costume),
                weight=VALUES(weight),
                size=VALUES(size),
                display_pokemon_id=VALUES(display_pokemon_id),
                pokestop_id=VALUES(pokestop_id),
                updated=VALUES(updated),
                first_seen_timestamp=VALUES(first_seen_timestamp),
                changed=VALUES(changed),
                cell_id=VALUES(cell_id),
                expire_timestamp_verified=VALUES(expire_timestamp_verified),
                shiny=VALUES(shiny),
                username=VALUES(username),
                capture_1=VALUES(capture_1),
                capture_2=VALUES(capture_2),
                capture_3=VALUES(capture_3),
                pvp_rankings_great_league=VALUES(pvp_rankings_great_league),
                pvp_rankings_ultra_league=VALUES(pvp_rankings_ultra_league)
                `;
                try {
                    let result = await db.query(sqlUpdate);
                //console.log('[Nearby] Result:', result.affectedRows);
                } catch (err) {
                    console.error('[Nearby] Error:', err.message);
                }
            }
        }
    }

    async updateForts(forts) {
        if (forts.length > 0) {
            const updatedGyms = [];
            let pokestopsSQL = [];
            let gymArgs = [];
            let pokestopArgs = [];
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
                        case POGOProtos.Map.Fort.FortType.CHECKPOINT:
                            if (!config.dataparser.parse.pokestops) {
                                continue;
                            }
                            let pokestop = new Pokestop({
                                cellId: fort.cell,
                                fort: fort.data
                            });
                            await pokestop.update(false);
                            let pokestopSQL = pokestop.toSql('pokestop');
                            pokestopsSQL.push(pokestopSQL.sql);
                            pokestopSQL.args.forEach(x => pokestopArgs.push(x));
                            //pokestopsSQL.push(pokestop.toSql('pokestop'));

                            if (!this.stopsIdsPerCell[fort.cell]) {
                                this.stopsIdsPerCell[fort.cell] = [];
                            }
                            this.stopsIdsPerCell[fort.cell.toString()].push(fort.data.id.toString());
                            break;
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
            if (pokestopsSQL.length > 0) {
                let sqlUpdate = `INSERT INTO pokestop (
                    id, lat, lon, name, url, lure_expire_timestamp, last_modified_timestamp, updated,
                    enabled, cell_id, deleted, lure_id, pokestop_display, incident_expire_timestamp,
                    first_seen_timestamp, grunt_type, sponsor_id
                ) VALUES
                `;
                sqlUpdate += pokestopsSQL.join(',');
                //console.log('sql:', sqlUpdate);
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                    lat=VALUES(lat),
                    lon=VALUES(lon),
                    name=VALUES(name),
                    url=VALUES(url),
                    lure_expire_timestamp=VALUES(lure_expire_timestamp),
                    last_modified_timestamp=VALUES(last_modified_timestamp),
                    updated=VALUES(updated),
                    enabled=VALUES(enabled),
                    cell_id=VALUES(cell_id),
                    deleted=VALUES(deleted),
                    lure_id=VALUES(lure_id),
                    pokestop_display=VALUES(pokestop_display),
                    incident_expire_timestamp=VALUES(incident_expire_timestamp),
                    first_seen_timestamp=VALUES(first_seen_timestamp),
                    grunt_type=VALUES(grunt_type),
                    sponsor_id=VALUES(sponsor_id)
                `;
                /*
                    quest_type=VALUES(quest_type),
                    quest_timestamp=VALUES(quest_timestamp),
                    quest_target=VALUES(quest_target),
                    quest_conditions=VALUES(quest_conditions),
                    quest_rewards=VALUES(quest_rewards),
                    quest_template=VALUES(quest_template),
                */
                try {
                    let result = await db.query(sqlUpdate, pokestopArgs);
                    //console.log('[Pokestop] Result:', result.affectedRows);
                } catch (err) {
                    console.error('[Pokestop] Error:', err);
                }
            }
        }
    }

    async updateFortDetails(fortDetails) {
        // Update Forts
        if (fortDetails.length > 0) {
            let ts = new Date().getTime() / 1000;
            let gymDetailsSQL = [];
            let gymArgs = [];
            let pokestopDetailsSQL = [];
            let pokestopArgs = [];

            for (let i = 0; i < fortDetails.length; i++) {
                let details = fortDetails[i];
                try {
                    let name = details.name ? details.name : '';
                    let url = details.image_urls.length > 0 ? details.image_urls[0] : '';
                    let id = details.fort_id;
                    let lat = details.latitude;
                    let lon = details.longitude;
                    //fortDetailsSQL.push(`('${id}', ${lat}, ${lon}, \`${name}\`, "${url}", ${ts}, ${ts})`);
                    switch (details.type) {
                        case POGOProtos.Map.Fort.FortType.GYM:
                            gymDetailsSQL.push('(?, ?, ?, ?, ?, ?, ?)');
                            gymArgs.push(id, lat, lon, name, url, ts, ts);
                            break;
                        case POGOProtos.Map.Fort.FortType.CHECKPOINT:
                            pokestopDetailsSQL.push('(?, ?, ?, ?, ?, ?, ?)');
                            pokestopArgs.push(id, lat, lon, name, url, ts, ts);
                            break;
                    }
                } catch (err) {
                    console.error('[FortDetails] Error:', err);
                }
            }

            if (gymDetailsSQL.length > 0) {
                let sqlUpdate = 'INSERT INTO gym (id, lat, lon, name, url, updated, first_seen_timestamp) VALUES';
                sqlUpdate += gymDetailsSQL.join(',');
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                    lat=VALUES(lat),
                    lon=VALUES(lon),
                    name=VALUES(name),
                    url=VALUES(url),
                    updated=VALUES(updated),
                    first_seen_timestamp=VALUES(first_seen_timestamp)
                `;

                try {
                    let result = await db.query(sqlUpdate, gymArgs);
                    //console.log('[FortDetails] Result:', result.affectedRows);
                } catch (err) {
                    console.error('[FortDetails] Error:', err);
                }
            }

            if (pokestopDetailsSQL.length > 0) {
                let sqlUpdate = 'INSERT INTO pokestop (id, lat, lon, name, url, updated, first_seen_timestamp) VALUES';
                sqlUpdate += pokestopDetailsSQL.join(',');
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                    lat=VALUES(lat),
                    lon=VALUES(lon),
                    name=VALUES(name),
                    url=VALUES(url),
                    updated=VALUES(updated),
                    first_seen_timestamp=VALUES(first_seen_timestamp)
                `;

                try {
                    let result = await db.query(sqlUpdate, pokestopArgs);
                    //console.log('[FortDetails] Result:', result.affectedRows);
                } catch (err) {
                    console.error('[FortDetails] Error:', err);
                }
            }
        }
    }

    async updateGymInfos(gymInfos) {
        if (gymInfos.length > 0) {
            let gymInfosSQL = [];
            let trainersSQL = [];
            let defendersSQL = [];
            let args = [];
            for (let i = 0; i < gymInfos.length; i++) {
                let info = gymInfos[i];
                try {
                    let name = info.name ? info.name : '';
                    let url = info.url ? info.url : '';
                    if (!info.gym_status_and_defenders) {
                        console.error('[GymInfos] Invalid gym_status_and_defenders provided, skipping...', info);
                        continue;
                    }
                    let id = info.gym_status_and_defenders.pokemon_fort_proto.id;
                    let lat = info.gym_status_and_defenders.pokemon_fort_proto.latitude;
                    let lon = info.gym_status_and_defenders.pokemon_fort_proto.longitude;
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
                    gymInfosSQL.push('(?, ?, ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())');
                    args.push(id, lat, lon, name, url);
                    //gymInfosSQL.push(`('${id}', ${lat}, ${lon}, \`${name}\`, "${url}", UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`);
                } catch (err) {
                    console.error('[GymInfos] Error:', err);
                }
            }
            if (gymInfosSQL.length > 0) {
                let sqlUpdate = 'INSERT INTO gym (id, lat, lon, name, url, updated, first_seen_timestamp) VALUES';
                sqlUpdate += gymInfosSQL.join(',');
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                    lat=VALUES(lat),
                    lon=VALUES(lon),
                    name=VALUES(name),
                    url=VALUES(url),
                    updated=VALUES(updated),
                    first_seen_timestamp=VALUES(first_seen_timestamp)
                `;
                try {
                    let result = await db.query(sqlUpdate, args);
                    //console.log('[GymInfos] Result:', result.affectedRows);
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
            let cells = [];
            let ts = new Date().getTime() / 1000;
            for (let i = 0; i < cells.length; i++) {
                let cellId = BigInt(cells[i]).toString();
                try {
                    let s2cell = new S2.S2Cell(new S2.S2CellId(cellId));
                    let center = s2cell.getRectBound().getCenter();
                    //s2cell.capBound.rectBound.center.lng.degrees
                    cells.push({
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
            let result = await Cell.bulkCreate(cells);
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
            let encountersSQL = [];
            let ts = new Date().getTime() / 1000;
            for (let i = 0; i < encounters.length; i++) {
                let encounter = encounters[i];
                try {
                    let pokemon;
                    try {
                        pokemon = await Pokemon.getById(encounter.wild_pokemon.encounter_id);
                    } catch (err) {
                        pokemon = null;
                    }
                    if (pokemon) {
                        await pokemon.addEncounter(encounter, this.username);
                    } else {
                        let centerCoord = new S2.S2Point(encounter.wild_pokemon.latitude, encounter.wild_pokemon.longitude, 0);
                        let center = S2.S2LatLng.fromPoint(centerCoord);
                        let centerNormalized = center.normalized();
                        let centerNormalizedPoint = centerNormalized.toPoint();
                        let circle = new S2.S2Cap(centerNormalizedPoint, 0.0);
                        let coverer = new S2.S2RegionCoverer();
                        coverer.setMaxCells(1);
                        coverer.setMinLevel(15);
                        coverer.setMaxLevel(15);
                        let cellIds = coverer.getCoveringCells(circle);
                        let cellId = cellIds.pop();
                        if (cellId) {
                            pokemon = new Pokemon({
                                wild: encounter.wild_pokemon,
                                username: this.username,
                                cellId: cellId,
                                timestampMs: parseInt(BigInt(encounter.wild_pokemon.last_modified_timestamp_ms).toString()) //last_modified_timestamp_ms / timestamp_ms
                            });
                            await pokemon.addEncounter(encounter, this.username);
                        }
                    }
                    if (!pokemon.spawnId) {
                        pokemon.spawnId = parseInt(encounter.wild_pokemon.spawn_point_id, 16);
                        const spawnpoint = Spawnpoint.fromPokemon(pokemon, null, ts);
                        await spawnpoint.upsert();
                        //console.log('spawnpoint id is null:', pokemon);
                    }
                    await pokemon.update();

                    encountersSQL.push(pokemon.toSql());
                } catch (err) {
                    console.error('[Encounter] Error:', err);
                }
            }
            let sqlUpdate = `
            INSERT INTO pokemon (
                id, pokemon_id, lat, lon, spawn_id, expire_timestamp, atk_iv, def_iv, sta_iv,
                move_1, move_2, gender, form, cp, level, weather, costume, weight, size,
                display_pokemon_id, pokestop_id, updated, first_seen_timestamp, changed, cell_id,
                expire_timestamp_verified, shiny, username, capture_1, capture_2, capture_3,
                pvp_rankings_great_league, pvp_rankings_ultra_league
            ) VALUES
            `;
            sqlUpdate += encountersSQL.join(',');
            //console.log('sql:', encountersSQL);
            sqlUpdate += ` 
            ON DUPLICATE KEY UPDATE
                pokemon_id=VALUES(pokemon_id),
                lat=VALUES(lat),
                lon=VALUES(lon),
                spawn_id=VALUES(spawn_id),
                expire_timestamp=VALUES(expire_timestamp),
                atk_iv=VALUES(atk_iv),
                def_iv=VALUES(def_iv),
                sta_iv=VALUES(sta_iv),
                move_1=VALUES(move_1),
                move_2=VALUES(move_2),
                gender=VALUES(gender),
                form=VALUES(form),
                cp=VALUES(cp),
                level=VALUES(level),
                weather=VALUES(weather),
                costume=VALUES(costume),
                weight=VALUES(weight),
                size=VALUES(size),
                display_pokemon_id=VALUES(display_pokemon_id),
                pokestop_id=VALUES(pokestop_id),
                updated=VALUES(updated),
                first_seen_timestamp=VALUES(first_seen_timestamp),
                changed=VALUES(changed),
                cell_id=VALUES(cell_id),
                expire_timestamp_verified=VALUES(expire_timestamp_verified),
                shiny=VALUES(shiny),
                username=VALUES(username),
                capture_1=VALUES(capture_1),
                capture_2=VALUES(capture_2),
                capture_3=VALUES(capture_3),
                pvp_rankings_great_league=VALUES(pvp_rankings_great_league),
                pvp_rankings_ultra_league=VALUES(pvp_rankings_ultra_league)
            `;
            try {
                let result = await db.query(sqlUpdate);
                //console.log('[Encounter] Result:', result.affectedRows);
            } catch (err) {
                console.error('[Encounter] Error:', err.message);
            }
        }
    }

    async updateQuests(quests) {
        if (quests.length > 0) {
            let questsSQL = [];
            let args = [];
            for (let i = 0; i < quests.length; i++) {
                let quest = quests[i];
                let pokestop;
                try {
                    pokestop = await Pokestop.getById(quest.fort_id);
                } catch (err) {
                    console.error('[Quest] Error:', err);
                    pokestop = null;
                }
                if (pokestop instanceof Pokestop) {
                    // Add quest data to pokestop object
                    pokestop.addQuest(quest);
                    // Check if we need to send any webhooks
                    await pokestop.update(true);
                    let sql = pokestop.toSql('quest');
                    questsSQL.push(sql.sql);
                    sql.args.forEach(x => args.push(x));
                    //questsSQL.push(pokestop.toSql('quest'));
                }
            }
            if (questsSQL.length > 0) {
                let sqlUpdate = `INSERT INTO pokestop (
                    id, lat, lon, name, url, lure_expire_timestamp, last_modified_timestamp, updated,
                    enabled, quest_type, quest_timestamp, quest_target, quest_conditions, quest_rewards,
                    quest_template, cell_id, deleted, lure_id, pokestop_display, incident_expire_timestamp,
                    first_seen_timestamp, grunt_type, sponsor_id
                ) VALUES
                `;
                sqlUpdate += questsSQL.join(',');
                //console.log('sql:', sqlUpdate);
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                    lat=VALUES(lat),
                    lon=VALUES(lon),
                    name=VALUES(name),
                    url=VALUES(url),
                    lure_expire_timestamp=VALUES(lure_expire_timestamp),
                    last_modified_timestamp=VALUES(last_modified_timestamp),
                    updated=VALUES(updated),
                    enabled=VALUES(enabled),
                    quest_type=VALUES(quest_type),
                    quest_timestamp=VALUES(quest_timestamp),
                    quest_target=VALUES(quest_target),
                    quest_conditions=VALUES(quest_conditions),
                    quest_rewards=VALUES(quest_rewards),
                    quest_template=VALUES(quest_template),
                    cell_id=VALUES(cell_id),
                    deleted=VALUES(deleted),
                    lure_id=VALUES(lure_id),
                    pokestop_display=VALUES(pokestop_display),
                    incident_expire_timestamp=VALUES(incident_expire_timestamp),
                    first_seen_timestamp=VALUES(first_seen_timestamp),
                    grunt_type=VALUES(grunt_type),
                    sponsor_id=VALUES(sponsor_id)
                `;
                try {
                    let result = await db.query(sqlUpdate, args);
                    //console.log('[Quest] Result:', result.affectedRows);
                } catch (err) {
                    console.error('[Quest] Error:', err);
                    console.error('sql:', sqlUpdate);
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
