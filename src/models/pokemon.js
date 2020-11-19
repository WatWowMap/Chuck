'use strict';

const config = require('../config.json');
const Cell = require('./cell.js');
const Pokestop = require('./pokestop.js');
const Spawnpoint = require('./spawnpoint.js');
const MySQLConnector = require('../services/mysql.js');
//const { PvPStatsManager, IV, League } = require('../services/pvp.js');
const pvp = require('../services/pvp.js');
const RedisClient = require('../services/redis.js');
const WebhookController = require('../services/webhook.js');
const db = new MySQLConnector(config.db);

/**
 * Pokemon model class.
 */
class Pokemon {
    static DittoPokemonId = 132;
    static WeatherBoostMinLevel = 6;
    static WeatherBoostMinIvStat = 4;
    static PokemonTimeUnseen = 1200;
    static PokemonTimeReseen = 600;
    static DittoDisguises = [46,163,165,167,187,223,293,316,322,399,590];
    static DittoMove1Transform = 242;
    static DittoMove2Struggle = 133;

    /**
     * Initialize new Pokemon object.
     * @param data 
     */
    constructor(data) {
        if (data.wild) {
            this.initWild(data);
        } else if (data.nearby) {
            this.initNearby(data);
        } else {
            this.id = data.id;
            this.lat = data.lat;
            this.lon = data.lon;
            this.pokemonId = data.pokemon_id;
            this.form = data.form;
            this.level = data.level;
            this.costume = data.costume;
            this.weather = data.weather;
            this.gender = data.gender;
            this.spawnId = data.spawn_id;
            this.cellId = data.cell_id;
            this.firstSeenTimestamp = data.first_seen_timestamp || new Date().getTime() / 1000;
            this.expireTimestamp = data.expire_timestamp;
            this.expireTimestampVerified = data.expire_timestamp_verified;
            this.cp = data.cp;
            this.move1 = data.move_1;
            this.move2 = data.move_2;
            this.size = data.size;
            this.weight = data.weight;
            this.atkIv = data.atk_iv;
            this.defIv = data.def_iv;
            this.staIv = data.sta_iv;
            this.username = data.username;
            this.shiny = data.shiny;
            this.updated = data.updated;
            this.changed = data.changed;
            this.pokestopId = data.pokestop_id;
            this.displayPokemonId = data.display_pokemon_id;
            this.capture1 = data.capture_1;
            this.capture2 = data.capture_2;
            this.capture3 = data.capture_3;
            this.pvpRankingsGreatLeague = null; 
            this.pvpRankingsUltraLeague = null;
        }
        if (!this.firstSeenTimestamp) {
            this.firstSeenTimestamp = new Date().getTime() / 1000;
        }
    }

