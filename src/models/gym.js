'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../services/sequelize.js');
const WebhookController = require('../services/webhook.js');
const Cell = require('./cell.js');

const PokemonEvolution = {
    Unset: 0,
    Mega: 1,
    MegaX: 2,
    MegaY: 3
};

/**
 * Gym model class.
 */
class Gym extends Model {
    static fromFortFields = [
        'lat',
        'lon',
        'enabled',
        'guardingPokemonId',
        'teamId',
        'availableSlots',
        'lastModifiedTimestamp',
        'exRaidEligible',
        'sponsorId',
        'url',
        'totalCp',
        'cellId',
        'deleted',
        'updated',
        'raidEndTimestamp',
        'raidSpawnTimestamp',
        'raidBattleTimestamp',
        'raidLevel',
        'raidIsExclusive',
        'raidPokemonId',
        'raidPokemonMove1',
        'raidPokemonMove2',
        'raidPokemonCp',
        'raidPokemonForm',
        'raidPokemonGender',
        'raidPokemonEvolution',
    ];
    static fromFort(cellId, fort) {
        const ts = new Date().getTime() / 1000;
        const record = {
            id: fort.id,
            lat: fort.latitude,
            lon: fort.longitude,
            enabled: fort.enabled,
            guardingPokemonId: fort.guard_pokemon_id,
            teamId: fort.owned_by_team,
            availableSlots: fort.gym_display ? fort.gym_display.slots_available : 0,    // TODO: No slots available?
            lastModifiedTimestamp: fort.last_modified_timestamp_ms / 1000,
            exRaidEligible: fort.is_ex_raid_eligible,
            sponsorId: fort.sponsor > 0 ? fort.sponsor : 0,
            url: fort.image_url ? fort.image_url : null,
            totalCp: fort.owned_by_team ? fort.gym_display.total_gym_cp : 0,
            cellId,
            deleted: false,
            firstSeenTimestamp: ts,
            updated: ts,
        };
        if (fort.raid_info) {
            record.raidEndTimestamp = fort.raid_info.raid_end_ms / 1000;
            record.raidSpawnTimestamp = fort.raid_info.raid_spawn_ms / 1000;
            record.raidBattleTimestamp = fort.raid_info.raid_battle_ms / 1000;
            record.raidLevel = fort.raid_info.raid_level;
            record.raidIsExclusive = fort.raid_info.is_exclusive;
            if (fort.raid_info.raid_pokemon) {
                record.raidPokemonId = fort.raid_info.raid_pokemon.pokemon_id;
                record.raidPokemonMove1 = fort.raid_info.raid_pokemon.move_1;
                record.raidPokemonMove2 = fort.raid_info.raid_pokemon.move_2;
                record.raidPokemonCp = fort.raid_info.raid_pokemon.cp;
                record.raidPokemonForm = fort.raid_info.raid_pokemon.pokemon_display.form;
                record.raidPokemonGender = fort.raid_info.raid_pokemon.pokemon_display.gender;
                if (fort.raid_info.raid_pokemon.pokemon_display.pokemon_evolution) {
                    record.raidPokemonEvolution = fort.raid_info.raid_pokemon.pokemon_display.pokemon_evolution;
                }
            }
        }
        return Gym.build(record);
    }

    /**
     * Get Gym by unique id
     * @param {*} id 
     * @param {*} withDeleted 
     */
    async getById(id, withDeleted = true) {
        const result = await Gym.findByPk(id);
        return withDeleted || !result.deleted ? result : null;
    }

