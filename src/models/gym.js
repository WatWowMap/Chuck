'use strict';

const config = require('../config.json');
const MySQLConnector = require('../services/mysql.js');
const WebhookController = require('../services/webhook.js');
const db = new MySQLConnector(config.db);

const PokemonEvolution = {
    Unset: 0,
    Mega: 1,
    MegaX: 2,
    MegaY: 3
};

/**
 * Gym model class.
 */
class Gym {

    /**
     * Initialize new Gym object.
     * @param data 
     */
    constructor(data) {
        if (data.fort) {
            this.id = data.fort.id;
            this.lat = data.fort.latitude;
            this.lon = data.fort.longitude;
            this.name = null;
            this.enabled = data.fort.enabled;
            this.guardingPokemonId = data.fort.guard_pokemon_id;
            this.teamId = data.fort.owned_by_team;
            if (data.fort.gym_display) {
                this.availableSlots = data.fort.gym_display.slots_available; // TODO: No slots available?
            } else {
                this.availableSlots = 0;
            }
            this.lastModifiedTimestamp = data.fort.last_modified_timestamp_ms / 1000;
            this.exRaidEligible = data.fort.is_ex_raid_eligible;
            this.inBattle = data.fort.is_in_battle;
            if (data.fort.sponsor > 0) {
                this.sponsorId = data.fort.sponsor;
            } else {
                this.sponsorId = 0;
            }
            if (data.fort.image_url) {
                this.url = data.fort.image_url;
            } else {
                this.url = null;
            }
            this.totalCp = data.fort.owned_by_team ? data.fort.gym_display.total_gym_cp : 0;
            this.raidEndTimestamp = null;
            this.raidSpawnTimestamp = null;
            this.raidBattleTimestamp = null;
            this.raidLevel = null;
            this.raidIsExclusive = 0;
            this.raidPokemonId = 0;
            this.raidPokemonMove1 = 0;
            this.raidPokemonMove2 = 0;
            this.raidPokemonCp = 0;
            this.raidPokemonForm = 0;
            this.raidPokemonGender = 0;
            this.raidPokemonCostume = 0;
            this.raidPokemonEvolution = null;
            if (data.fort.raid_info) {
                this.raidEndTimestamp = data.fort.raid_info.raid_end_ms / 1000;
                this.raidSpawnTimestamp = data.fort.raid_info.raid_spawn_ms / 1000;
                this.raidBattleTimestamp = data.fort.raid_info.raid_battle_ms / 1000;
                this.raidLevel = data.fort.raid_info.raid_level;
                this.raidIsExclusive = data.fort.raid_info.is_exclusive;
                if (data.fort.raid_info.raid_pokemon) {
                    this.raidPokemonId = data.fort.raid_info.raid_pokemon.pokemon_id;
                    this.raidPokemonMove1 = data.fort.raid_info.raid_pokemon.move_1;
                    this.raidPokemonMove2 = data.fort.raid_info.raid_pokemon.move_2;
                    this.raidPokemonCp = data.fort.raid_info.raid_pokemon.cp;
                    this.raidPokemonForm = data.fort.raid_info.raid_pokemon.pokemon_display.form;
                    this.raidPokemonGender = data.fort.raid_info.raid_pokemon.pokemon_display.gender;
                    if (data.fort.raid_info.raid_pokemon.pokemon_display.pokemon_evolution) {
                        this.raidPokemonEvolution = data.fort.raid_info.raid_pokemon.pokemon_display.pokemon_evolution;
                    }
                }
            }
            let ts = new Date().getTime() / 1000;
            this.cellId = data.cellId;
            this.deleted = false;
            this.firstSeenTimestamp = ts;
            this.updated = ts;
        } else {
            this.id = data.id;
            this.lat = data.lat;
            this.lon = data.lon;
            this.name = data.name || null;
            this.url = data.url || null;
            this.guardingPokemonId = data.guarding_pokemon_id || 0;
            this.enabled = data.enabled || 0;
            this.lastModifiedTimestamp = data.last_modified_timestamp || null;
            this.teamId = data.team_id || 0;
            this.raidEndTimestamp = data.raid_end_timestamp || null;
            this.raidSpawnTimestamp = data.raid_spawn_timestamp || null;
            this.raidBattleTimestamp = data.raid_battle_timestamp || null;
            this.raidPokemonId = data.raid_pokemon_id || null;
            this.raidLevel = data.raid_level || null;
            this.availableSlots = data.available_slots || 0;
            this.updated = data.updated;
            this.exRaidEligible = data.ex_raid_eligible || 0;
            this.inBattle = data.in_battle || 0;
            this.raidPokemonMove1 = data.raid_pokemon_move_1 || null;
            this.raidPokemonMove2 = data.raid_pokemon_move_2 || null;
            this.raidPokemonForm = data.raid_pokemon_form || null;
            this.raidPokemonCp = data.raidPokemon_cp || null;
            this.raidPokemonGender = data.raid_pokemon_gender || null;
            this.raidPokemonEvolution = data.raid_pokemon_evolution || null;
            this.raidIsExclusive = data.raid_is_exclusive || null;
            this.cellId = data.cell_id;
            this.totalCp = data.total_cp || 0;
            this.deleted = data.deleted || 0;
            this.firstSeenTimestamp = data.first_seen_timestamp;
            this.sponsorId = data.sponsor_id || null;
            this.raidPokemonEvolution = data.raid_pokemon_evolution || null;
        }
    }

