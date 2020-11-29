'use strict';

const { DataTypes, Model, Transaction, UniqueConstraintError } = require('sequelize');
const sequelize = require('../services/sequelize.js');

const Cell = require('./cell.js');
const Pokestop = require('./pokestop.js');
const Spawnpoint = require('./spawnpoint.js');
const RedisClient = require('../services/redis.js');
const WebhookController = require('../services/webhook.js');
const ipcWorker = require('../ipc/worker.js');
const config = require('../services/config.js');

/**
 * Pokemon model class.
 */
class Pokemon extends Model {
    static DittoPokemonId = 132;
    static WeatherBoostMinLevel = 6;
    static WeatherBoostMinIvStat = 4;
    static PokemonTimeUnseen = config.dataparser.pokemonTimeUnseen * 60;
    static PokemonTimeReseen = config.dataparser.pokemonTimeReseen * 60;

    /**
     * Find or create a new Pokemon from the database.
     * @param encounterId
     * @param transaction If supplied, the corresponding row will be locked by the current transaction.
     * @returns {Promise<Pokemon>}
     */
    static async getOrCreate(encounterId, transaction = null) {
        const existing = await Pokemon.findByPk(encounterId, transaction === null ? {} : {
            transaction,
            lock: transaction.LOCK,
        });
        if (existing !== null) {
            return existing;
        }
        return Pokemon.build({ id: encounterId });
    }

    _setPokemonDisplay(pokemonId, display, username) {
        if (!this.isNewRecord && (!this.isDitto || this.displayPokemonId !== pokemonId) &&
            (this.pokemonId !== pokemonId || this.gender !== display.gender ||
            this.form !== display.form || this.costume !== display.costume)) {
            if (this.username === username) {   // spawn change confirmed
                console.info('[Pokemon] Spawn', this.id, 'changed confirmed from', this.pokemonId, 'to', pokemonId);
                this.isDitto = false;
                this.displayPokemonId = null;
            } else {
                console.warn('[Pokemon] Spawn', this.id, 'changed from Pokemon', this.pokemonId, 'by', this.username,
                    'to', pokemonId, 'by', username, '- unhandled');
                // TODO: handle A/B spawn?
            }
        }
        if (this.isNewRecord || !this.isDitto) {
            this.pokemonId = pokemonId;
        }
        if (display !== null) {
            if (this.isNewRecord || !this.isDitto) {
                this.gender = display.gender;
                this.form = display.form;
                this.costume = display.costume;
            }
            if (!this.isNewRecord && (this.weather === null) !== (display.weather_boosted_condition === null)) {
                console.debug('[Pokemon] Spawn', this.id, 'weather changed from', this.weather, 'by', this.username,
                    'to', display.weather_boosted_condition, 'by', username, '- clearing IVs');
                this.atkIv = null;
                this.defIv = null;
                this.staIv = null;
                this.cp = null;
                this.weight = null;
                this.size = null;
                this.move1 = null;
                this.move2 = null;
                this.level = null;
                this.capture1 = null;
                this.capture2 = null;
                this.capture3 = null;
                this.pvpRankingsGreatLeague = null;
                this.pvpRankingsUltraLeague = null;
            }
            this.weather = display.weather_boosted_condition;
        } else {
            console.warn('[Pokemon] Missing display');
            this.gender = null;
            this.form = null;
            this.costume = null;
        }
    }

    async _addWildPokemon(wild, username) {
        //console.log('Wild Pokemon Data:', wild.pokemon_data);
        console.assert(this.id === wild.encounter_id.toString(), 'unmatched encounterId');
        this._setPokemonDisplay(wild.pokemon_data.pokemon_id, wild.pokemon_data.pokemon_display, username);
        this.lat = wild.latitude;
        this.lon = wild.longitude;
        if (this.lat === null || this.lon === null) {
            console.warn('[Pokemon] Wild Pokemon null lat/lon!');
        }
        const oldSpawnId = this.spawnId;
        if (!wild.spawn_point_id) {
            console.warn('Interesting pokemon', wild);
        }
        this.spawnId = parseInt(wild.spawn_point_id, 16);
        this.username = username;
        if (this.isNewRecord) {
            this.changedTimestamp = this.firstSeenTimestamp = this.updated;
            this.expireTimestampVerified = false;
        }
        if (wild.time_till_hidden_ms > 0 && wild.time_till_hidden_ms <= 90000) {
            this.expireTimestamp = Math.round(this.updated + wild.time_till_hidden_ms / 1000);
            this.expireTimestampVerified = true;
            await Spawnpoint.upsertFromPokemon(this);
            return;
        }
        if (this.spawnId === oldSpawnId) {
            return;
        }
        try {
            const spawnpoint = await Spawnpoint.findByPk(this.spawnId);
            if (spawnpoint === null) {
                await Spawnpoint.upsertFromPokemon(this);
            } else if (spawnpoint.despawnSecond !== null) {
                this.expireTimestamp = this.getDespawnTimer(spawnpoint);
                this.expireTimestampVerified = true;
            }
        } catch (err) {
            console.warn('[Pokemon] Spawnpoint update error:', err.stack);
        }
    }