    /**
     * Initialize new Pokemon object from WildPokemon.
     * @param data 
     */
    async initWild(data) {
        this.id = BigInt(data.wild.encounter_id).toString();
        let timestampMs = new Date().getTime();
        //console.log('Wild Pokemon Data:', data.wild.pokemon_data);
        this.pokemonId = data.wild.pokemon_data.pokemon_id;
        if (data.wild.latitude === undefined || data.wild.latitude === null) {
            console.debug('[Pokemon] Wild Pokemon null lat/lon!');
        }
        this.lat = data.wild.latitude;
        this.lon = data.wild.longitude;
        this.spawnId = BigInt(parseInt(data.wild.spawn_point_id, 16)).toString();
        this.gender = data.wild.pokemon_data.pokemon_display.gender;
        this.form = data.wild.pokemon_data.pokemon_display.form;
        if (data.wild.pokemon_data.pokemon_display) {
            this.costume = data.wild.pokemon_data.pokemon_display.costume;
            this.weather = data.wild.pokemon_data.pokemon_display.weather_boosted_condition;
        }
        this.username = data.wild.username;
        if (data.wild.time_till_hidden_ms > 0 && data.wild.time_till_hidden_ms <= 90000) {
            this.expireTimestamp = Math.round((data.timestampMs + data.wild.time_till_hidden_ms) / 1000);
            this.expireTimestampVerified = true;
        } else {
            this.expireTimestampVerified = false;
        }
        if (!this.expireTimestampVerified && this.spawnId) {
            // Spawnpoint not verified, check if we have the tth.
            let spawnpoint;
            try {
                spawnpoint = await Spawnpoint.getById(this.spawnId);
            } catch (err) {
                spawnpoint = null;
            }
            if (spawnpoint instanceof Spawnpoint && spawnpoint.despawnSecond) {
                let expireTimestamp = this.getDespawnTimer(spawnpoint);
                if (expireTimestamp > 0) {
                    this.expireTimestamp = expireTimestamp;
                    this.expireTimestampVerified = true;
                }
            } else {
                spawnpoint = new Spawnpoint(this.spawnId, this.lat, this.lon, null, Math.round(data.timestampMs / 1000));
                await spawnpoint.save(false);
                this.expireTimestamp = null;
            }
        }
        if (data.wild.cell === undefined || data.wild.cell === null) {
            this.cellId = Cell.getCellIdFromLatLon(this.lat, this.lon);
        } else {
            this.cellId = BigInt(data.wild.cell).toString();
        }
        if (data.wild.pokemon_data) {
            this.atkIv = data.wild.pokemon_data.individual_attack;
            this.defIv = data.wild.pokemon_data.individual_defense;
            this.staIv = data.wild.pokemon_data.individual_stamina;
            this.move1 = data.wild.pokemon_data.move_1;
            this.move2 = data.wild.pokemon_data.move_2;
            this.cp = data.wild.pokemon_data.cp;
            let cpMultiplier = data.wild.pokemon_data.cp_multiplier;
            let level;
            if (cpMultiplier < 0.734) {
                level = Math.round(58.35178527 * cpMultiplier * cpMultiplier - 2.838007664 * cpMultiplier + 0.8539209906);
            } else {
                level = Math.round(171.0112688 * cpMultiplier - 95.20425243);
            }
            this.level = level;
            this.capture1 = null;
            this.capture2 = null;
            this.capture3 = null;
        } else {
            this.atkIv = null;
            this.defIv = null;
            this.staIv = null;
            this.move1 = null;
            this.move2 = null;
            this.cp = null;
            this.level = null;
            this.capture1 = null;
            this.capture2 = null;
            this.capture3 = null;
        }
        this.changed = Math.round(timestampMs / 1000);
    }

    /**
     * Initialize new Pokemon object from NearbyPokemon.
     * @param data 
     */
    async initNearby(data) {
        this.id = BigInt(data.nearby.encounter_id).toString();
        this.pokemonId = data.nearby.pokemon_id;
        this.pokestopId = data.nearby.fort_id;
        this.gender = data.nearby.pokemon_display.gender;
        this.form = data.nearby.pokemon_display.form;
        if (data.nearby.pokemon_display) {
            this.costume = data.nearby.pokemon_display.costume;
            this.weather = data.nearby.pokemon_display.weather_boosted_condition;
        }
        this.username = data.username || null;
        let pokestop;
        try {
            pokestop = await Pokestop.getById(data.nearby.fort_id);
        } catch (err) {
            pokestop = null;
            console.error('[Pokemon] InitNearby Error:', err);
        }
        if (pokestop) {
            this.pokestopId = pokestop.id;
            this.lat = pokestop.lat;
            this.lon = pokestop.lon;
        }
        this.cellId = BigInt(data.cellId).toString();
        this.expireTimestampVerified = false;
    }

    /**
     * Get pokemon by pokemon encounter id.
     * @param encounterId 
     */
    static async getById(encounterId) {
        let sql = `
            SELECT
                id, pokemon_id, lat, lon, spawn_id, expire_timestamp, atk_iv, def_iv, sta_iv,
                move_1, move_2, gender, form, cp, level, weather, costume, weight, size,
                display_pokemon_id, pokestop_id, updated, first_seen_timestamp, changed, cell_id,
                expire_timestamp_verified, shiny, username, capture_1, capture_2, capture_3,
                pvp_rankings_great_league, pvp_rankings_ultra_league
            FROM pokemon
            WHERE id = ?
            LIMIT 1
        `;
        let args = [encounterId.toString()];
        let results = await db.query(sql, args)
            .then(x => x)
            .catch(err => {
                console.error('[Pokemon] Error:', err);
                return null;
            });
        for (let i = 0; i < results.length; i++) {
            let result = results[i];
            return new Pokemon(result);
        }
        return null;
    }