    /**
     * Get Gym by unique id
     * @param {*} id 
     * @param {*} withDeleted 
     */
    async getById(id, withDeleted = true) {
        const withDeletedSQL = withDeleted ? '' : 'AND deleted = false';
        const sql = `
            SELECT id, lat, lon, name, url, guarding_pokemon_id, last_modified_timestamp, team_id, raid_end_timestamp,
                   raid_spawn_timestamp, raid_battle_timestamp, raid_pokemon_id, enabled, availble_slots, updated,
                   raid_level, ex_raid_eligible, in_battle, raid_pokemon_move_1, raid_pokemon_move_2, raid_pokemon_form,
                   raid_pokemon_costume, raid_pokemon_cp, raid_pokemon_gender, raid_is_exclusive, cell_id, total_cp,
                   sponsor_id, raid_pokemon_evolution
            FROM gym
            WHERE id = ? ${withDeletedSQL}
        `;
        const args = [id];
        let results = await db.query(sql, args);
        if (results && results > 0) {
            const result = results[0];
            return new Gym(result);
        }
        return null;
    }

    /**
     * Update Gym values if changed from already found Gym
     */
    async update() {
        let ts = new Date().getTime() / 1000;
        let oldGym;
        try {
            oldGym = await this.getById(this.id, true);
        } catch (err) {
            oldGym = null;
        }
        
        if (this.raidIsExclusive && this.exRaidBossId) {
            this.raidPokemonId = this.exRaidBossId;
            this.raidPokemonForm = this.exRaidBossForm || 0;
        }
        
        this.updated = ts;
        
        if (!oldGym) {
            WebhookController.instance.addGymEvent(this.toJson('gym'));
            WebhookController.instance.addGymInfoEvent(this.toJson('gym-info'));
            let raidBattleTime = new Date((this.raidBattleTimestamp || 0) * 1000);
            let raidEndTime = Date((this.raidEndTimestamp || 0) * 1000);
            let now = new Date().getTime() / 1000;            
            
            if (raidBattleTime > now && this.raidLevel || 0 > 0) {
                WebhookController.instance.addEggEvent(this.toJson('egg'));
            } else if (raidEndTime > now && this.raidPokemonId || 0 > 0) {
                WebhookController.instance.addRaidEvent(this.toJson('raid'));
            }
        } else {
            if (oldGym.cellId && !this.cellId) {
                this.cellId = oldGym.cellId;
            }
            if (oldGym.name && !this.name) {
                this.name = oldGym.name;
            }
            if (oldGym.url && !this.url) {
                this.url = oldGym.url;
            }
            if (oldGym.raidIsExclusive && !this.raidIsExclusive) {
                this.raidIsExclusive = oldGym.raidIsExclusive;
            }
            if (oldGym.availableSlots !== this.availableSlots ||
                oldGym.teamId !== this.teamId ||
                oldGym.inBattle !== this.inBattle) {
                WebhookController.instance.addGymInfoEvent(this.toJson('gym-info'));
            }
            if (!this.raidEndTimestamp && oldGym.raidEndTimestamp) {
                this.raidEndTimestamp = oldGym.raidEndTimestamp;
            }
            if (this.raidSpawnTimestamp > 0 && (
                oldGym.raidLevel !== this.raidLevel ||
                oldGym.raidPokemonId !== this.raidPokemonId ||
                oldGym.raidSpawnTimestamp !== this.raidSpawnTimestamp
            )) {
                let raidBattleTime = new Date((this.raidBattleTimestamp || 0) * 1000);
                let raidEndTime = new Date((this.raidEndTimestamp || 0) * 1000);
                let now = new Date().getTime() / 1000;

                if (raidBattleTime > now && this.raidLevel || 0 > 0) {
                    WebhookController.instance.addEggEvent(this.toJson('egg'));
                } else if (raidEndTime > now && this.raidPokemonId || 0 > 0) {
                    WebhookController.instance.addRaidEvent(this.toJson('raid'));
                }
            }
        }
    }