    /**
     * trigger webhooks
     */
    async triggerWebhook() {
        let oldGym = null;
        try {
            oldGym = await Gym.findByPk(this.id);
        } catch (err) {
        }

        if (oldGym === null) {
            WebhookController.instance.addGymEvent(this.toJson('gym'));
            WebhookController.instance.addGymInfoEvent(this.toJson('gym-info'));
            let raidBattleTime = new Date((this.raidBattleTimestamp || 0) * 1000);
            let raidEndTime = new Date((this.raidEndTimestamp || 0) * 1000);
            let now = new Date().getTime() / 1000;            
            
            if (raidBattleTime > now && (this.raidLevel || 0) > 0) {
                WebhookController.instance.addEggEvent(this.toJson('egg'));
            } else if (raidEndTime > now && (this.raidPokemonId || 0) > 0) {
                WebhookController.instance.addRaidEvent(this.toJson('raid'));
            }
        } else {
            if (oldGym.availableSlots !== this.availableSlots ||
                oldGym.teamId !== this.teamId ||
                oldGym.inBattle !== this.inBattle) {
                WebhookController.instance.addGymInfoEvent(this.toJson('gym-info'));
            }
            if (this.raidSpawnTimestamp > 0 && (
                oldGym.raidLevel !== this.raidLevel ||
                oldGym.raidPokemonId !== this.raidPokemonId ||
                oldGym.raidSpawnTimestamp !== this.raidSpawnTimestamp
            )) {
                let raidBattleTime = new Date((this.raidBattleTimestamp || 0) * 1000);
                let raidEndTime = new Date((this.raidEndTimestamp || 0) * 1000);
                let now = new Date().getTime() / 1000;

                if (raidBattleTime > now && (this.raidLevel || 0) > 0) {
                    WebhookController.instance.addEggEvent(this.toJson('egg'));
                } else if (raidEndTime > now && (this.raidPokemonId || 0) > 0) {
                    WebhookController.instance.addRaidEvent(this.toJson('raid'));
                }
            }
        }
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
Gym.init({
    id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
    },
    lat: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
    },
    lon: {
        type: DataTypes.DOUBLE(18, 14),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(128),
        defaultValue: null,
    },
    url: {
        type: DataTypes.STRING(200),
        defaultValue: null,
    },
    lastModifiedTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    raidEndTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    raidSpawnTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    raidBattleTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    updated: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    raidPokemonId: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
    },
    guardingPokemonId: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
    },
    availableSlots: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
        field: 'availble_slots',    // TODO: whoever spelled this wrong, f*** you
    },
    teamId: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    raidLevel: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: null,
    },
    exRaidEligible: {
        type: DataTypes.BOOLEAN,
        defaultValue: null,
    },
    inBattle: {
        type: DataTypes.BOOLEAN,
        defaultValue: null,
    },
    raidPokemonMove1: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
        field: 'raid_pokemon_move_1',
    },
    raidPokemonMove2: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
        field: 'raid_pokemon_move_2',
    },
    raidPokemonForm: {
        type: DataTypes.MEDIUMINT(5).UNSIGNED,
        defaultValue: null,
    },
    raidPokemonCp: {
        type: DataTypes.MEDIUMINT(5).UNSIGNED,
        defaultValue: null,
    },
    raidIsExclusive: {
        type: DataTypes.BOOLEAN,
        defaultValue: null,
    },
    cellId: {
        type: DataTypes.BIGINT(20).UNSIGNED,
        defaultValue: null,
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    totalCp: {
        type: DataTypes.INTEGER(11),
        defaultValue: null,
    },
    firstSeenTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    raidPokemonGender: {
        type: DataTypes.TINYINT(3).UNSIGNED,
        defaultValue: null,
    },
    sponsorId: {
        type: DataTypes.SMALLINT(5).UNSIGNED,
        defaultValue: null,
    },
    raidPokemonCostume: {
        type: DataTypes.SMALLINT(4).UNSIGNED,
        defaultValue: null,
    },
    raidPokemonEvolution: {
        type: DataTypes.TINYINT(1).UNSIGNED,
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
            name: 'ix_raid_end_timestamp',
            fields: ['raid_end_timestamp'],
        },
        {
            name: 'ix_updated',
            fields: ['updated'],
        },
        {
            name: 'ix_raid_pokemon_id',
            fields: ['raid_pokemon_id'],
        },
        {
            name: 'ix_raid_pokemon_id',
            fields: ['raid_pokemon_id'],
        },
        {
            // TODO: ix?
            name: 'fk_gym_cell_id',
            fields: ['cell_id'],
        },
        {
            name: 'ix_gym_deleted',
            fields: ['deleted'],
        },
    ],
    tableName: 'gym',
});
Cell.Gyms = Cell.hasMany(Gym, {
    foreignKey: 'cell_id',
});
Gym.Cell = Gym.belongsTo(Cell);

module.exports = Gym;