    /**
     * Add Pokemon encounter proto data.
     * @param encounter 
     * @param username 
     */
    async addEncounter(encounter, username) {
        this.pokemonId = encounter.wild_pokemon.pokemon_data.pokemon_id;
        this.cp = encounter.wild_pokemon.pokemon_data.cp;
        this.move1 = encounter.wild_pokemon.pokemon_data.move_1;
        this.move2 = encounter.wild_pokemon.pokemon_data.move_2;
        this.size = encounter.wild_pokemon.pokemon_data.height_m;
        this.weight = encounter.wild_pokemon.pokemon_data.weight_kg;
        this.atkIv = encounter.wild_pokemon.pokemon_data.individual_attack;
        this.defIv = encounter.wild_pokemon.pokemon_data.individual_defense;
        this.staIv = encounter.wild_pokemon.pokemon_data.individual_stamina;
        this.costume = encounter.wild_pokemon.pokemon_data.pokemon_display.costume;
        this.shiny = encounter.wild_pokemon.pokemon_data.pokemon_display.shiny;
        this.username = username;
        this.form = encounter.wild_pokemon.pokemon_data.pokemon_display.form;
        this.gender = encounter.wild_pokemon.pokemon_data.pokemon_display.gender;
        if (encounter.capture_probability) {
            this.capture1 = parseFloat(encounter.capture_probability.capture_probability[0]);
            this.capture2 = parseFloat(encounter.capture_probability.capture_probability[1]);
            this.capture3 = parseFloat(encounter.capture_probability.capture_probability[2]);
        }
        let cpMultiplier = encounter.wild_pokemon.pokemon_data.cp_multiplier;
        let level;
        if (cpMultiplier < 0.734) {
            level = Math.round(58.35178527 * cpMultiplier * cpMultiplier - 2.838007664 * cpMultiplier + 0.8539209906);
        } else {
            level = Math.round(171.0112688 * cpMultiplier - 95.20425243);
        }
        this.level = level;
        this.isDitto = Pokemon.isDittoDisguised(this.pokemonId,
                                                this.level || 0,
                                                this.weather || 0,
                                                this.atkIv || 0,
                                                this.defIv || 0,
                                                this.staIv || 0
        );
        if (this.isDitto) {
            console.log('[POKEMON] Pokemon', this.id, 'Ditto found, disguised as', this.pokemonId);
            this.setDittoAttributes(this.pokemonId);
        }

        if (!this.spawnId) {
            this.spawnId = parseInt(encounter.wild_pokemon.spawn_point_id, 16);
            this.lat = encounter.wild_pokemon.latitude;
            this.lon = encounter.wild_pokemon.longitude;

            if (!this.expireTimestampVerified && this.spawnId) {
                let spawnpoint;
                try {
                    spawnpoint = await Spawnpoint.getById(this.spawnId);
                } catch (err) {
                    spawnpoint = null;
                }
                if (spawnpoint instanceof Spawnpoint) {
                    let expireTimestamp = this.getDespawnTimer(spawnpoint);
                    if (expireTimestamp > 0) {
                        this.expireTimestamp = expireTimestamp;
                        this.expireTimestampVerified = true;
                    }
                } else {
                    spawnpoint = new Spawnpoint(this.spawnId, this.lat, this.lon, null, new Date().getTime() / 1000);
                    await spawnpoint.save(true);
                }
            }
        }

        /*
        let pvpGreat = PvPStatsManager.instance.getPVPStatsWithEvolutions(
            encounter.wild_pokemon.pokemon_data.pokemon_id,
            this.form ? this.form : null,
            encounter.wild_pokemon.pokemon_data.pokemon_display.costume,
            new IV(parseInt(this.atkIv), parseInt(this.defIv), parseInt(this.staIv)),
            parseFloat(this.level),
            League.Great
        );
        */
        let pvpGreat = await pvp.calculatePossibleCPs(this.pokemonId, this.form, this.atkIv, this.defIv, this.staIv, this.level, null, 'great');
        if (pvpGreat && pvpGreat.length > 0) {
            this.pvpRankingsGreatLeague = pvpGreat.map(ranking => {
                return {
                    "pokemon": ranking.pokemon_id,
                    "form": ranking.form_id || 0,
                    "rank": ranking.rank,
                    "percentage": ranking.percent,
                    "cp": ranking.cp,
                    "level": ranking.level
                };
            });
        }

        /*
        let pvpUltra = PvPStatsManager.instance.getPVPStatsWithEvolutions(
            encounter.wild_pokemon.pokemon_data.pokemon_id,
            this.form ? this.form : null,
            encounter.wild_pokemon.pokemon_data.pokemon_display.costume,
            new IV(parseInt(this.atkIv), parseInt(this.defIv), parseInt(this.staIv)),
            parseFloat(this.level),
            League.Ultra
        );
        */
        let pvpUltra = await pvp.calculatePossibleCPs(this.pokemonId, this.form, this.atkIv, this.defIv, this.staIv, this.level, null, 'ultra');
        if (pvpUltra && pvpUltra.length > 0) {
            this.pvpRankingsUltraLeague = pvpUltra.map(ranking => {
                return {
                    "pokemon": ranking.pokemon_id,
                    "form": ranking.form_id || 0,
                    "rank": ranking.rank,
                    "percentage": ranking.percent,
                    "cp": ranking.cp,
                    "level": ranking.level
                };
            });
        }

        this.updated = new Date().getTime() / 1000;
        this.changed = this.updated;
    }