    /**
     * Get Gym object as sql string
     */
    toSql() {
        return {
            sql: `
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
            `,
            args: [
                this.id.toString(),
                this.lat,
                this.lon,
                this.name,
                this.url,
                this.lastModifiedTimestamp,
                this.raidEndTimestamp,
                this.raidSpawnTimestamp,
                this.raidBattleTimestamp,
                this.updated,
                this.raidPokemonId,
                this.guardingPokemonId,
                this.availableSlots,
                this.teamId,
                this.raidLevel,
                this.enabled,
                this.exRaidEligible,
                this.inBattle,
                this.raidPokemonMove1,
                this.raidPokemonMove2,
                this.raidPokemonForm,
                this.raidPokemonCp,
                this.raidIsExclusive,
                this.cellId.toString(),
                this.deleted,
                this.totalCp,
                this.firstSeenTimestamp,
                this.raidPokemonGender,
                this.sponsorId,
                this.raidPokemonEvolution
            ]
        };
    }

    /**
     * Get Gym object as JSON object with correct property keys for webhook payload
     */
    toJson(type) {
        switch (type) {
            case 'gym':
                return {
                    type: 'gym',
                    message: {
                        gym_id: this.id,
                        gym_name: this.name || 'Unknown',
                        latitude: this.lat,
                        longitude: this.lon,
                        url: this.url || '',
                        enabled: this.enabled || true,
                        team_id: this.teamId || 0,
                        last_modified: this.lastModifiedTimestamp || 0,
                        guard_pokemon_id: this.guardPokemonId || 0,
                        slots_available: this.availableSlots || 6,
                        raid_active_until: this.raidEndTimestamp || 0,
                        ex_raid_eligible: this.exRaidEligible || 0,
                        sponsor_id: this.sponsorId || 0
                    }
                };
            case 'gym-info':
                return {
                    type: 'gym_details',
                    message: {
                        id: this.id,
                        name: this.name || 'Unknown',
                        url: this.url || '',
                        latitude: this.lat,
                        longitude: this.lon,
                        team: this.teamId || 0,
                        slots_available: this.availableSlots || 6,
                        ex_raid_eligible: this.exRaidEligible || 0,
                        in_battle: this.inBattle || false,
                        sponsor_id: this.sponsorId || 0
                    }
                };
            case 'egg':
            case 'raid':
                return {
                    type: 'raid',
                    message: {
                        gym_id: this.id,
                        gym_name: this.name || 'Unknown',
                        gym_url: this.url || '',
                        latitude: this.lat,
                        longitude: this.lon,
                        team_id: this.teamId || 0,
                        spawn: Math.round(this.raidSpawnTimestamp || 0),
                        start: Math.round(this.raidBattleTimestamp || 0),
                        end: Math.round(this.raidEndTimestamp || 0),
                        level: this.raidLevel || 0,
                        pokemon_id: this.raidPokemonId || 0,
                        cp: this.raidPokemonCp || 0,
                        gender: this.raidPokemonGender || 0,
                        form: this.raidPokemonForm || 0,
                        move_1: this.raidPokemonMove1 || 0,
                        move_2: this.raidPokemonMove2 || 0,
                        ex_raid_eligible: this.exRaidEligible || 0,
                        is_exclusive: this.raidIsExclusive || false,
                        sponsor_id: this.sponsorId || 0,
                        evolution: this.raidPokemonEvolution || 0,
                        costume: this.raidPokemonCostume || 0,
                    }
                };
        }
    }
}

module.exports = Gym;
