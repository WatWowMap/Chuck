'use strict';

const POGOProtos = require('pogo-protos');
const protos = require('purified-protos');

const { DataTypes, Model, Op, Sequelize } = require('sequelize');
const sequelize = require('../services/sequelize.js');
const WebhookController = require('../services/webhook.js');
const Cell = require('./cell');
const config = require('../services/config.js');

/**
 * Pokestop model class.
 */
class Pokestop extends Model {
    static LureTime = config.dataparser.lureTime;

    static fromFortFields = [
        'lat',
        'lon',
        'sponsorId',
        'enabled',
        'lastModifiedTimestamp',
        'url',
        'cellId',
        'updated',
        'deleted',
        'lureExpireTimestamp',
        'lureId',
        'incidentExpireTimestamp',
        'pokestopDisplay',
        'gruntType',
        'arScanEligible',
    ];
    static fromFort(cellId, fort) {
        let ts = new Date().getTime() / 1000;
        const record = {
            id: fort.id,
            lat: fort.latitude,
            lon: fort.longitude,
            sponsorId: fort.sponsor > 0 ? fort.sponsor : null,
            enabled: fort.enabled,
            lastModifiedTimestamp: fort.last_modified_timestamp_ms / 1000,
            url: fort.image_url ? fort.image_url : null,
            cellId,
            firstSeenTimestamp: ts,
            updated: ts,
            deleted: false,
            arScanEligible: fort.is_ar_scan_eligible,
        };
        if (fort.active_fort_modifier && fort.active_fort_modifier.length > 0 &&
            (fort.active_fort_modifier.includes(POGOProtos.Inventory.Item.ItemId.ITEM_TROY_DISK) ||
                fort.active_fort_modifier.includes(POGOProtos.Inventory.Item.ItemId.ITEM_TROY_DISK_GLACIAL) ||
                fort.active_fort_modifier.includes(POGOProtos.Inventory.Item.ItemId.ITEM_TROY_DISK_MAGNETIC) ||
                fort.active_fort_modifier.includes(POGOProtos.Inventory.Item.ItemId.ITEM_TROY_DISK_MOSSY))) {
            record.lureExpireTimestamp = record.lastModifiedTimestamp + Pokestop.LureTime;
            record.lureId = fort.active_fort_modifier[0];
        }
        if (fort.pokestop_display) {
            record.incidentExpireTimestamp = fort.pokestop_display.incident_expiration_ms / 1000;
            if (fort.pokestop_display.character_display) {
                record.pokestopDisplay = fort.pokestop_display.character_display.style;
                record.gruntType = fort.pokestop_display.character_display.character;
            }
        } else if (fort.pokestop_displays && fort.pokestop_displays.length > 0) {
            record.incidentExpireTimestamp = fort.pokestop_displays[0].incident_expiration_ms / 1000;
            if (fort.pokestop_displays[0].character_display) {
                record.pokestopDisplay = fort.pokestop_displays[0].character_display.style;
                record.gruntType = fort.pokestop_displays[0].character_display.character;
            }
        }
        return Pokestop.build(record);
    }

