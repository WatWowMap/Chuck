'use strict';

const S2 = require('nodes2ts');
const POGOProtos = require('pogo-protos');

const config = require('./config.js');
const Account = require('../models/account.js');
const Gym = require('../models/gym.js');
const Pokemon = require('../models/pokemon.js');
const Pokestop = require('../models/pokestop.js');
const Spawnpoint = require('../models/spawnpoint.js');

const MySQLConnector = require('../services/mysql.js');
const WebhookController = require('../services/webhook.js');
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
            let gymsSQL = [];
            let pokestopsSQL = [];
            let gymArgs = [];
            let pokestopArgs = [];
            for (let i = 0; i < forts.length; i++) {
                let fort = forts[i];
                try {
                    switch (fort.data.type) {
                        case POGOProtos.Map.Fort.FortType.GYM:
                            if (!config.dataparser.parse.gym) {
                                continue;
                            }
                            let gym = new Gym({
                                cellId: fort.cell,
                                fort: fort.data
                            });
                            await gym.update();
                            let gymSQL = gym.toSql();
                            gymsSQL.push(gymSQL.sql);
                            gymSQL.args.forEach(x => gymArgs.push(x));

                            if (!this.gymIdsPerCell[fort.cell]) {
                                this.gymIdsPerCell[fort.cell] = [];
                            }
                            this.gymIdsPerCell[fort.cell.toString()].push(fort.data.id.toString());
                            break;
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
            if (gymsSQL.length > 0) {
                let sqlUpdate = `
                INSERT INTO gym (
                    id, lat, lon, name, url, last_modified_timestamp, raid_end_timestamp, raid_spawn_timestamp, raid_battle_timestamp, 
                    updated, raid_pokemon_id, guarding_pokemon_id, availble_slots, team_id, raid_level, enabled, ex_raid_eligible, 
                    in_battle, raid_pokemon_move_1, raid_pokemon_move_2, raid_pokemon_form, raid_pokemon_cp, raid_is_exclusive, 
                    cell_id, deleted, total_cp, first_seen_timestamp, raid_pokemon_gender, sponsor_id, raid_pokemon_evolution
                ) VALUES
                `;
                sqlUpdate += gymsSQL.join(',');
                //console.log('sql:', sqlUpdate);
                sqlUpdate += ` 
                ON DUPLICATE KEY UPDATE
                    lat=VALUES(lat),
                    lon=VALUES(lon),
                    name=VALUES(name),
                    url=VALUES(url),
                    last_modified_timestamp=VALUES(last_modified_timestamp),
                    raid_end_timestamp=VALUES(raid_end_timestamp),
                    raid_spawn_timestamp=VALUES(raid_spawn_timestamp),
                    raid_battle_timestamp=VALUES(raid_battle_timestamp),
                    updated=VALUES(updated),
                    raid_pokemon_id=VALUES(raid_pokemon_id),
                    guarding_pokemon_id=VALUES(guarding_pokemon_id),
                    availble_slots=VALUES(availble_slots),
                    team_id=VALUES(team_id),
                    raid_level=VALUES(raid_level),
                    enabled=VALUES(enabled),
                    ex_raid_eligible=VALUES(ex_raid_eligible),
                    in_battle=VALUES(in_battle),
                    raid_pokemon_move_1=VALUES(raid_pokemon_move_1),
                    raid_pokemon_move_2=VALUES(raid_pokemon_move_2),
                    raid_pokemon_form=VALUES(raid_pokemon_form),
                    raid_pokemon_cp=VALUES(raid_pokemon_cp),
                    raid_is_exclusive=VALUES(raid_is_exclusive),
                    cell_id=VALUES(cell_id),
                    deleted=VALUES(deleted),
                    total_cp=VALUES(total_cp),
                    first_seen_timestamp=VALUES(first_seen_timestamp),
                    raid_pokemon_gender=VALUES(raid_pokemon_gender),
                    sponsor_id=VALUES(sponsor_id),
                    raid_pokemon_evolution=VALUES(raid_pokemon_evolution)
                `;
                try {
                    let result = await db.query(sqlUpdate, gymArgs);
                    //console.log('[Gym] Result:', result.affectedRows);
                } catch (err) {
                    console.error('[Gym] Error:', err.message);
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
            let cellsSQL = [];
            let ts = new Date().getTime() / 1000;
            for (let i = 0; i < cells.length; i++) {
                let cellId = BigInt(cells[i]).toString();
                try {
                    let s2cell = new S2.S2Cell(new S2.S2CellId(cellId));
                    let center = s2cell.getRectBound().getCenter();
                    let lat = center.latDegrees;
                    let lon = center.lngDegrees;
                    //s2cell.capBound.rectBound.center.lng.degrees
                    let level = s2cell.level;
                    cellsSQL.push(`(${cellId}, ${level}, ${lat}, ${lon}, ${ts})`);
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
            let sqlUpdate = 'INSERT INTO s2cell (id, level, center_lat, center_lon, updated) VALUES';
            sqlUpdate += cellsSQL.join(',');
            sqlUpdate += ` 
            ON DUPLICATE KEY UPDATE
                level=VALUES(level),
                center_lat=VALUES(center_lat),
                center_lon=VALUES(center_lon),
                updated=VALUES(updated)
            `;
            let result = await db.query(sqlUpdate);
            //console.log('[Cell] Result:', result.affectedRows);
        }
    }

    async updateWeather(weather) {
        if (weather.length > 0) {
            let weatherSQL = [];
            let ts = new Date().getTime() / 1000;
            for (let i = 0; i < weather.length; i++) {
                let conditions = weather[i];
                try {
                    let cellId = conditions.cell.toString();
                    let s2cell = new S2.S2Cell(new S2.S2CellId(cellId));
                    let center = s2cell.getRectBound().getCenter();
                    let lat = center.latDegrees;
                    let lon = center.lngDegrees;
                    let level = s2cell.level;
                    let gameplayCondition = conditions.data.gameplay_weather.gameplay_condition || 0;
                    let windDirection = conditions.data.display_weather.wind_direction || 0;
                    let cloudLevel = conditions.data.display_weather.cloud_level || 0;
                    let rainLevel = conditions.data.display_weather.rain_level || 0;
                    let windLevel = conditions.data.display_weather.wind_level || 0;
                    let snowLevel = conditions.data.display_weather.snow_level || 0;
                    let fogLevel = conditions.data.display_weather.fog_level || 0;
                    let seLevel = conditions.data.display_weather.special_effect_level || 0;
                    let severity = 0;
                    let warnWeather = 0;
                    for (let i = 0; i < conditions.data.alerts.length; i++) {
                        let severityCondition = conditions.data.alerts[i];
                        severity = severityCondition.severity;
                        warnWeather = severityCondition.warn_weather;
                    }
                    const weather = new Weather(cellId, level, lat, lon, gameplayCondition, windDirection, cloudLevel, rainLevel, windLevel, snowLevel, fogLevel, seLevel, severity, warnWeather, ts);
                    // TODO: Move weather webhook to Weather class
                    WebhookController.instance.addWeatherEvent(weather.toJson());
                    weatherSQL.push(weather.toSql());
                } catch (err) {
                    console.error('[Weather] Error:', err);
                }
            }
            let sqlUpdate = 'INSERT INTO weather (id, level, latitude, longitude, gameplay_condition, wind_direction, cloud_level, rain_level, wind_level, snow_level, fog_level, special_effect_level, severity, warn_weather, updated) VALUES ';
            sqlUpdate += weatherSQL.join(',');
            sqlUpdate += `
            ON DUPLICATE KEY UPDATE
                level=VALUES(level),
                latitude=VALUES(latitude),
                longitude=VALUES(longitude),
                gameplay_condition=VALUES(gameplay_condition),
                wind_direction=VALUES(wind_direction),
                cloud_level=VALUES(cloud_level),
                rain_level=VALUES(rain_level),
                wind_level=VALUES(wind_level),
                snow_level=VALUES(snow_level),
                fog_level=VALUES(fog_level),
                special_effect_level=VALUES(special_effect_level),
                severity=VALUES(severity),
                warn_weather=VALUES(warn_weather),
                updated=VALUES(updated)
            `;
            let result = await db.query(sqlUpdate);
            //console.log('[Weather] Result:', result.affectedRows);
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
                        let spawnpoint = new Spawnpoint(pokemon.spawnId, pokemon.lat, pokemon.lon, null, ts);
                        await spawnpoint.save(false);
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