    _ensureExpireTimestamp() {
        // First time seeing pokemon, check if expire timestamp set
        if (!this.expireTimestamp) {
            this.expireTimestamp = this.firstSeenTimestamp + Pokemon.PokemonTimeUnseen;
        } else if (!this.expireTimestampVerified) {
            this.expireTimestamp = Math.max(this.expireTimestamp, this.updated + Pokemon.PokemonTimeReseen);
        }
    }

    static async _attemptUpdate(id, work) {
        let retry = 5, pokemon, changed;
        for (;;) {
            const transaction = await sequelize.transaction({
                // prevents MySQL from setting gap locks or next-key locks which leads to deadlocks
                // the lower transaction level (compared to REPEATABLE_READ) is ok since we do not perform range queries
                isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
            });
            try {
                pokemon = await Pokemon.getOrCreate(id, transaction);
                if (await work.call(pokemon, transaction) === true) {
                    await transaction.commit();
                    return pokemon;
                }
                pokemon._ensureExpireTimestamp();
                changed = pokemon.changed();
                await pokemon.save({ transaction });
                await transaction.commit();
                break;
            } catch (error) {
                if (!transaction.finished) await transaction.rollback();
                if (retry-- <= 0) {
                    throw error;
                }
                // UniqueConstraintError is expected when two workers attempt to insert the same row at the same time
                // In this case, one worker will succeed and the other worker will retry the transaction and
                // succeed updating the row in the second attempt as expected.
                if (!(error instanceof UniqueConstraintError)) {
                    console.warn('[Pokemon] Encountered error, retrying transaction', transaction.id,
                        retry, 'attempts left:', error.stack);
                }
            }
        }
        if (changed) {
            if (['pokemonId', 'gender', 'form', 'weather', 'costume'].some(x => changed.includes(x))) {
                WebhookController.instance.addPokemonEvent(pokemon.toJson());
                await RedisClient.publish('pokemon_add_queue', JSON.stringify(pokemon));
                if (pokemon.atkIv !== null) {
                    await RedisClient.publish('pokemon_got_iv', JSON.stringify(pokemon));
                }
            } else if (['level', 'atkIv', 'defIv', 'staIv'].some(x => changed.includes(x))) {
                WebhookController.instance.addPokemonEvent(pokemon.toJson());
                await RedisClient.publish('pokemon_got_iv', JSON.stringify(pokemon));
            }
        }
        return pokemon;
    }

    /**
     * Get pokemon by pokemon encounter id.
     * @param encounterId
     * @deprecated Use findByPk.
     */
    static getById(encounterId) {
        return Pokemon.findByPk(encounterId);
    }

    /**
     * Update Pokemon object from WildPokemon.
     */
    static updateFromWild(username, timestampMs, cellId, wild) {
        return Pokemon._attemptUpdate(wild.encounter_id.toString(), async function () {
            this.updated = Math.round(timestampMs / 1000);
            this.cellId = cellId.toString();
            await this._addWildPokemon(wild, username);
        });
    }

    /**
     * Initialize new Pokemon object from NearbyPokemon.
     */
    static updateFromNearby(username, timestampMs, cellId, nearby) {
        const encounterId = nearby.encounter_id.toString();
        return Pokemon._attemptUpdate(encounterId, async function () {
            this.updated = Math.round(timestampMs / 1000);
            console.assert(this.id === encounterId, 'unmatched encounterId');
            this._setPokemonDisplay(nearby.pokemon_id, nearby.pokemon_display, username);
            this.username = username;
            this.cellId = cellId.toString();
            const locatePokestop = async () => {
                let pokestop = null;
                try {
                    pokestop = await Pokestop.findByPk(nearby.fort_id);
                } catch (err) {
                    console.error('[Pokemon] InitNearby Error:', err);
                }
                return pokestop;
            };
            if (this.isNewRecord) {
                this.changedTimestamp = this.firstSeenTimestamp = this.updated;
                this.expireTimestampVerified = false;
                if (nearby.fort_id === '') {    // found a super wild Pokemon, why are you here?
                    return true;
                }
                const pokestop = await locatePokestop();
                if (pokestop === null) {
                    console.warn('[Pokemon] Unable to locate its nearby Pokestop', nearby.fort_id);
                    return true;
                }
                this.lat = pokestop.lat;
                this.lon = pokestop.lon;
            } else if (this.spawnId !== null || nearby.fort_id === '') {
                return;
            } else if (this.pokestopId !== nearby.fort_id) {
                const pokestop = await locatePokestop();
                if (pokestop === null) {
                    console.info('[Pokemon] Unable to locate its nearby Pokestop', nearby.fort_id);
                    return;
                }
                // TODO: remember previously found Pokestop too to prevent overcounting
                this.lat = (this.lat + pokestop.lat) / 2;
                this.lon = (this.lon + pokestop.lon) / 2;
            }
            this.pokestopId = nearby.fort_id;
        });
    }