    static fromQuestFields = [
        'questType',
        'questTarget',
        'questTemplate',
        'questTimestamp',
        'questConditions',
        'questRewards',
        'updated',
        'deleted',
    ];
    /**
     * Add quest proto data to pokestop.
     * @param quest
     */
    static async fromQuest(quest) {
        let conditions = [];
        let rewards = [];
        for (let i = 0; i < quest.goal.condition.length; i++) {
            let condition = quest.goal.condition[i];
            let conditionData = {};
            let infoData = {};
            conditionData['type'] = condition.type;
            // TODO: Needs testing
            let info = condition;
            const rpc = await protos();
            console.log(rpc.QuestConditionProto);
            switch (condition.type) {
                case rpc.QuestConditionProto.ConditionType.WITH_BADGE_TYPE:
                    infoData['amount'] = info.badge_type.amount;
                    infoData['badge_rank'] = info.badge_rank;
                    let badgeTypesById = [];
                    info.badge_type.forEach(badge => badgeTypesById.push(badge));
                    infoData['badge_types'] = badgeTypesById;
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_ITEM:
                    if (info.item !== 0) {
                        infoData['item_id'] = info.item;
                    }
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_RAID_LEVEL:
                    let raidLevelById = [];
                    info.with_raid_level.raid_level.forEach(raidLevel => raidLevelById.push(raidLevel));
                    infoData['raid_levels'] = raidLevelById;
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_POKEMON_TYPE:
                    let pokemonTypesById = [];
                    info.with_pokemon_type.pokemon_type.forEach(type => pokemonTypesById.push(type));
                    infoData['pokemon_type_ids'] = pokemonTypesById;
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_POKEMON_CATEGORY:
                    if (info.with_pokemon_category.category_name) {
                        infoData['category_name'] = info.with_pokemon_category.category_name;
                    }
                    if (info.with_pokemon_category.pokemon_ids) {
                        infoData['pokemon_ids'] = info.with_pokemon_category.pokemon_ids;
                    }
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_WIN_RAID_STATUS:
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_THROW_TYPE:
                case rpc.QuestConditionProto.ConditionType.WITH_THROW_TYPE_IN_A_ROW:
                    if (info.with_throw_type.throw_type > 0) {
                        infoData['throw_type_id'] = info.with_throw_type.throw_type;
                    }
                    infoData['hit'] = info.with_throw_type.hit
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_LOCATION:
                    infoData['cell_ids'] = info.s2_cell_id;
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_DISTANCE:
                    infoData['distance'] = info.distance_km;
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_POKEMON_ALIGNMENT:
                    infoData['alignment_ids'] = info.pokemon_alignment.alignment.map(x => parseInt(x));
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_INVASION_CHARACTER:
                    infoData['character_category_ids'] = info.with_invasion_character.category.map(x => parseInt(x));
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_NPC_COMBAT:
                    infoData['win'] = info.with_npc_combat.requires_win || false;
                    infoData['trainer_ids'] = info.with_npc_combat.combat_npc_trainer_id;
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_PVP_COMBAT:
                    infoData['win'] = info.with_pvp_combat.requires_win || false;
                    infoData['template_ids'] = info.with_pvp_combat.combat_league_template_id;
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_BUDDY:
                    if (info.with_buddy) {
                        infoData['min_buddy_level'] = info.with_buddy.min_buddy_level; // TODO: with_buddy? is Condition
                        infoData['must_be_on_map'] = info.with_buddy.must_be_on_map;
                    }
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_DAILY_BUDDY_AFFECTION:
                    infoData['min_buddy_affection_earned_today'] = info.daily_buddy_affection.min_buddy_affection_earned_today;
                    break;
                case rpc.QuestConditionProto.ConditionType.WITH_TEMP_EVO_POKEMON:
                    infoData['raid_pokemon_evolutions'] = info.with_mega_evo_pokemon.pokemon_evolution.map(x => parseInt(x));
                    break;
                default:
                    console.warn('Unhandled quest condition', condition.type);
                    break;
            }
            if (infoData) {
                conditionData['info'] = infoData;
            }
            conditions.push(conditionData);
        }
        for (let i = 0; i < quest.quest_rewards.length; i++) {
            let reward = quest.quest_rewards[i];
            let rewardData = {};
            let infoData = {};
            rewardData['type'] = reward.type;
            const rpc = await protos();
            switch (reward.type) {
                case rpc.QuestRewardProto.Type.CANDY:
                    infoData['amount'] = reward.amount;
                    infoData['pokemon_id'] = reward.pokemon_id;
                    break;
                case rpc.QuestRewardProto.Type.EXPERIENCE:
                    infoData['amount'] = reward.exp;
                    break;
                case rpc.QuestRewardProto.Type.ITEM:
                    infoData['amount'] = reward.item.amount;
                    infoData['item_id'] = reward.item.item;
                    break;
                case rpc.QuestRewardProto.Type.POKEMON_ENCOUNTER:
                    if (reward.pokemon_encounter.is_hidden_ditto) {
                        infoData['pokemon_id'] = 132;
                        infoData['pokemon_id_display'] = reward.pokemon_encounter.pokemon_id;
                    } else {
                        infoData['pokemon_id'] = reward.pokemon_encounter.pokemon_id;
                    }
                    if (reward.pokemon_encounter.pokemon_display) {
                        infoData['costume_id'] = reward.pokemon_encounter.pokemon_display.costume || 0;
                        infoData['form_id'] = reward.pokemon_encounter.pokemon_display.form || 0;
                        infoData['gender_id'] = reward.pokemon_encounter.pokemon_display.gender || 0;
                        infoData['shiny'] = reward.pokemon_encounter.pokemon_display.shiny || false;
                    }
                    break;
                case rpc.QuestRewardProto.Type.STARDUST:
                    infoData['amount'] = reward.stardust;
                    break;
                case rpc.QuestRewardProto.Type.MEGA_RESOURCE:
                    infoData['amount'] = reward.mega_resource.amount;
                    infoData['pokemon_id'] = reward.mega_resource.pokemon_id;
                    break;
                default:
                    console.warn('Unrecognized reward.type', reward.type);
                    break;
            }
            rewardData['info'] = infoData;
            rewards.push(rewardData);
        }
        const ts = new Date().getTime() / 1000;
        return Pokestop.build({
            id: quest.fort_id,
            questType: quest.quest_type,
            questTarget: quest.goal.target,
            questTemplate: quest.template_id.toLowerCase(),
            questTimestamp: quest.last_update_timestamp_ms / 1000,
            questConditions: conditions,
            questRewards: rewards,
            firstSeenTimestamp: ts,
            updated: ts,
            deleted: false,
        });
    }