    /**
     * Set default Ditto attributes.
     * @param displayPokemonId 
     */
    setDittoAttributes(displayPokemonId) {
        this.displayPokemonId = displayPokemonId;
        this.pokemonId = Pokemon.DittoPokemonId;
        this.form = 0;
        this.move1 = Pokemon.DittoMove1Transform;
        this.move2 = Pokemon.DittoMove2Struggle;
        this.gender = 3;
        this.costume = 0;
        this.size = 0;
        this.weight = 0;
    }

    /**
     * Check if Pokemon is Ditto disguised.
     * @param pokemon 
     */
    static isDittoDisguisedFromPokemon(pokemon) {
        let isDisguised = (pokemon.pokemonId == Pokemon.DittoPokemonId) || (Pokemon.DittoDisguises.includes(pokemon.pokemonId) || false);
        let isUnderLevelBoosted = pokemon.level > 0 && pokemon.level < Pokemon.WeatherBoostMinLevel;
        let isUnderIvStatBoosted = pokemon.level > 0 && (pokemon.atkIv < Pokemon.WeatherBoostMinIvStat || pokemon.defIv < Pokemon.WeatherBoostMinIvStat || pokemon.staIv < Pokemon.WeatherBoostMinIvStat);
        let isWeatherBoosted = pokemon.weather > 0;
        return isDisguised && (isUnderLevelBoosted || isUnderIvStatBoosted) && isWeatherBoosted;
    }

    /**
     * Check if Pokemon is Ditto disguised.
     * @param pokemonId 
     * @param level 
     * @param weather 
     * @param atkIv 
     * @param defIv 
     * @param staIv 
     */
    static isDittoDisguised(pokemonId, level, weather, atkIv, defIv, staIv) {
        let isDisguised = (pokemonId == Pokemon.DittoPokemonId) || (Pokemon.DittoDisguises.includes(pokemonId) || false);
        let isUnderLevelBoosted = level > 0 && level < Pokemon.WeatherBoostMinLevel;
        let isUnderIvStatBoosted = level > 0 && (atkIv < Pokemon.WeatherBoostMinIvStat || defIv < Pokemon.WeatherBoostMinIvStat || staIv < Pokemon.WeatherBoostMinIvStat);
        let isWeatherBoosted = weather > 0;
        return isDisguised && (isUnderLevelBoosted || isUnderIvStatBoosted) && isWeatherBoosted;
    }

    /**
     * Calculate despawn timer of spawnpoint
     * @param spawnpoint 
     * @param timestampMs 
     */
    getDespawnTimer(spawnpoint, timestampMs) {
        let despawnSecond = spawnpoint.despawnSecond;
        if (despawnSecond) {
            let currentDate = new Date();
            let ts = Math.floor(currentDate / 1000);
            let minute = currentDate.getMinutes();
            let second = currentDate.getSeconds();
            let secondOfHour = second + minute * 60;

            let despawnOffset;
            if (despawnSecond < secondOfHour) {
                despawnOffset = 3600 + despawnSecond - secondOfHour;
            } else {
                despawnOffset = despawnSecond - secondOfHour;
            }
            let despawn = ts + despawnOffset;
            return despawn;
        }
    }