    /**
     * Add Pokemon encounter proto data.
     * @param encounter 
     * @param username 
     */
    static updateFromEncounter(encounter, username) {
        return Pokemon._attemptUpdate(encounter.wild_pokemon.encounter_id.toString(), async function () {
            this.changedTimestamp = this.updated = new Date().getTime() / 1000;
            this._addWildPokemon(encounter.wild_pokemon, username);
            this.cp = encounter.wild_pokemon.pokemon_data.cp;
            this.move1 = encounter.wild_pokemon.pokemon_data.move_1;
            this.move2 = encounter.wild_pokemon.pokemon_data.move_2;
            this.size = encounter.wild_pokemon.pokemon_data.height_m;
            this.weight = encounter.wild_pokemon.pokemon_data.weight_kg;
            this.atkIv = encounter.wild_pokemon.pokemon_data.individual_attack;
            this.defIv = encounter.wild_pokemon.pokemon_data.individual_defense;
            this.staIv = encounter.wild_pokemon.pokemon_data.individual_stamina;
            this.shiny = encounter.wild_pokemon.pokemon_data.pokemon_display.shiny;
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
            this.isDitto = this.isDittoDisguised();
            if (this.isDitto) {
                console.log('[POKEMON] Pokemon', this.id, 'Ditto found, disguised as', this.pokemonId);
                this.setDittoAttributes(this.pokemonId);
            }

            const pvp = await ipcWorker.queryPvPRank(this.pokemonId, this.form, this.costume, this.atkIv, this.defIv, this.staIv, this.level, this.gender);
            this.pvpRankingsGreatLeague = pvp.great || null;
            this.pvpRankingsUltraLeague = pvp.ultra || null;
        });
    }

    /**
     * Set default Ditto attributes.
     * @param displayPokemonId 
     */
    setDittoAttributes(displayPokemonId) {
        this.displayPokemonId = displayPokemonId;
        this.pokemonId = Pokemon.DittoPokemonId;
        this.form = 0;
        this.gender = 3;
        this.costume = 0;
    }

    /**
     * Check if Pokemon is Ditto disguised.
     */
    isDittoDisguised() {
        let isUnderLevelBoosted = this.level > 0 && this.level < Pokemon.WeatherBoostMinLevel;
        let isUnderIvStatBoosted = this.level > 0 && (this.atkIv < Pokemon.WeatherBoostMinIvStat ||
            this.defIv < Pokemon.WeatherBoostMinIvStat ||
            this.staIv < Pokemon.WeatherBoostMinIvStat);
        let isWeatherBoosted = this.weather > 0;
        return (isWeatherBoosted ? isUnderLevelBoosted || isUnderIvStatBoosted : this.level > 30);
    }