    static getAll(minLat, maxLat, minLon, maxLon) {
        return Pokestop.findAll({
            where: {
                lat: { [Op.between]: [minLat, maxLat] },
                lon: { [Op.between]: [minLon, maxLon] },
            },
        });
    }

    static async getByIds(ids) {
        try {
            return await Pokestop.findAll({
                where: { id: ids },
            });
        } catch (err) {
            console.error('[Pokestop] Error:', err);
            return [];
        }
    }

    /**
     * Update Pokestop values if changed from already found Pokestop
     */
    async triggerWebhook(updateQuest) {
        let oldPokestop = null;
        try {
            oldPokestop = await Pokestop.findByPk(this.id);
        } catch { }

        if (oldPokestop === null) {
            WebhookController.instance.addPokestopEvent(this.toJson('pokestop'));
            oldPokestop = {};
        }
        if (updateQuest) {
            if (!oldPokestop) {
                return true;
            }
            this.lat = oldPokestop.lat;
            this.lon = oldPokestop.lon;
            this.arScanEligible = oldPokestop.arScanEligible;
            if (updateQuest && (this.questTimestamp || 0) > (oldPokestop.questTimestamp || 0)) {
                WebhookController.instance.addQuestEvent(this.toJson('quest'));
            }
        } else {
            if ((oldPokestop.lureExpireTimestamp || 0) < (this.lureExpireTimestamp || 0)) {
                WebhookController.instance.addLureEvent(this.toJson('lure'));
            }
            if ((oldPokestop.incidentExpireTimestamp || 0) < (this.incidentExpireTimestamp || 0)) {
                WebhookController.instance.addInvasionEvent(this.toJson('invasion'));
            }
        }
        return false;
    }

    /**
     * Get Pokestop object
     */
    getClosest(lat, lon) {
        return Pokestop.findAll({
            attributes: [
                'id',
                'lat',
                'lon',
                [
                    Sequelize.fn('ST_Distance_Sphere',
                        Sequelize.fn('ST_MakePoint', Sequelize.col('lat'), Sequelize.col('lon')),
                        Sequelize.fn('ST_MakePoint', lat, lon),
                    ),
                    'distance',
                ],
            ],
            where: {
                questType: null,
                enabled: true,
            },
            order: 'distance',
        });
    }

    static async clearQuests(ids) {
        const results = await Pokestop.update({
            questType: null,
            questTimestamp: null,
            questTarget: null,
            questConditions: null,
            questRewards: null,
            questTemplate: null,
        }, {
            where: ids && ids.length > 0 ? { id: ids } : undefined,
        });
        console.log('[Pokestop] ClearQuests:', results);
    }

    static async getQuestCountIn(ids) {
        if (ids.length > 10000) {
            let result = 0;
            let count = parseInt(Math.ceil(ids.length / 10000.0));
            for (let i = 0; i < count; i++) {
                let start = 10000 * i;
                let end = Math.min(10000 * (i + 1) - 1, ids.length - 1);
                let slice = ids.slice(start, end);
                let sliceResult = await this.getQuestCountIn(slice);
                if (sliceResult.length > 0) {
                    sliceResult.forEach(x => result += x);
                }
            }
            return result;
        }

        if (ids.length === 0) {
            return 0;
        }
        return await Pokestop.count({
            where: {
                id: ids,
                deleted: false,
                questRewardType: { [Op.ne]: null },
            },
        });
    }