    /**
     * Update Pokemon values if changed from already found Pokemon
     */
    async update() {
        let updateIV = false;
        let now = new Date().getTime() / 1000;
        this.updated = now;
        let oldPokemon;
        try {
            oldPokemon = await Pokemon.getById(this.id);
        } catch (err) {
            oldPokemon = null;
        }
        // First time seeing pokemon
        if (!oldPokemon) {
            // Check if expire timestamp set
            if (!this.expireTimestamp) {
                this.expireTimestamp = now + Pokemon.PokemonTimeUnseen;
            }
            // Set first seen timestamp
            this.firstSeenTimestamp = this.updated;
        } else {
            // Pokemon was seen before, set first seen timestamp to original
            this.firstSeenTimestamp = oldPokemon.firstSeenTimestamp;
            // Check if expire timestamp set
            if (!this.expireTimestamp) {
                // Check if pokemon that doesn't havea a known despawn time was reseen, if so add time to expire timestamp
                let oldExpireDate = oldPokemon.expireTimestamp;
                if ((oldExpireDate - now) < Pokemon.PokemonTimeReseen) {
                    this.expireTimestamp = now + Pokemon.PokemonTimeReseen;
                } else {
                    this.expireTimestamp = oldPokemon.expireTimestamp;
                }
            }
            if (!this.expireTimestampVerified && oldPokemon.expireTimestampVerified) {
                this.expireTimestampVerified = oldPokemon.expireTimestampVerified;
                this.expireTimestamp = oldPokemon.expireTimestamp;
            }
            if (oldPokemon.pokemonId !== this.pokemonId) {
                if (oldPokemon.pokemonId !== Pokemon.DittoPokemonId) {
                    console.log('[POKEMON] Pokemon', this.id, 'changed from', oldPokemon.pokemonId, 'to', this.pokemonId);
                } else if (oldPokemon.displayPokemonId || 0 !== this.pokemonId) {
                    console.log('[POKEMON] Pokemon', this.id, 'Ditto diguised as', (oldPokemon.displayPokemonId || 0), 'now seen as', this.pokemonId);
                }
            }
            // Check if old pokemon cell_id is set and new pokemon cell_id is not
            if (oldPokemon.cellId && !this.cellId) {
                this.cellId = oldPokemon.cellId;
            }
            // Check if old pokemon spawn_id is set and new pokemon spawn_id is not
            if (oldPokemon.spawnId && !this.spawnId) {
                this.spawnId = oldPokemon.spawnId;
                this.lat = oldPokemon.lat;
                this.lon = oldPokemon.lon;
            }
            // Check if old pokemon pokestop_id is set and new pokemon pokestop_id is not
            if (oldPokemon.pokestopId && !this.pokestopId) {
                this.pokestopId = oldPokemon.pokestopId;
            }
            if (oldPokemon.pvpRankingsGreatLeague && !this.pvpRankingsGreatLeague) {
                this.pvpRankingsGreatLeague = oldPokemon.pvpRankingsGreatLeague;
            }
            if (oldPokemon.pvpRankingsUltraLeague && !this.pvpRankingsUltraLeague) {
                this.pvpRankingsUltraLeague = oldPokemon.pvpRankingsUltraLeague;
            }
            // Check if we need to update IV and old pokemon atk_id is not set and new pokemon atk_id is set
            if (updateIV && !oldPokemon.atkIv && this.atkIv) {
                WebhookController.instance.addPokemonEvent(this.toJson());
                await RedisClient.publish('pokemon_got_iv', JSON.stringify(this));
                this.changed = now;
            } else {
                this.changed = oldPokemon.changed || now;
            }

            // Check if old pokemon cell_id is set and new pokemon cell_id is not
            if (updateIV && oldPokemon.atkIv && !this.atkIv) {
                // Weather or spawn change
                if (
                    !((!oldPokemon.weather || oldPokemon.weather === 0) && (this.weather || 0 > 0) ||
                        (!this.weather || this.weather === 0) && (oldPokemon.weather || 0 > 0))
                ) {
                    this.atkIv = oldPokemon.atkIv;
                    this.defIv = oldPokemon.defIv;
                    this.staIv = oldPokemon.staIv;
                    this.cp = oldPokemon.cp;
                    this.weight = oldPokemon.weight;
                    this.size = oldPokemon.size;
                    this.move1 = oldPokemon.move1;
                    this.move2 = oldPokemon.move2;
                    this.level = oldPokemon.level;
                    this.shiny = oldPokemon.shiny;
                    this.isDitto = Pokemon.isDittoDisguisedFromPokemon(oldPokemon);
                    if (this.isDitto) {
                        console.log('[POKEMON] oldPokemon', this.id, 'Ditto found, disguised as', this.pokemonId);
                        this.setDittoAttributes(this.pokemonId);
                    }
                }
            }

            //let shouldWrite = Pokemon.shouldUpdate(oldPokemon, this);
            //if (!shouldWrite) {
            //    return;
            //}

            if (oldPokemon.pokemonId === Pokemon.DittoPokemonId && this.pokemonId !== Pokemon.DittoPokemonId) {
                console.log('[POKEMON] Pokemon', this.id, 'Ditto changed from', oldPokemon.pokemonId, 'to', this.pokemonId);
            }
        }

        // Known spawn_id, check for despawn time
        if (this.spawnId) {
            let spawnpoint;
            let secondOfHour = null;
            if (this.expireTimestampVerified && this.expireTimestamp) {
                let date = new Date(this.expireTimestamp * 1000);
                let minute = date.getMinutes();
                let second = date.getSeconds();
                secondOfHour = second + minute * 60;
            }
            spawnpoint = new Spawnpoint(
                this.spawnId,
                this.lat,
                this.lon,
                secondOfHour,
                this.updated
            );
            try {
                await spawnpoint.save(true);
            } catch (err) {
                console.error('[Spawnpoint] Error:', err);
            }
        }

        // First time seeing Pokemon, send webhook
        if (!oldPokemon) {
            WebhookController.instance.addPokemonEvent(this.toJson());
            await RedisClient.publish('pokemon_add_queue', JSON.stringify(this));
            if (this.atkIv) {
                await RedisClient.publish('pokemon_got_iv', JSON.stringify(this));
            }
        }
    }

