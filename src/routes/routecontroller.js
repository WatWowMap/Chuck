'use strict';

const POGOProtos = require('pogo-protos');

const config = require('../services/config.js');
const Consumer = require('../services/consumer.js');
const ipcWorker = require('../ipc/worker.js');
const Account = require('../models/account.js');
const Device = require('../models/device.js');
const { sendResponse, base64_decode } = require('../services/utils.js');

const RpcMethod = {
    UnSet: parseInt(POGOProtos.Rpc.Method.METHOD_UNSET), // 0
    GetPlayerOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GET_PLAYER), // 2
    UnUsed_GetHoloholoInventoryOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GET_HOLOHOLO_INVENTORY), // 4
    DownloadSettingsResponseProto: parseInt(POGOProtos.Rpc.Method.METHOD_DOWNLOAD_SETTINGS), // 5
    GetGameMasterClientTemplatesOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_DOWNLOAD_ITEM_TEMPLATES), // 6
    GetRemoteConfigVersionsOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_DOWNLOAD_REMOTE_CONFIG_VERSION), // 7
    FortSearchOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_FORT_SEARCH), // 101
    EncounterOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_ENCOUNTER), // 102
    FortDetailsOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_FORT_DETAILS), // 104
    GetMapObjectsOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GET_MAP_OBJECTS), // 106
    GymGetInfoOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GYM_GET_INFO), // 156
    AssetDigestOutProto: parseInt(POGOProtos.Rpc.Method.METHOD_GET_ASSET_DIGEST), // 300
    DownloadGmTemplatesResponseProto: parseInt(POGOProtos.Rpc.ClientAction.CLIENT_ACTION_DOWNLOAD_GAME_MASTER_TEMPLATES), // 5004
    GetHoloholoInventoryOutProto: parseInt(POGOProtos.Rpc.ClientAction.CLIENT_ACTION_GET_INVENTORY), // 5005
    //Demo for others..
    DemoSocial: parseInt(POGOProtos.Rpc.SocialAction.SOCIAL_ACTION_ACCEPT_FRIEND_INVITE) // 10004

    /*
    * more types...
    *
            METHOD_REGISTER_BACKGROUND_DEVICE = 8,
            METHOD_GET_PLAYER_DAY = 9,
            METHOD_ACKNOWLEDGE_PUNISHMENT = 10,
            METHOD_GET_SERVER_TIME = 11,
            METHOD_GET_LOCAL_TIME = 12,
            METHOD_CATCH_POKEMON = 103,
            METHOD_FORT_DEPLOY_POKEMON = 110,
            METHOD_FORT_RECALL_POKEMON = 111,
            METHOD_RELEASE_POKEMON = 112,
            METHOD_USE_ITEM_POTION = 113,
            METHOD_USE_ITEM_CAPTURE = 114,
            METHOD_USE_ITEM_FLEE = 115,
            METHOD_USE_ITEM_REVIVE = 116,
            METHOD_GET_PLAYER_PROFILE = 121,
            METHOD_EVOLVE_POKEMON = 125,
            METHOD_GET_HATCHED_EGGS = 126,
            METHOD_ENCOUNTER_TUTORIAL_COMPLETE = 127,
            METHOD_LEVEL_UP_REWARDS = 128,
            METHOD_CHECK_AWARDED_BADGES = 129,
            METHOD_RECYCLE_INVENTORY_ITEM = 137,
            METHOD_COLLECT_DAILY_BONUS = 138,
            METHOD_USE_ITEM_XP_BOOST = 139,
            METHOD_USE_ITEM_EGG_INCUBATOR = 140,
            METHOD_USE_INCENSE = 141,
            METHOD_GET_INCENSE_POKEMON = 142,
            METHOD_INCENSE_ENCOUNTER = 143,
            METHOD_ADD_FORT_MODIFIER = 144,
            METHOD_DISK_ENCOUNTER = 145,
            METHOD_UPGRADE_POKEMON = 147,
            METHOD_SET_FAVORITE_POKEMON = 148,
            METHOD_NICKNAME_POKEMON = 149,
            METHOD_EQUIP_BADGE = 150,
            METHOD_SET_CONTACT_SETTINGS = 151,
            METHOD_SET_BUDDY_POKEMON = 152,
            METHOD_GET_BUDDY_WALKED = 153,
            METHOD_USE_ITEM_ENCOUNTER = 154,
            METHOD_GYM_DEPLOY = 155,
            METHOD_GYM_START_SESSION = 157,
            METHOD_GYM_BATTLE_ATTACK = 158,
            METHOD_JOIN_LOBBY = 159,
            METHOD_LEAVE_LOBBY = 160,
            METHOD_SET_LOBBY_VISIBILITY = 161,
            METHOD_SET_LOBBY_POKEMON = 162,
            METHOD_GET_RAID_DETAILS = 163,
            METHOD_GYM_FEED_POKEMON = 164,
            METHOD_START_RAID_BATTLE = 165,
            METHOD_ATTACK_RAID = 166,
            METHOD_AWARD_POKECOIN = 167,
            METHOD_USE_ITEM_STARDUST_BOOST = 168,
            METHOD_REASSIGN_PLAYER = 169,
            METHOD_REDEEM_POI_PASSCODE = 170,
            METHOD_CONVERT_CANDY_TO_XL_CANDY = 171,
            METHOD_IS_SKU_AVAILABLE = 172,
            METHOD_GET_DOWNLOAD_URLS = 301,
            METHOD_GET_ASSET_VERSION = 302,
            METHOD_CLAIM_CODENAME = 403,
            METHOD_SET_AVATAR = 404,
            METHOD_SET_PLAYER_TEAM = 405,
            METHOD_MARK_TUTORIAL_COMPLETE = 406,
            METHOD_UPDATE_PERFORMANCE_METRICS = 407,
            METHOD_CHECK_CHALLENGE = 600,
            METHOD_VERIFY_CHALLENGE = 601,
            METHOD_ECHO = 666,
            METHOD_SFIDA_REGISTRATION = 800,
            METHOD_SFIDA_ACTION_LOG = 801,
            METHOD_SFIDA_CERTIFICATION = 802,
            METHOD_SFIDA_UPDATE = 803,
            METHOD_SFIDA_ACTION = 804,
            METHOD_SFIDA_DOWSER = 805,
            METHOD_SFIDA_CAPTURE = 806,
            METHOD_LIST_AVATAR_CUSTOMIZATIONS = 807,
            METHOD_SET_AVATAR_ITEM_AS_VIEWED = 808,
            METHOD_GET_INBOX = 809,
            METHOD_LIST_GYM_BADGES = 811,
            METHOD_GET_GYM_BADGE_DETAILS = 812,
            METHOD_USE_ITEM_MOVE_REROLL = 813,
            METHOD_USE_ITEM_RARE_CANDY = 814,
            METHOD_AWARD_FREE_RAID_TICKET = 815,
            METHOD_FETCH_ALL_NEWS = 816,
            METHOD_MARK_READ_NEWS_ARTICLE = 817,
            METHOD_GET_PLAYER_DISPLAY_INFO = 818,
            METHOD_BELUGA_TRANSACTION_START = 819,
            METHOD_BELUGA_TRANSACTION_COMPLETE = 820,
            METHOD_GET_NEW_QUESTS = 900,
            METHOD_GET_QUEST_DETAILS = 901,
            METHOD_COMPLETE_QUEST = 902,
            METHOD_REMOVE_QUEST = 903,
            METHOD_QUEST_ENCOUNTER = 904,
            METHOD_COMPLETE_QUEST_STAMP_CARD = 905,
            METHOD_PROGRESS_QUEST = 906,
            METHOD_SEND_GIFT = 950,
            METHOD_OPEN_GIFT = 951,
            METHOD_GIFT_DETAILS = 952,
            METHOD_DELETE_GIFT = 953,
            METHOD_SAVE_PLAYER_SNAPSHOT = 954,
            METHOD_GET_FRIENDSHIP_MILESTONE_REWARDS = 955,
            METHOD_CHECK_SEND_GIFT = 956,
            METHOD_SET_FRIEND_NICKNAME = 957,
            METHOD_DELETE_GIFT_FROM_INVENTORY = 958,
            METHOD_SAVE_SOCIAL_PLAYER_SETTINGS = 959,
            METHOD_SHARE_EX_RAID_PASS = 960,
            METHOD_CHECK_SHARE_EX_RAID_PASS = 961,
            METHOD_DECLINE_SHARED_EX_RAID_PASS = 962,
            METHOD_OPEN_TRADING = 970,
            METHOD_UPDATE_TRADING = 971,
            METHOD_CONFIRM_TRADING = 972,
            METHOD_CANCEL_TRADING = 973,
            METHOD_GET_TRADING = 974,
            METHOD_GET_FITNESS_REWARDS = 980,
            METHOD_GET_COMBAT_PLAYER_PROFILE = 990,
            METHOD_GENERATE_COMBAT_CHALLENGE_ID = 991,
            METHOD_CREATE_COMBAT_CHALLENGE = 992,
            METHOD_OPEN_COMBAT_CHALLENGE = 993,
            METHOD_GET_COMBAT_CHALLENGE = 994,
            METHOD_ACCEPT_COMBAT_CHALLENGE = 995,
            METHOD_DECLINE_COMBAT_CHALLENGE = 996,
            METHOD_CANCEL_COMBAT_CHALLENGE = 997,
            METHOD_SUBMIT_COMBAT_CHALLENGE_POKEMONS = 998,
            METHOD_SAVE_COMBAT_PLAYER_PREFERENCES = 999,
            METHOD_OPEN_COMBAT_SESSION = 1000,
            METHOD_UPDATE_COMBAT = 1001,
            METHOD_QUIT_COMBAT = 1002,
            METHOD_GET_COMBAT_RESULTS = 1003,
            METHOD_UNLOCK_SPECIAL_MOVE = 1004,
            METHOD_GET_NPC_COMBAT_REWARDS = 1005,
            METHOD_COMBAT_FRIEND_REQUEST = 1006,
            METHOD_OPEN_NPC_COMBAT_SESSION = 1007,
            METHOD_START_TUTORIAL_ACTION = 1008,
            METHOD_GET_TUTORIAL_EGG_ACTION = 1009,
            METHOD_SEND_PROBE = 1020,
            METHOD_PROBE_DATA = 1021,
            METHOD_COMBAT_DATA = 1022,
            METHOD_COMBAT_CHALLENGE_DATA = 1023,
            METHOD_CHECK_PHOTOBOMB = 1101,
            METHOD_CONFIRM_PHOTOBOMB = 1102,
            METHOD_GET_PHOTOBOMB = 1103,
            METHOD_ENCOUNTER_PHOTOBOMB = 1104,
            METHOD_GET_SIGNED_GMAP_URL_DEPRECATED = 1105,
            METHOD_CHANGE_TEAM = 1106,
            METHOD_GET_WEB_TOKEN = 1107,
            METHOD_COMPLETE_SNAPSHOT_SESSION = 1110,
            METHOD_START_INCIDENT = 1200,
            METHOD_INVASION_COMPLETE_DIALOGUE = 1201,
            METHOD_INVASION_OPEN_COMBAT_SESSION = 1202,
            METHOD_INVASION_BATTLE_UPDATE = 1203,
            METHOD_INVASION_ENCOUNTER = 1204,
            METHOD_PURIFY_POKEMON = 1205,
            METHOD_GET_ROCKET_BALLOON = 1206,
            METHOD_START_ROCKET_BALLOON_INCIDENT = 1207,
            METHOD_VS_SEEKER_START_MATCHMAKING = 1300,
            METHOD_CANCEL_MATCHMAKING = 1301,
            METHOD_GET_MATCHMAKING_STATUS = 1302,
            METHOD_COMPLETE_VS_SEEKER_AND_RESTART_CHARGING = 1303,
            METHOD_GET_VS_SEEKER_STATUS = 1304,
            METHOD_COMPLETE_COMBAT_COMPETITIVE_SEASON_ACTION = 1305,
            METHOD_CLAIM_VS_SEEKER_REWARDS = 1306,
            METHOD_VS_SEEKER_REWARD_ENCOUNTER = 1307,
            METHOD_ACTIVATE_VS_SEEKER = 1308,
            METHOD_GET_BUDDY_MAP = 1350,
            METHOD_GET_BUDDY_STATS = 1351,
            METHOD_FEED_BUDDY = 1352,
            METHOD_OPEN_BUDDY_GIFT = 1353,
            METHOD_PET_BUDDY = 1354,
            METHOD_GET_BUDDY_HISTORY = 1355,
            METHOD_CREATE_BUDDY_MUTLIPLAYER_SESSION = 1456,
            METHOD_JOIN_BUDDY_MULTIPLAYER_SESSION = 1457,
            METHOD_LEAVE_BUDDY_MULTIPLAYER_SESSION = 1458,
            METHOD_GET_TODAY_VIEW = 1501,
            METHOD_MEGA_EVOLVE_POKEMON = 1502,
            METHOD_REMOTE_GIFT_PING = 1503,
            METHOD_SEND_RAID_INVITATION = 1504,
            METHOD_GET_DAILY_ENCOUNTER = 1601,
            METHOD_DAILY_ENCOUNTER = 1602,
            METHOD_OPEN_SPONSORED_GIFT = 1650,
            METHOD_SPONSORED_GIFT_REPORT_INTERACTION = 1651,
            METHOD_SAVE_PLAYER_PREFERENCES = 1652,
            METHOD_PROFANITY_CHECK = 1653,
            METHOD_GET_TIMED_GROUP_CHALLENGE = 1700,
            METHOD_GET_NINTENDO_ACCOUNT = 1710,
            METHOD_UNLINK_NINTENDO_ACCOUNT = 1711,
            METHOD_GET_NINTENDO_OAUTH2_URL = 1712,
            METHOD_TRANSFER_TO_POKEMON_HOME = 1713,
            METHOD_REPORT_AD_FEEDBACK = 1716,
            METHOD_CREATE_POKEMON_TAG = 1717,
            METHOD_DELETE_POKEMON_TAG = 1718,
            METHOD_EDIT_POKEMON_TAG = 1719,
            METHOD_SET_POKEMON_TAGS_FOR_POKEMON = 1720,
            METHOD_GET_POKEMON_TAGS = 1721,
            CLIENT_ACTION_UNKNOWN_PLATFORM_CLIENT_ACTION = 0,
            CLIENT_ACTION_REGISTER_PUSH_NOTIFICATION = 5000,
            CLIENT_ACTION_UNREGISTER_PUSH_NOTIFICATION = 5001,
            CLIENT_ACTION_UPDATE_NOTIFICATION_STATUS = 5002,
            CLIENT_ACTION_OPT_OUT_PUSH_NOTIFICATION_CATEGORY = 5003,
            CLIENT_ACTION_REDEEM_PASSCODE = 5006,
            CLIENT_ACTION_PING = 5007,
            CLIENT_ACTION_ADD_LOGIN_ACTION = 5008,
            CLIENT_ACTION_REMOVE_LOGIN_ACTION = 5009,
            CLIENT_ACTION_LIST_LOGIN_ACTION = 5010,
            CLIENT_ACTION_ADD_NEW_POI = 5011,
            CLIENT_ACTION_PROXY_SOCIAL_ACTION = 5012,
            CLIENT_ACTION_DEPRECATED_CLIENT_TELEMETRY = 5013,
            CLIENT_ACTION_GET_AVAILABLE_SUBMISSIONS = 5014,
            CLIENT_ACTION_GET_SIGNED_URL_FOR_PHOTO_UPLOAD = 5015,
            CLIENT_ACTION_REPLACE_LOGIN_ACTION = 5016,
            CLIENT_ACTION_PROXY_SOCIAL_SIDE_CHANNEL_ACTION = 5017,
            CLIENT_ACTION_COLLECT_CLIENT_TELEMETRY = 5018,
            CLIENT_ACTION_PURCHASE_SKU = 5019,
            CLIENT_ACTION_GET_AVAILABLE_SKUS_AND_BALANCES = 5020,
            CLIENT_ACTION_REDEEM_GOOGLE_RECEIPT = 5021,
            CLIENT_ACTION_REDEEM_APPLE_RECEIPT = 5022,
            CLIENT_ACTION_REDEEM_DESKTOP_RECEIPT = 5023,
            CLIENT_ACTION_UPDATE_FITNESS_METRICS = 5024,
            CLIENT_ACTION_GET_FITNESS_REPORT = 5025,
            CLIENT_ACTION_GET_CLIENT_TELEMETRY_SETTINGS = 5026,
            CLIENT_ACTION_PING_ASYNC = 5027,
            CLIENT_ACTION_REGISTER_BACKGROUND_SERVICE = 5028,
            CLIENT_ACTION_GET_CLIENT_BGMODE_SETTINGS = 5029,
            CLIENT_ACTION_PING_DOWNSTREAM = 5030,
            CLIENT_ACTION_SET_IN_GAME_CURRENCY_EXCHANGE_RATE = 5032,
            CLIENT_ACTION_REQUEST_GEOFENCE_UPDATES = 5033,
            CLIENT_ACTION_UPDATE_PLAYER_LOCATION = 5034,
            CLIENT_ACTION_GENERATE_GMAP_SIGNED_URL = 5035,
            CLIENT_ACTION_GET_GMAP_SETTINGS = 5036,
            CLIENT_ACTION_REDEEM_SAMSUNG_RECEIPT = 5037,
            CLIENT_ACTION_ADD_NEW_ROUTE = 5038,
            CLIENT_ACTION_GET_OUTSTANDING_WARNINGS = 5039,
            CLIENT_ACTION_ACKNOWLEDGE_WARNINGS = 5040,
            CLIENT_ACTION_SUBMIT_POI_IMAGE = 5041,
            CLIENT_ACTION_SUBMIT_POI_TEXT_METADATA_UPDATE = 5042,
            CLIENT_ACTION_SUBMIT_POI_LOCATION_UPDATE = 5043,
            CLIENT_ACTION_SUBMIT_POI_TAKEDOWN_REQUEST = 5044,
            CLIENT_ACTION_GET_WEB_TOKEN_ACTION = 5045,
            CLIENT_ACTION_GET_ADVENTURE_SYNC_SETTINGS = 5046,
            CLIENT_ACTION_UPDATE_ADVENTURE_SYNC_SETTINGS = 5047,
            SOCIAL_ACTION_SEARCH_PLAYER = 10000,
            SOCIAL_ACTION_SEND_FRIEND_INVITE = 10002,
            SOCIAL_ACTION_CANCEL_FRIEND_INVITE = 10003,
            SOCIAL_ACTION_ACCEPT_FRIEND_INVITE = 10004,
            SOCIAL_ACTION_DECLINE_FRIEND_INVITE = 10005,
            SOCIAL_ACTION_LIST_FRIENDS = 10006,
            SOCIAL_ACTION_LIST_OUTGOING_FRIEND_INVITES = 10007,
            SOCIAL_ACTION_LIST_INCOMING_FRIEND_INVITES = 10008,
            SOCIAL_ACTION_REMOVE_FRIEND = 10009,
            SOCIAL_ACTION_LIST_FRIEND_STATUS = 10010,
            SOCIAL_ACTION_SEND_FACEBOOK_FRIEND_INVITE = 10011,
            SOCIAL_ACTION_IS_MY_FRIEND = 10012,
            SOCIAL_ACTION_CREATE_INVITE_CODE = 10013,
            SOCIAL_ACTION_GET_FACEBOOK_FRIEND_LIST = 10014,
            SOCIAL_ACTION_UPDATE_FACEBOOK_STATUS = 10015,
            SOCIAL_ACTION_SAVE_PLAYER_SETTINGS = 10016,
            SOCIAL_ACTION_GET_PLAYER_SETTINGS = 10017,
            SOCIAL_ACTION_GET_NIANTIC_FRIEND_LIST_DELETED = 10018,
            SOCIAL_ACTION_GET_NIANTIC_FRIEND_DETAILS_DELETED = 10019,
            SOCIAL_ACTION_SEND_NIANTIC_FRIEND_INVITE_DELETED = 10020,
            SOCIAL_ACTION_SET_ACCOUNT_SETTINGS = 10021,
            SOCIAL_ACTION_GET_ACCOUNT_SETTINGS = 10022,
            SOCIAL_ACTION_REGISTER_PUSH_NOTIFICATION = 10101,
            SOCIAL_ACTION_UNREGISTER_PUSH_NOTIFICATION = 10102,
            SOCIAL_ACTION_UPDATE_NOTIFICATION = 10103,
            SOCIAL_ACTION_OPT_OUT_PUSH_NOTIFICATION_CATEGORY = 10104,
            SOCIAL_ACTION_GET_INBOX = 10105,
            SOCIAL_ACTION_GET_SIGNED_URL = 10201,
            SOCIAL_ACTION_SUBMIT_IMAGE = 10202,
            SOCIAL_ACTION_GET_PHOTOS = 10203,
            SOCIAL_ACTION_DELETE_PHOTO = 10204,
            SOCIAL_ACTION_UPDATE_PROFILE_V2 = 20001,
            SOCIAL_ACTION_UPDATE_FRIENDSHIP_V2 = 20002,
            SOCIAL_ACTION_GET_PROFILE_V2 = 20003,
            SOCIAL_ACTION_INVITE_GAME_V2 = 20004,
            SOCIAL_ACTION_SEND_FRIEND_INVITE_V2 = 20005,
            SOCIAL_ACTION_LIST_FRIENDS_V2 = 20006,
            SOCIAL_ACTION_GET_FRIEND_DETAILS_V2 = 20007,
            SOCIAL_ACTION_GET_CLIENT_FEATURE_FLAGS_V2 = 20008,
            PROXY_CHAT_ACTION = 660000,
            ****,
            AND_MORE...
    */
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

                if (!Object.values(RpcMethod).includes(parseInt(message['type']))) {
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
        let remoteConfigData = [];
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
                case RpcMethod.UnSet:
                case RpcMethod.DemoSocial:
                    return res.sendStatus(400);
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
                                    // console.debug('[Raw] GetInventoryData:', data);
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
                case RpcMethod.UnUsed_GetHoloholoInventoryOutProto:
                    if (config.dataparser.parse.inventory) {
                        try {
                            let ghi = POGOProtos.Rpc.GetHoloholoInventoryOutProto.decode(base64_decode(data));
                            if (ghi) {
                                if (ghi.success) {
                                    let data = ghi.inventory_delta;
                                    //TODO: Need //comment
                                    // console.debug('[Raw] GetInventoryData:', data);
                                    inventoryData.push(data);
                                }
                            } else {
                                console.error('[Raw] Malformed UnUsed_GetHoloholoInventoryOutProto');
                            }
                        } catch (err) {
                            console.error('[Raw] Unable to decode UnUsed_GetHoloholoInventoryOutProto');
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
                case RpcMethod.GetRemoteConfigVersionsOutProto:
                    if (config.dataparser.parse.remoteconfig) {
                        try {
                            let rc = POGOProtos.Rpc.GetRemoteConfigVersionsOutProto.decode(base64_decode(data));
                            if (rc) {
                                if (rc.result === POGOProtos.Rpc.GetRemoteConfigVersionsOutProto.SUCCESS) {
                                    //TODO: Need //comment
                                    console.debug('[Raw] GetRemoteConfigData:', rc);
                                    remoteConfigData.push(rc);
                                }
                            } else {
                                console.error('[Raw] Malformed GetRemoteConfigVersionsOutProto');
                            }
                        } catch (err) {
                            console.error('[Raw] Unable to decode GetRemoteConfigVersionsOutProto');
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
                                cells.forEach(cell => delete this.emptyCells[cell]);
                                isEmptyGMO = false;
                            }
                        } else {
                            console.error('[Raw] Malformed GetMapObjectsOutProto');
                        }
                    } catch (err) {
                        console.error(`[Raw] Unable to decode GetMapObjectsOutProto ${err.message}`);
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

        let total = wildPokemons.length + nearbyPokemons.length + clientWeathers.length
            + forts.length + fortDetails.length + gymInfos.length
            + quests.length + encounters.length + cells.length
            + inventoryData.length + gameMasterData.length + getItemTemplatesData.length
            + settingsData.length + assetDigestData.length + remoteConfigData.length;
        let startTime = process.hrtime();
        let jobs = [];

        if (playerData.length > 0) {
            jobs = this.consumers[username].updatePlayerData(playerData);
        }

        if (clientWeathers.length > 0) {
            jobs.push(this.consumers[username].updateWeather(clientWeathers, username));
            jobs.push(ipcWorker.reportWeather(username, clientWeathers.map(
                (conditions) => [conditions.cell.toString(), conditions.data.gameplay_weather.gameplay_condition])));
        }

        if (cells.length > 0) {
            await this.consumers[username].updateCells(cells);
        }

        if (forts.length > 0) {
            await this.consumers[username].updateForts(forts);
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
        if (ms >= 1000) {
            (ms >= 5000 ? console.info : console.debug)(`[Raw] [${uuid}] Update Count: ${total} parsed in ${ms} ms`);
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