    /**
     * Get Pokestop object as JSON object with correct property keys for webhook payload
     * @param {*} type 
     */
    toJson(type) {
        switch (type) {
            case "quest": // Quest
                return {
                    type: "quest",
                    message: {
                        pokestop_id: this.id,
                        latitude: this.lat,
                        longitude: this.lon,
                        type: this.questType,
                        target: this.questTarget,
                        template: this.questTemplate,
                        conditions: this.questConditions,
                        rewards: this.questRewards,
                        updated: this.questTimestamp,
                        pokestop_name: this.name || "Unknown",
                        pokestop_url: this.url || ""
                    }
                };
            case "invasion": // Invasion
                return {
                    type: "invasion",
                    message: {
                        pokestop_id: this.id,
                        latitude: this.lat,
                        longitude: this.lon,
                        name: this.name || "Unknown",
                        url: this.url || "",
                        lure_expiration: this.lureExpireTimestamp || 0,
                        last_modified: this.lastModifiedTimestamp || 0,
                        enabled: this.enabled || true,
                        lure_id: this.lureId || 0,
                        pokestop_display: this.pokestopDisplay || 0,
                        incident_expire_timestamp: this.incidentExpireTimestamp || 0,
                        grunt_type: this.gruntType || 0,
                        updated: this.updated || 1
                    }
                };
            default: // Pokestop
                return {
                    type: "pokestop",
                    message: {
                        pokestop_id: this.id,
                        latitude: this.lat,
                        longitude: this.lon,
                        name: this.name || "Unknown",
                        url: this.url || "",
                        lure_expiration: this.lureExpireTimestamp || 0,
                        last_modified: this.lastModifiedTimestamp || 0,
                        enabled: this.enabled || true,
                        lure_id: this.lureId || 0,
                        pokestop_display: this.pokestopDisplay || 0,
                        incident_expire_timestamp: this.incidentExpireTimestamp || 0,
                        ar_scan_eligible: this.arScanEligible || 0,
                        updated: this.updated || 1
                    }
                };
        }
    }
}
Pokestop.init({
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
    lureExpireTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    lastModifiedTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    updated: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: false,
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: null,
    },
    questType: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    questTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    questTarget: {
        type: DataTypes.SMALLINT(6).UNSIGNED,
        defaultValue: null,
    },
    questConditions: {
        type: DataTypes.JSONTEXT,
        defaultValue: null,
    },
    questRewards: {
        type: DataTypes.JSONTEXT,
        defaultValue: null,
    },
    questTemplate: {
        type: DataTypes.STRING(100),
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
    lureId: {
        type: DataTypes.SMALLINT(5).UNSIGNED,
        defaultValue: 0,
    },
    pokestopDisplay: {
        type: DataTypes.SMALLINT(5).UNSIGNED,
        defaultValue: 0,
    },
    incidentExpireTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    firstSeenTimestamp: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        defaultValue: null,
    },
    gruntType: {
        type: DataTypes.SMALLINT(5).UNSIGNED,
        defaultValue: 0,
    },
    sponsorId: {
        type: DataTypes.SMALLINT(5).UNSIGNED,
        defaultValue: null,
    },
    arScanEligible: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
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
            name: 'ix_lure_expire_timestamp',
            fields: ['lureExpireTimestamp'],
        },
        {
            name: 'ix_updated',
            fields: ['updated'],
        },
        {
            name: 'fk_pokestop_cell_id',    // TODO: ix?
            fields: ['cellId'],
        },
        {
            name: 'ix_pokestop_deleted',
            fields: ['deleted'],
        },
        /**
         * TODO:
         * KEY `ix_quest_pokemon_id` (`quest_pokemon_id`),
         * KEY `ix_quest_reward_type` (`quest_reward_type`),
         * KEY `ix_quest_item_id` (`quest_item_id`),
         */
        {
            name: 'ix_incident_expire_timestamp',
            fields: ['incidentExpireTimestamp'],
        },
    ],
    tableName: 'pokestop',
});
Cell.Pokestops = Cell.hasMany(Pokestop, {
    foreignKey: 'cellId',
});
Pokestop.Cell = Pokestop.belongsTo(Cell);

// Export the class
module.exports = Pokestop;