    /**
     * Get Pokemon object as sql string
     */
    toSql() {
        return `
        (
            ${this.id},
            ${this.pokemonId},
            ${this.lat},
            ${this.lon},
            ${this.spawnId || null},
            ${this.expireTimestamp || null},
            ${this.atkIv || null},
            ${this.defIv || null},
            ${this.staIv || null},
            ${this.move1 || null},
            ${this.move2 || null},
            ${this.gender},
            ${this.form},
            ${this.cp || null},
            ${this.level || null},
            ${this.weather || 0},
            ${this.costume || 0},
            ${this.weight || null},
            ${this.size || null},
            ${this.displayPokemonId || null},
            ${this.pokestopId ? '"' + this.pokestopId + '"' : null},
            ${this.updated || null},
            ${this.firstSeenTimestamp || null},
            ${this.changed || null},
            ${this.cellId || null},
            ${this.expireTimestampVerified || 0},
            ${this.shiny || null},
            ${this.username ? '"' + this.username + '"' : null},
            ${this.capture1 || null},
            ${this.capture2 || null},
            ${this.capture3 || null},
            ${this.pvpRankingsGreatLeague ? "'" + JSON.stringify(this.pvpRankingsGreatLeague) + "'" : null},
            ${this.pvpRankingsUltraLeague ? "'" + JSON.stringify(this.pvpRankingsUltraLeague) + "'" : null}
        )
        `;
    }

    /**
     * Get Pokemon object as JSON object with correct property keys for webhook payload
     */
    toJson() {
        return {
            type: 'pokemon',
            message: {
                spawnpoint_id: this.spawnId ? this.spawnId.toString(16) : 'None',
                pokestop_id: this.pokestopId || 'None',
                encounter_id: this.id,
                pokemon_id: this.pokemonId,
                latitude: this.lat,
                longitude: this.lon,
                disappear_time: this.expireTimestamp || 0,
                disappear_time_verified: this.expireTimestampVerified || 0,
                first_seen: this.firstSeenTimestamp || 1,
                last_modified_time: this.updated || 1,
                gender: this.gender,
                cp: this.cp || null,
                form: this.form || 0,
                costume: this.costume || 0,
                individual_attack: this.atkIv || null,
                individual_defense: this.defIv || null,
                individual_stamina: this.staIv || null,
                pokemon_level: this.level || null,
                move_1: this.move1 || null,
                move_2: this.move2 || null,
                weight: this.weight || null,
                height: this.size || null,
                weather: this.weather || 0,
                shiny: this.shiny || null,
                username: this.username || null,
                display_pokemon_id: this.displayPokemonId || null,
                capture_1: this.capture1 || null,
                capture_2: this.capture2 || null,
                capture_3: this.capture3 || null,
                pvp_rankings_great_league: this.pvpRankingsGreatLeague || null,
                pvp_rankings_ultra_league: this.pvpRankingsUltraLeague || null,
            }
        }
    }
}

module.exports = Pokemon;