    /**
     * Calculate despawn timer of spawnpoint
     * @param spawnpoint 
     */
    getDespawnTimer(spawnpoint) {
        let despawnSecond = spawnpoint.despawnSecond;
        if (despawnSecond) {
            let currentDate = new Date(this.updated);
            let ts = Math.floor(this.updated);
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
     * Get Pokemon object as JSON object with correct property keys for webhook payload
     */
    toJson() {
        return {
            type: 'pokemon',
            message: {
                spawnpoint_id: this.spawnId !== null ? this.spawnId.toString(16) : 'None',
                pokestop_id: this.pokestopId === null ? 'None' : this.pokestopId,
                encounter_id: this.id,
                pokemon_id: this.pokemonId,
                latitude: this.lat,
                longitude: this.lon,
                disappear_time: this.expireTimestamp === null ? 0 : this.expireTimestamp,
                disappear_time_verified: this.expireTimestampVerified,
                first_seen: this.firstSeenTimestamp,
                last_modified_time: this.updated === null ? 0 : this.updated,
                gender: this.gender,
                cp: this.cp,
                form: this.form,
                costume: this.costume,
                individual_attack: this.atkIv,
                individual_defense: this.defIv,
                individual_stamina: this.staIv,
                pokemon_level: this.level,
                move_1: this.move1,
                move_2: this.move2,
                weight: this.weight,
                height: this.size,
                weather: this.weather,
                shiny: this.shiny,
                username: this.username,
                display_pokemon_id: this.displayPokemonId,
                capture_1: this.capture1,
                capture_2: this.capture2,
                capture_3: this.capture3,
                pvp_rankings_great_league: this.pvpRankingsGreatLeague,
                pvp_rankings_ultra_league: this.pvpRankingsUltraLeague,
            }
        }
    }
}
Pokemon.init({
    id: {
        type: DataTypes.STRING(25),
        primaryKey: true,
        allowNull: false,
    },
    pokestopId: {
        type: DataTypes.STRING(35),
        defaultValue: null,
    },
    spawnId: {
        type: DataTypes.BIGINT(15).UNSIGNED,
        defaultValue: null,
    },
    lat: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
    },
    lon: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
    },
    weight: {
        type: DataTypes.DOUBLE(18, 14),
        defaultValue: null,
    },
    size: {
        type: DataTypes.DOUBLE(18, 14),
        defaultValue: null,
    },
    expireTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    updated: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    pokemonId: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        allowNull: false,
    },
    move1: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
        field: 'move_1',
    },
    move2: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
        field: 'move_2',
    },
    gender: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    cp: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
    },
    atkIv: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    defIv: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    staIv: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    form: {
        type: DataTypes.SMALLINT(5).UNSIGNED,
        defaultValue: null,
    },
    level: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    weather: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    costume: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    firstSeenTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: false,
    },
    /**
     * In contrast to updated, this field denotes when an Encounter was recorded.
     * It is set to firstSeenTimestamp for not having encountered it yet for legacy behavior from RDM.
     */
    changedTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: 'changed',
    },
    cellId: {
        type: DataTypes.BIGINT(20).UNSIGNED,
        defaultValue: null,
    },
    expireTimestampVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    shiny: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    username: {
        type: DataTypes.STRING(15),
        defaultValue: null,
    },
    isDitto: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: 0,
    },
    displayPokemonId: {
        type: DataTypes.SMALLINT(5).UNSIGNED,
        defaultValue: null,
    },
    capture1: {
        type: DataTypes.DOUBLE(18, 14),
        defaultValue: null,
        field: 'capture_1',
    },
    capture2: {
        type: DataTypes.DOUBLE(18, 14),
        defaultValue: null,
        field: 'capture_2',
    },
    capture3: {
        type: DataTypes.DOUBLE(18, 14),
        defaultValue: null,
        field: 'capture_3',
    },
    pvpRankingsGreatLeague: {
        type: DataTypes.JSONTEXT,
        defaultValue: null,
    },
    pvpRankingsUltraLeague: {
        type: DataTypes.JSONTEXT,
        defaultValue: null,
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'ix_coords',
            fields: ['lat', 'lon'],
        },
        {
            name: 'ix_pokemon_id',
            fields: ['pokemonId'],
        },
        {
            name: 'ix_updated',
            fields: ['updated'],
        },
        {
            name: 'fk_spawn_id',    // TODO: ix
            fields: ['spawnId'],
        },
        {
            name: 'fk_pokestop_id', // TODO: ix
            fields: ['pokestopId'],
        },
        {
            name: 'ix_atk_iv',
            fields: ['atkIv'],
        },
        {
            name: 'ix_def_iv',
            fields: ['defIv'],
        },
        {
            name: 'ix_sta_iv',
            fields: ['staIv'],
        },
        {
            name: 'ix_changed',
            fields: ['changedTimestamp'],
        },
        {
            name: 'ix_level',
            fields: ['level'],
        },
        {
            name: 'fk_pokemon_cell_id', // TODO: ix
            fields: ['cellId'],
        },
        {
            name: 'ix_expire_timestamp',
            fields: ['expireTimestamp'],
        },
        {
            name: 'ix_iv',
            fields: ['iv'],
        },
    ],
    tableName: 'pokemon',
});
Cell.Pokemon = Cell.hasMany(Pokemon, { foreignKey: 'cellId' });
Pokemon.Cell = Pokemon.belongsTo(Cell, { foreignKey: 'cellId' });
Pokestop.Pokemon = Pokestop.hasMany(Pokemon, { foreignKey: 'pokestopId' });
Pokemon.Pokestop = Pokemon.belongsTo(Pokestop, { foreignKey: 'pokestopId' });
Spawnpoint.Pokemon = Spawnpoint.hasMany(Pokemon, { foreignKey: 'spawnId' });
Pokemon.Spawnpoint = Pokemon.belongsTo(Spawnpoint, { foreignKey: 'spawnId' });

module.exports = Pokemon;
