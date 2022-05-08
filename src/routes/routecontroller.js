'use strict';

const POGOProtos = require('pogo-protos');

const config = require('../services/config.js');
const Consumer = require('../services/consumer.js');
const ipcWorker = require('../ipc/worker.js');
const Account = require('../models/account.js');
const Device = require('../models/device.js');
const Instance = require('../models/instance.js');
const { sendResponse, base64_decode } = require('../services/utils.js');

/*
const requestMessagesResponses = {	
    REQUEST_TYPE_METHOD_UNSET: [0, null, null],
	REQUEST_TYPE_METHOD_GET_PLAYER: [2, POGOProtos.Rpc.GetPlayerProto, POGOProtos.Rpc.GetPlayerOutProto],
	REQUEST_TYPE_METHOD_GET_HOLOHOLO_INVENTORY: [4, POGOProtos.Rpc.GetHoloholoInventoryProto, POGOProtos.Rpc.GetHoloholoInventoryOutProto],
	REQUEST_TYPE_METHOD_DOWNLOAD_SETTINGS: [5, POGOProtos.Rpc.DownloadSettingsActionProto, POGOProtos.Rpc.DownloadSettingsResponseProto],
	REQUEST_TYPE_METHOD_DOWNLOAD_ITEM_TEMPLATES: [6, POGOProtos.Rpc.GetGameMasterClientTemplatesProto, POGOProtos.Rpc.GetGameMasterClientTemplatesOutProto],
	REQUEST_TYPE_METHOD_DOWNLOAD_REMOTE_CONFIG_VERSION: [7, POGOProtos.Rpc.GetRemoteConfigVersionsProto, POGOProtos.Rpc.GetRemoteConfigVersionsOutProto],
	REQUEST_TYPE_METHOD_REGISTER_BACKGROUND_DEVICE: [8, POGOProtos.Rpc.RegisterBackgroundDeviceActionProto, POGOProtos.Rpc.RegisterBackgroundDeviceResponseProto],
	REQUEST_TYPE_METHOD_GET_PLAYER_DAY: [9, POGOProtos.Rpc.GetPlayerDayProto, POGOProtos.Rpc.GetPlayerDayOutProto],
	REQUEST_TYPE_METHOD_ACKNOWLEDGE_PUNISHMENT: [10, POGOProtos.Rpc.AcknowledgePunishmentProto, POGOProtos.Rpc.AcknowledgePunishmentOutProto],
	REQUEST_TYPE_METHOD_GET_SERVER_TIME: [11, POGOProtos.Rpc.GetServerTimeProto, POGOProtos.Rpc.GetServerTimeOutProto],
	REQUEST_TYPE_METHOD_GET_LOCAL_TIME: [12, POGOProtos.Rpc.GetLocalTimeProto, POGOProtos.Rpc.GetLocalTimeOutProto],
	REQUEST_TYPE_METHOD_FORT_SEARCH: [101, POGOProtos.Rpc.FortSearchProto, POGOProtos.Rpc.FortSearchOutProto],
	REQUEST_TYPE_METHOD_ENCOUNTER: [102, POGOProtos.Rpc.EncounterProto, POGOProtos.Rpc.EncounterOutProto],
	REQUEST_TYPE_METHOD_CATCH_POKEMON: [103, POGOProtos.Rpc.CatchPokemonProto, POGOProtos.Rpc.CatchPokemonOutProto],
	REQUEST_TYPE_METHOD_FORT_DETAILS: [104, POGOProtos.Rpc.FortDetailsProto, POGOProtos.Rpc.FortDetailsOutProto],
	REQUEST_TYPE_METHOD_GET_MAP_OBJECTS: [106, POGOProtos.Rpc.GetMapObjectsProto, POGOProtos.Rpc.GetMapObjectsOutProto],
	REQUEST_TYPE_METHOD_FORT_DEPLOY_POKEMON: [110, POGOProtos.Rpc.FortDeployProto, POGOProtos.Rpc.FortDeployOutProto],
	REQUEST_TYPE_METHOD_FORT_RECALL_POKEMON: [111, POGOProtos.Rpc.FortRecallProto, POGOProtos.Rpc.FortRecallOutProto],
	REQUEST_TYPE_METHOD_RELEASE_POKEMON: [112, POGOProtos.Rpc.ReleasePokemonProto, POGOProtos.Rpc.ReleasePokemonOutProto],
	REQUEST_TYPE_METHOD_USE_ITEM_POTION: [113, POGOProtos.Rpc.UseItemPotionProto, POGOProtos.Rpc.UseItemPotionOutProto],
	REQUEST_TYPE_METHOD_USE_ITEM_CAPTURE: [114, POGOProtos.Rpc.UseItemCaptureProto, POGOProtos.Rpc.UseItemCaptureOutProto],
	REQUEST_TYPE_METHOD_USE_ITEM_FLEE: [115, null, null],
	REQUEST_TYPE_METHOD_USE_ITEM_REVIVE: [116, POGOProtos.Rpc.UseItemReviveProto, POGOProtos.Rpc.UseItemReviveOutProto],
	REQUEST_TYPE_METHOD_GET_PLAYER_PROFILE: [121, POGOProtos.Rpc.PlayerProfileProto, POGOProtos.Rpc.PlayerProfileOutProto],
	REQUEST_TYPE_METHOD_EVOLVE_POKEMON: [125, POGOProtos.Rpc.EvolvePokemonProto, POGOProtos.Rpc.EvolvePokemonOutProto],
	REQUEST_TYPE_METHOD_GET_HATCHED_EGGS: [126, POGOProtos.Rpc.GetHatchedEggsProto, POGOProtos.Rpc.GetHatchedEggsOutProto],
	REQUEST_TYPE_METHOD_ENCOUNTER_TUTORIAL_COMPLETE: [127, POGOProtos.Rpc.EncounterTutorialCompleteProto, POGOProtos.Rpc.EncounterTutorialCompleteOutProto],
	REQUEST_TYPE_METHOD_LEVEL_UP_REWARDS: [128, POGOProtos.Rpc.LevelUpRewardsProto, POGOProtos.Rpc.LevelUpRewardsOutProto],
	REQUEST_TYPE_METHOD_CHECK_AWARDED_BADGES: [129, POGOProtos.Rpc.CheckAwardedBadgesProto, POGOProtos.Rpc.CheckAwardedBadgesOutProto],
	REQUEST_TYPE_METHOD_RECYCLE_INVENTORY_ITEM: [137, POGOProtos.Rpc.RecycleItemProto, POGOProtos.Rpc.RecycleItemOutProto],
	REQUEST_TYPE_METHOD_COLLECT_DAILY_BONUS: [138, POGOProtos.Rpc.CollectDailyBonusProto, POGOProtos.Rpc.CollectDailyBonusOutProto],
	REQUEST_TYPE_METHOD_USE_ITEM_XP_BOOST: [139, POGOProtos.Rpc.UseItemXpBoostProto, POGOProtos.Rpc.UseItemXpBoostOutProto],
	REQUEST_TYPE_METHOD_USE_ITEM_EGG_INCUBATOR: [140, POGOProtos.Rpc.UseItemEggIncubatorProto, POGOProtos.Rpc.UseItemEggIncubatorOutProto],
	REQUEST_TYPE_METHOD_USE_INCENSE: [141, POGOProtos.Rpc.UseIncenseActionProto, POGOProtos.Rpc.UseIncenseActionOutProto],
	REQUEST_TYPE_METHOD_GET_INCENSE_POKEMON: [142, POGOProtos.Rpc.GetIncensePokemonProto, POGOProtos.Rpc.GetIncensePokemonOutProto],
	REQUEST_TYPE_METHOD_INCENSE_ENCOUNTER: [143, POGOProtos.Rpc.IncenseEncounterProto, POGOProtos.Rpc.IncenseEncounterOutProto],
	REQUEST_TYPE_METHOD_ADD_FORT_MODIFIER: [144, POGOProtos.Rpc.AddFortModifierProto, POGOProtos.Rpc.AddFortModifierOutProto],
	REQUEST_TYPE_METHOD_DISK_ENCOUNTER: [145, POGOProtos.Rpc.DiskEncounterProto, POGOProtos.Rpc.DiskEncounterOutProto],
	REQUEST_TYPE_METHOD_UPGRADE_POKEMON: [147, POGOProtos.Rpc.UpgradePokemonProto, POGOProtos.Rpc.UpgradePokemonOutProto],
	REQUEST_TYPE_METHOD_SET_FAVORITE_POKEMON: [148, POGOProtos.Rpc.SetFavoritePokemonProto, POGOProtos.Rpc.SetFavoritePokemonOutProto],
	REQUEST_TYPE_METHOD_NICKNAME_POKEMON: [149, POGOProtos.Rpc.NicknamePokemonProto, POGOProtos.Rpc.NicknamePokemonOutProto],
	REQUEST_TYPE_METHOD_EQUIP_BADGE: [150, POGOProtos.Rpc.EquipBadgeProto, POGOProtos.Rpc.EquipBadgeOutProto],
	REQUEST_TYPE_METHOD_SET_CONTACT_SETTINGS: [151, POGOProtos.Rpc.SetContactSettingsProto, POGOProtos.Rpc.SetContactSettingsOutProto],
	REQUEST_TYPE_METHOD_SET_BUDDY_POKEMON: [152, POGOProtos.Rpc.SetBuddyPokemonProto, POGOProtos.Rpc.SetBuddyPokemonOutProto],
	REQUEST_TYPE_METHOD_GET_BUDDY_WALKED: [153, POGOProtos.Rpc.GetBuddyWalkedProto, POGOProtos.Rpc.GetBuddyWalkedOutProto],
	REQUEST_TYPE_METHOD_USE_ITEM_ENCOUNTER: [154, POGOProtos.Rpc.UseItemEncounterProto, POGOProtos.Rpc.UseItemEncounterOutProto],
	REQUEST_TYPE_METHOD_GYM_DEPLOY: [155, POGOProtos.Rpc.GymDeployProto, POGOProtos.Rpc.GymDeployOutProto],
	REQUEST_TYPE_METHOD_GYM_GET_INFO: [156, POGOProtos.Rpc.GymGetInfoProto, POGOProtos.Rpc.GymGetInfoOutProto],
	REQUEST_TYPE_METHOD_GYM_START_SESSION: [157, POGOProtos.Rpc.GymStartSessionProto, POGOProtos.Rpc.GymStartSessionOutProto],
	REQUEST_TYPE_METHOD_GYM_BATTLE_ATTACK: [158, POGOProtos.Rpc.GymBattleAttackProto, POGOProtos.Rpc.GymBattleAttackOutProto],
	REQUEST_TYPE_METHOD_JOIN_LOBBY: [159, POGOProtos.Rpc.JoinLobbyProto, POGOProtos.Rpc.JoinLobbyOutProto],
	REQUEST_TYPE_METHOD_LEAVE_LOBBY: [160, POGOProtos.Rpc.LeaveLobbyProto, POGOProtos.Rpc.LeaveLobbyOutProto],
	REQUEST_TYPE_METHOD_SET_LOBBY_VISIBILITY: [161, POGOProtos.Rpc.SetLobbyVisibilityProto, POGOProtos.Rpc.SetLobbyVisibilityOutProto],
	REQUEST_TYPE_METHOD_SET_LOBBY_POKEMON: [162, POGOProtos.Rpc.SetLobbyPokemonProto, POGOProtos.Rpc.SetLobbyPokemonOutProto],
	REQUEST_TYPE_METHOD_GET_RAID_DETAILS: [163, POGOProtos.Rpc.GetRaidDetailsProto, POGOProtos.Rpc.GetRaidDetailsOutProto],
	REQUEST_TYPE_METHOD_GYM_FEED_POKEMON: [164, POGOProtos.Rpc.GymFeedPokemonProto, POGOProtos.Rpc.GymFeedPokemonOutProto],
	REQUEST_TYPE_METHOD_START_RAID_BATTLE: [165, POGOProtos.Rpc.StartRaidBattleProto, POGOProtos.Rpc.StartRaidBattleOutProto],
	REQUEST_TYPE_METHOD_ATTACK_RAID: [166, POGOProtos.Rpc.AttackRaidBattleProto, POGOProtos.Rpc.AttackRaidBattleOutProto],
	REQUEST_TYPE_METHOD_AWARD_POKECOIN: [167, null, null],
	REQUEST_TYPE_METHOD_USE_ITEM_STARDUST_BOOST: [168, POGOProtos.Rpc.UseItemStardustBoostProto, POGOProtos.Rpc.UseItemStardustBoostOutProto],
	REQUEST_TYPE_METHOD_REASSIGN_PLAYER: [169, POGOProtos.Rpc.ReassignPlayerProto, POGOProtos.Rpc.ReassignPlayerOutProto],
	REQUEST_TYPE_METHOD_REDEEM_POI_PASSCODE: [170, null, null],
	REQUEST_TYPE_METHOD_CONVERT_CANDY_TO_XL_CANDY: [171, POGOProtos.Rpc.ConvertCandyToXlCandyProto, POGOProtos.Rpc.ConvertCandyToXlCandyOutProto],
	REQUEST_TYPE_METHOD_IS_SKU_AVAILABLE: [172, POGOProtos.Rpc.IsSkuAvailableProto, POGOProtos.Rpc.IsSkuAvailableOutProto],
	REQUEST_TYPE_METHOD_GET_ASSET_DIGEST: [300, POGOProtos.Rpc.AssetDigestRequestProto, POGOProtos.Rpc.AssetDigestOutProto],
	REQUEST_TYPE_METHOD_GET_DOWNLOAD_URLS: [301, POGOProtos.Rpc.DownloadUrlRequestProto, POGOProtos.Rpc.DownloadUrlOutProto],
	REQUEST_TYPE_METHOD_GET_ASSET_VERSION: [302, POGOProtos.Rpc.AssetVersionProto, POGOProtos.Rpc.AssetVersionOutProto],
	REQUEST_TYPE_METHOD_CLAIM_CODENAME: [403, POGOProtos.Rpc.ClaimCodenameRequestProto, null],
	REQUEST_TYPE_METHOD_SET_AVATAR: [404, POGOProtos.Rpc.SetAvatarProto, POGOProtos.Rpc.SetAvatarOutProto],
	REQUEST_TYPE_METHOD_SET_PLAYER_TEAM: [405, POGOProtos.Rpc.SetPlayerTeamProto, POGOProtos.Rpc.SetPlayerTeamOutProto],
	REQUEST_TYPE_METHOD_MARK_TUTORIAL_COMPLETE: [406, POGOProtos.Rpc.MarkTutorialCompleteProto, POGOProtos.Rpc.MarkTutorialCompleteOutProto],
	REQUEST_TYPE_METHOD_UPDATE_PERFORMANCE_METRICS: [407, null, null],
	REQUEST_TYPE_METHOD_CHECK_CHALLENGE: [600, POGOProtos.Rpc.CheckChallengeProto, POGOProtos.Rpc.CheckChallengeOutProto],
	REQUEST_TYPE_METHOD_VERIFY_CHALLENGE: [601, POGOProtos.Rpc.VerifyChallengeProto, POGOProtos.Rpc.VerifyChallengeOutProto],
	REQUEST_TYPE_METHOD_ECHO: [666, POGOProtos.Rpc.EchoProto, POGOProtos.Rpc.EchoOutProto],
	REQUEST_TYPE_METHOD_SFIDA_REGISTRATION: [800, POGOProtos.Rpc.RegisterSfidaRequest, POGOProtos.Rpc.RegisterSfidaResponse],
	REQUEST_TYPE_METHOD_SFIDA_ACTION_LOG: [801, null, null],
	REQUEST_TYPE_METHOD_SFIDA_CERTIFICATION: [802, POGOProtos.Rpc.SfidaCertificationRequest, POGOProtos.Rpc.SfidaCertificationResponse],
	REQUEST_TYPE_METHOD_SFIDA_UPDATE: [803, POGOProtos.Rpc.SfidaUpdateRequest, POGOProtos.Rpc.SfidaUpdateResponse],
	REQUEST_TYPE_METHOD_SFIDA_ACTION: [804, null, null],
	REQUEST_TYPE_METHOD_SFIDA_DOWSER: [805, POGOProtos.Rpc.SfidaDowserRequest, POGOProtos.Rpc.SfidaDowserResponse],
	REQUEST_TYPE_METHOD_SFIDA_CAPTURE: [806, POGOProtos.Rpc.SfidaCaptureRequest, POGOProtos.Rpc.SfidaCaptureResponse],
	REQUEST_TYPE_METHOD_LIST_AVATAR_CUSTOMIZATIONS: [807, POGOProtos.Rpc.ListAvatarCustomizationsProto, POGOProtos.Rpc.ListAvatarCustomizationsOutProto],
	REQUEST_TYPE_METHOD_SET_AVATAR_ITEM_AS_VIEWED: [808, POGOProtos.Rpc.SetAvatarItemAsViewedProto, POGOProtos.Rpc.SetAvatarItemAsViewedOutProto],
	REQUEST_TYPE_METHOD_GET_INBOX: [809, POGOProtos.Rpc.GetInboxV2Proto, POGOProtos.Rpc.GetInboxOutProto],
	REQUEST_TYPE_METHOD_LIST_GYM_BADGES: [811, POGOProtos.Rpc.ListGymBadgesProto, POGOProtos.Rpc.ListGymBadgesOutProto],
	REQUEST_TYPE_METHOD_GET_GYM_BADGE_DETAILS: [812, POGOProtos.Rpc.GetGymBadgeDetailsProto, POGOProtos.Rpc.GetGymBadgeDetailsOutProto],
	REQUEST_TYPE_METHOD_USE_ITEM_MOVE_REROLL: [813, POGOProtos.Rpc.UseItemMoveRerollProto, POGOProtos.Rpc.UseItemMoveRerollOutProto],
	REQUEST_TYPE_METHOD_USE_ITEM_RARE_CANDY: [814, POGOProtos.Rpc.UseItemRareCandyProto, POGOProtos.Rpc.UseItemRareCandyOutProto],
	REQUEST_TYPE_METHOD_AWARD_FREE_RAID_TICKET: [815, POGOProtos.Rpc.AwardFreeRaidTicketProto, POGOProtos.Rpc.AwardFreeRaidTicketOutProto],
	REQUEST_TYPE_METHOD_FETCH_ALL_NEWS: [816, POGOProtos.Rpc.FetchAllNewsProto, POGOProtos.Rpc.FetchAllNewsOutProto],
	REQUEST_TYPE_METHOD_MARK_READ_NEWS_ARTICLE: [817, POGOProtos.Rpc.MarkReadNewsArticleProto, POGOProtos.Rpc.MarkReadNewsArticleOutProto],
	REQUEST_TYPE_METHOD_GET_PLAYER_DISPLAY_INFO: [818, POGOProtos.Rpc.GetPlayerSettingsProto, POGOProtos.Rpc.GetPlayerSettingsOutProto],
	REQUEST_TYPE_METHOD_BELUGA_TRANSACTION_START: [819, POGOProtos.Rpc.BelugaTransactionStartProto, POGOProtos.Rpc.BelugaTransactionStartOutProto],
	REQUEST_TYPE_METHOD_BELUGA_TRANSACTION_COMPLETE: [820, POGOProtos.Rpc.BelugaTransactionCompleteProto, POGOProtos.Rpc.BelugaTransactionCompleteOutProto],
	REQUEST_TYPE_METHOD_SFIDA_ASSOCIATE: [822, POGOProtos.Rpc.SfidaAssociateRequest, POGOProtos.Rpc.SfidaAssociateResponse],
	REQUEST_TYPE_METHOD_SFIDA_CHECK_PAIRING: [823, POGOProtos.Rpc.SfidaCheckPairingRequest, POGOProtos.Rpc.SfidaCheckPairingResponse],
	REQUEST_TYPE_METHOD_SFIDA_DISASSOCIATE: [824, POGOProtos.Rpc.SfidaDisassociateRequest, POGOProtos.Rpc.SfidaDisassociateResponse],
	REQUEST_TYPE_METHOD_WAINA_SUBMIT_SLEEP_DATA: [826, POGOProtos.Rpc.WainaSubmitSleepDataRequest, POGOProtos.Rpc.WainaSubmitSleepDataResponse],
	REQUEST_TYPE_METHOD_GET_NEW_QUESTS: [900, POGOProtos.Rpc.GetNewQuestsProto, POGOProtos.Rpc.GetNewQuestsOutProto],
	REQUEST_TYPE_METHOD_GET_QUEST_DETAILS: [901, POGOProtos.Rpc.GetQuestDetailsProto, POGOProtos.Rpc.GetQuestDetailsOutProto],
	REQUEST_TYPE_METHOD_COMPLETE_QUEST: [902, null, null],
	REQUEST_TYPE_METHOD_REMOVE_QUEST: [903, POGOProtos.Rpc.RemoveQuestProto, POGOProtos.Rpc.RemoveQuestOutProto],
	REQUEST_TYPE_METHOD_QUEST_ENCOUNTER: [904, POGOProtos.Rpc.QuestEncounterProto, POGOProtos.Rpc.QuestEncounterOutProto],
	REQUEST_TYPE_METHOD_COMPLETE_QUEST_STAMP_CARD: [905, null, null],
	REQUEST_TYPE_METHOD_PROGRESS_QUEST: [906, POGOProtos.Rpc.ProgressQuestProto, POGOProtos.Rpc.ProgressQuestOutProto],
	REQUEST_TYPE_METHOD_START_QUEST_INCIDENT: [907, null, null],
	REQUEST_TYPE_METHOD_READ_QUEST_DIALOG: [908, null, null],
	REQUEST_TYPE_METHOD_SEND_GIFT: [950, POGOProtos.Rpc.SendGiftProto, POGOProtos.Rpc.SendGiftOutProto],
	REQUEST_TYPE_METHOD_OPEN_GIFT: [951, POGOProtos.Rpc.OpenGiftProto, POGOProtos.Rpc.OpenGiftOutProto],
	REQUEST_TYPE_METHOD_GIFT_DETAILS: [952, null, null],
	REQUEST_TYPE_METHOD_DELETE_GIFT: [953, POGOProtos.Rpc.DeleteGiftProto, POGOProtos.Rpc.DeleteGiftOutProto],
	REQUEST_TYPE_METHOD_SAVE_PLAYER_SNAPSHOT: [954, POGOProtos.Rpc.SavePlayerSnapshotProto, POGOProtos.Rpc.SavePlayerSnapshotOutProto],
	REQUEST_TYPE_METHOD_GET_FRIENDSHIP_MILESTONE_REWARDS: [955, null, null],
	REQUEST_TYPE_METHOD_CHECK_SEND_GIFT: [956, POGOProtos.Rpc.CheckSendGiftProto, POGOProtos.Rpc.CheckSendGiftOutProto],
	REQUEST_TYPE_METHOD_SET_FRIEND_NICKNAME: [957, POGOProtos.Rpc.SetFriendNicknameProto, POGOProtos.Rpc.SetFriendNicknameOutProto],
	REQUEST_TYPE_METHOD_DELETE_GIFT_FROM_INVENTORY: [958, POGOProtos.Rpc.DeleteGiftFromInventoryProto, POGOProtos.Rpc.DeleteGiftFromInventoryOutProto],
	REQUEST_TYPE_METHOD_SAVE_SOCIAL_PLAYER_SETTINGS: [959, POGOProtos.Rpc.SaveSocialPlayerSettingsProto, POGOProtos.Rpc.SaveSocialPlayerSettingsOutProto],
	REQUEST_TYPE_METHOD_SHARE_EX_RAID_PASS: [960, POGOProtos.Rpc.ShareExRaidPassProto, POGOProtos.Rpc.ShareExRaidPassOutProto],
	REQUEST_TYPE_METHOD_CHECK_SHARE_EX_RAID_PASS: [961, POGOProtos.Rpc.CheckShareExRaidPassProto, POGOProtos.Rpc.CheckShareExRaidPassOutProto],
	REQUEST_TYPE_METHOD_DECLINE_SHARED_EX_RAID_PASS: [962, POGOProtos.Rpc.DeclineExRaidPassProto, POGOProtos.Rpc.DeclineExRaidPassOutProto],
	REQUEST_TYPE_METHOD_OPEN_TRADING: [970, POGOProtos.Rpc.OpenTradingProto, POGOProtos.Rpc.OpenTradingOutProto],
	REQUEST_TYPE_METHOD_UPDATE_TRADING: [971, POGOProtos.Rpc.UpdateTradingProto, POGOProtos.Rpc.UpdateTradingOutProto],
	REQUEST_TYPE_METHOD_CONFIRM_TRADING: [972, POGOProtos.Rpc.ConfirmTradingProto, POGOProtos.Rpc.ConfirmTradingOutProto],
	REQUEST_TYPE_METHOD_CANCEL_TRADING: [973, POGOProtos.Rpc.CancelTradingProto, POGOProtos.Rpc.CancelTradingOutProto],
	REQUEST_TYPE_METHOD_GET_TRADING: [974, POGOProtos.Rpc.GetTradingProto, POGOProtos.Rpc.GetTradingOutProto],
	REQUEST_TYPE_METHOD_GET_FITNESS_REWARDS: [980, POGOProtos.Rpc.GetFitnessRewardsProto, POGOProtos.Rpc.GetFitnessRewardsOutProto],
	REQUEST_TYPE_METHOD_GET_COMBAT_PLAYER_PROFILE: [990, POGOProtos.Rpc.GetCombatPlayerProfileProto, POGOProtos.Rpc.GetCombatPlayerProfileOutProto],
	REQUEST_TYPE_METHOD_GENERATE_COMBAT_CHALLENGE_ID: [991, POGOProtos.Rpc.GenerateCombatChallengeIdProto, POGOProtos.Rpc.GenerateCombatChallengeIdOutProto],
	REQUEST_TYPE_METHOD_CREATE_COMBAT_CHALLENGE: [992, POGOProtos.Rpc.CreateCombatChallengeProto, POGOProtos.Rpc.CreateCombatChallengeOutProto],
	REQUEST_TYPE_METHOD_OPEN_COMBAT_CHALLENGE: [993, POGOProtos.Rpc.OpenCombatChallengeProto, POGOProtos.Rpc.OpenCombatChallengeOutProto],
	REQUEST_TYPE_METHOD_GET_COMBAT_CHALLENGE: [994, POGOProtos.Rpc.GetCombatChallengeProto, POGOProtos.Rpc.GetCombatChallengeOutProto],
	REQUEST_TYPE_METHOD_ACCEPT_COMBAT_CHALLENGE: [995, POGOProtos.Rpc.AcceptCombatChallengeProto, POGOProtos.Rpc.AcceptCombatChallengeOutProto],
	REQUEST_TYPE_METHOD_DECLINE_COMBAT_CHALLENGE: [996, POGOProtos.Rpc.DeclineCombatChallengeProto, POGOProtos.Rpc.DeclineCombatChallengeOutProto],
	REQUEST_TYPE_METHOD_CANCEL_COMBAT_CHALLENGE: [997, POGOProtos.Rpc.CancelCombatChallengeProto, POGOProtos.Rpc.CancelCombatChallengeOutProto],
	REQUEST_TYPE_METHOD_SUBMIT_COMBAT_CHALLENGE_POKEMONS: [998, POGOProtos.Rpc.SubmitCombatChallengePokemonsProto, POGOProtos.Rpc.SubmitCombatChallengePokemonsOutProto],
	REQUEST_TYPE_METHOD_SAVE_COMBAT_PLAYER_PREFERENCES: [999, POGOProtos.Rpc.SaveCombatPlayerPreferencesProto, POGOProtos.Rpc.SaveCombatPlayerPreferencesOutProto],
	REQUEST_TYPE_METHOD_OPEN_COMBAT_SESSION: [1000, POGOProtos.Rpc.OpenCombatSessionProto, POGOProtos.Rpc.OpenCombatSessionOutProto],
	REQUEST_TYPE_METHOD_UPDATE_COMBAT: [1001, POGOProtos.Rpc.UpdateCombatProto, POGOProtos.Rpc.UpdateCombatOutProto],
	REQUEST_TYPE_METHOD_QUIT_COMBAT: [1002, POGOProtos.Rpc.QuitCombatProto, POGOProtos.Rpc.QuitCombatOutProto],
	REQUEST_TYPE_METHOD_GET_COMBAT_RESULTS: [1003, POGOProtos.Rpc.GetCombatResultsProto, POGOProtos.Rpc.GetCombatResultsOutProto],
	REQUEST_TYPE_METHOD_UNLOCK_SPECIAL_MOVE: [1004, POGOProtos.Rpc.UnlockPokemonMoveProto, POGOProtos.Rpc.UnlockPokemonMoveOutProto],
	REQUEST_TYPE_METHOD_GET_NPC_COMBAT_REWARDS: [1005, POGOProtos.Rpc.GetNpcCombatRewardsProto, POGOProtos.Rpc.GetNpcCombatRewardsOutProto],
	REQUEST_TYPE_METHOD_COMBAT_FRIEND_REQUEST: [1006, POGOProtos.Rpc.CombatFriendRequestProto, POGOProtos.Rpc.CombatFriendRequestOutProto],
	REQUEST_TYPE_METHOD_OPEN_NPC_COMBAT_SESSION: [1007, POGOProtos.Rpc.OpenNpcCombatSessionProto, POGOProtos.Rpc.OpenNpcCombatSessionOutProto],
	REQUEST_TYPE_METHOD_START_TUTORIAL_ACTION: [1008, POGOProtos.Rpc.StartTutorialProto, POGOProtos.Rpc.StartTutorialOutProto],
	REQUEST_TYPE_METHOD_GET_TUTORIAL_EGG_ACTION: [1009, POGOProtos.Rpc.GetTutorialEggProto, POGOProtos.Rpc.GetTutorialEggOutProto],
	REQUEST_TYPE_METHOD_SEND_PROBE: [1020, POGOProtos.Rpc.SendProbeProto, POGOProtos.Rpc.SendProbeOutProto],
	REQUEST_TYPE_METHOD_PROBE_DATA: [1021, null, null],
	REQUEST_TYPE_METHOD_COMBAT_DATA: [1022, null, null],
	REQUEST_TYPE_METHOD_COMBAT_CHALLENGE_DATA: [1023, null, null],
	REQUEST_TYPE_METHOD_CHECK_PHOTOBOMB: [1101, POGOProtos.Rpc.CheckPhotobombProto, POGOProtos.Rpc.CheckPhotobombOutProto],
	REQUEST_TYPE_METHOD_CONFIRM_PHOTOBOMB: [1102, POGOProtos.Rpc.ConfirmPhotobombProto, POGOProtos.Rpc.ConfirmPhotobombOutProto],
	REQUEST_TYPE_METHOD_GET_PHOTOBOMB: [1103, POGOProtos.Rpc.GetPhotobombProto, POGOProtos.Rpc.GetPhotobombOutProto],
	REQUEST_TYPE_METHOD_ENCOUNTER_PHOTOBOMB: [1104, POGOProtos.Rpc.EncounterPhotobombProto, POGOProtos.Rpc.EncounterPhotobombOutProto],
	REQUEST_TYPE_METHOD_GET_SIGNED_GMAP_URL_DEPRECATED: [1105, POGOProtos.Rpc.GetGmapSettingsProto, POGOProtos.Rpc.GetGmapSettingsOutProto],
	REQUEST_TYPE_METHOD_CHANGE_TEAM: [1106, POGOProtos.Rpc.ChangeTeamProto, POGOProtos.Rpc.ChangeTeamOutProto],
	REQUEST_TYPE_METHOD_GET_WEB_TOKEN: [1107, POGOProtos.Rpc.GetWebTokenProto, POGOProtos.Rpc.GetWebTokenOutProto],
	REQUEST_TYPE_METHOD_COMPLETE_SNAPSHOT_SESSION: [1110, POGOProtos.Rpc.CompleteSnapshotSessionProto, POGOProtos.Rpc.CompleteSnapshotSessionOutProto],
	REQUEST_TYPE_METHOD_COMPLETE_WILD_SNAPSHOT_SESSION: [1111, POGOProtos.Rpc.CompleteWildSnapshotSessionProto, POGOProtos.Rpc.CompleteWildSnapshotSessionOutProto],
	REQUEST_TYPE_METHOD_START_INCIDENT: [1200, POGOProtos.Rpc.StartIncidentProto, POGOProtos.Rpc.StartIncidentOutProto],
	REQUEST_TYPE_METHOD_INVASION_COMPLETE_DIALOGUE: [1201, POGOProtos.Rpc.CompleteInvasionDialogueProto, POGOProtos.Rpc.CompleteInvasionDialogueOutProto],
	REQUEST_TYPE_METHOD_INVASION_OPEN_COMBAT_SESSION: [1202, POGOProtos.Rpc.OpenInvasionCombatSessionProto, POGOProtos.Rpc.OpenInvasionCombatSessionOutProto],
	REQUEST_TYPE_METHOD_INVASION_BATTLE_UPDATE: [1203, POGOProtos.Rpc.UpdateInvasionBattleProto, POGOProtos.Rpc.UpdateInvasionBattleOutProto],
	REQUEST_TYPE_METHOD_INVASION_ENCOUNTER: [1204, POGOProtos.Rpc.InvasionEncounterProto, POGOProtos.Rpc.InvasionEncounterOutProto],
	REQUEST_TYPE_METHOD_PURIFY_POKEMON: [1205, POGOProtos.Rpc.PurifyPokemonProto, POGOProtos.Rpc.PurifyPokemonOutProto],
	REQUEST_TYPE_METHOD_GET_ROCKET_BALLOON: [1206, POGOProtos.Rpc.GetRocketBalloonProto, POGOProtos.Rpc.GetRocketBalloonOutProto],
	REQUEST_TYPE_METHOD_START_ROCKET_BALLOON_INCIDENT: [1207, POGOProtos.Rpc.StartRocketBalloonIncidentProto, null],
	REQUEST_TYPE_METHOD_VS_SEEKER_START_MATCHMAKING: [1300, POGOProtos.Rpc.VsSeekerStartMatchmakingProto, POGOProtos.Rpc.VsSeekerStartMatchmakingOutProto],
	REQUEST_TYPE_METHOD_CANCEL_MATCHMAKING: [1301, POGOProtos.Rpc.CancelMatchmakingProto, POGOProtos.Rpc.CancelMatchmakingOutProto],
	REQUEST_TYPE_METHOD_GET_MATCHMAKING_STATUS: [1302, POGOProtos.Rpc.GetMatchmakingStatusProto, POGOProtos.Rpc.GetMatchmakingStatusOutProto],
	REQUEST_TYPE_METHOD_COMPLETE_VS_SEEKER_AND_RESTART_CHARGING: [1303, POGOProtos.Rpc.CompleteVsSeekerAndRestartChargingProto, POGOProtos.Rpc.CompleteVsSeekerAndRestartChargingOutProto],
	REQUEST_TYPE_METHOD_GET_VS_SEEKER_STATUS: [1304, POGOProtos.Rpc.GetVsSeekerStatusProto, POGOProtos.Rpc.GetVsSeekerStatusOutProto],
	REQUEST_TYPE_METHOD_COMPLETE_COMBAT_COMPETITIVE_SEASON_ACTION: [1305, POGOProtos.Rpc.CompleteCompetitiveSeasonProto, POGOProtos.Rpc.CompleteCompetitiveSeasonOutProto],
	REQUEST_TYPE_METHOD_CLAIM_VS_SEEKER_REWARDS: [1306, POGOProtos.Rpc.ClaimVsSeekerRewardsProto, POGOProtos.Rpc.ClaimVsSeekerRewardsOutProto],
	REQUEST_TYPE_METHOD_VS_SEEKER_REWARD_ENCOUNTER: [1307, POGOProtos.Rpc.VsSeekerRewardEncounterProto, POGOProtos.Rpc.VsSeekerRewardEncounterOutProto],
	REQUEST_TYPE_METHOD_ACTIVATE_VS_SEEKER: [1308, POGOProtos.Rpc.ActivateVsSeekerProto, POGOProtos.Rpc.ActivateVsSeekerOutProto],
	REQUEST_TYPE_METHOD_GET_BUDDY_MAP: [1350, POGOProtos.Rpc.BuddyMapProto, POGOProtos.Rpc.BuddyMapOutProto],
	REQUEST_TYPE_METHOD_GET_BUDDY_STATS: [1351, POGOProtos.Rpc.BuddyStatsProto, POGOProtos.Rpc.BuddyStatsOutProto],
	REQUEST_TYPE_METHOD_FEED_BUDDY: [1352, POGOProtos.Rpc.BuddyFeedingProto, POGOProtos.Rpc.BuddyFeedingOutProto],
	REQUEST_TYPE_METHOD_OPEN_BUDDY_GIFT: [1353, POGOProtos.Rpc.OpenBuddyGiftProto, POGOProtos.Rpc.OpenBuddyGiftOutProto],
	REQUEST_TYPE_METHOD_PET_BUDDY: [1354, POGOProtos.Rpc.BuddyPettingProto, POGOProtos.Rpc.BuddyPettingOutProto],
	REQUEST_TYPE_METHOD_GET_BUDDY_HISTORY: [1355, POGOProtos.Rpc.GetBuddyHistoryProto, POGOProtos.Rpc.GetBuddyHistoryOutProto],
	REQUEST_TYPE_METHOD_UPDATE_ROUTE_DRAFT: [1400, POGOProtos.Rpc.UpdateRouteDraftProto, POGOProtos.Rpc.UpdateRouteDraftOutProto],
	REQUEST_TYPE_METHOD_GET_MAP_FORTS: [1401, POGOProtos.Rpc.GetMapFortsProto, POGOProtos.Rpc.GetMapFortsOutProto],
	REQUEST_TYPE_METHOD_SUBMIT_ROUTE_DRAFT: [1402, POGOProtos.Rpc.SubmitRouteDraftProto, POGOProtos.Rpc.SubmitRouteDraftOutProto],
	REQUEST_TYPE_METHOD_GET_PUBLISHED_ROUTES: [1403, POGOProtos.Rpc.GetPublishedRoutesProto, POGOProtos.Rpc.GetPublishedRoutesOutProto],
	REQUEST_TYPE_METHOD_START_ROUTE: [1404, POGOProtos.Rpc.StartRouteProto, POGOProtos.Rpc.StartRouteOutProto],
	REQUEST_TYPE_METHOD_GET_ROUTES: [1405, POGOProtos.Rpc.GetRoutesProto, POGOProtos.Rpc.GetRoutesOutProto],
	REQUEST_TYPE_METHOD_PROGRESS_ROUTE: [1406, POGOProtos.Rpc.ProgressRouteProto, POGOProtos.Rpc.ProgressRouteOutProto],
	REQUEST_TYPE_METHOD_PROCESS_ROUTE_WAYPOINT_INTERACTION: [1407, POGOProtos.Rpc.ProcessRouteWaypointInteractionProto, POGOProtos.Rpc.ProcessRouteWaypointInteractionOutProto],
	REQUEST_TYPE_METHOD_PROCESS_ROUTE_TAPPABLE: [1408, POGOProtos.Rpc.ProcessRouteTappableProto, POGOProtos.Rpc.ProcessRouteTappableOutProto],
	REQUEST_TYPE_METHOD_LIST_ROUTE_BADGES: [1409, POGOProtos.Rpc.ListRouteBadgesProto, POGOProtos.Rpc.ListRouteBadgesOutProto],
	REQUEST_TYPE_METHOD_CANCEL_ROUTE: [1410, POGOProtos.Rpc.CancelRouteProto, POGOProtos.Rpc.CancelRouteOutProto],
	REQUEST_TYPE_METHOD_LIST_ROUTE_STAMPS: [1411, null, null],
	REQUEST_TYPE_METHOD_CREATE_BUDDY_MUTLIPLAYER_SESSION: [1456, POGOProtos.Rpc.CreateBuddyMultiplayerSessionProto, POGOProtos.Rpc.CreateBuddyMultiplayerSessionOutProto],
	REQUEST_TYPE_METHOD_JOIN_BUDDY_MULTIPLAYER_SESSION: [1457, POGOProtos.Rpc.JoinBuddyMultiplayerSessionProto, POGOProtos.Rpc.JoinBuddyMultiplayerSessionOutProto],
	REQUEST_TYPE_METHOD_LEAVE_BUDDY_MULTIPLAYER_SESSION: [1458, POGOProtos.Rpc.LeaveBuddyMultiplayerSessionProto, POGOProtos.Rpc.LeaveBuddyMultiplayerSessionOutProto],
	REQUEST_TYPE_METHOD_GET_TODAY_VIEW: [1501, POGOProtos.Rpc.GetTodayViewProto, POGOProtos.Rpc.GetTodayViewOutProto],
	REQUEST_TYPE_METHOD_MEGA_EVOLVE_POKEMON: [1502, POGOProtos.Rpc.MegaEvolvePokemonProto, POGOProtos.Rpc.MegaEvolvePokemonOutProto],
	REQUEST_TYPE_METHOD_REMOTE_GIFT_PING: [1503, POGOProtos.Rpc.RemoteGiftPingRequestProto, POGOProtos.Rpc.RemoteGiftPingResponseProto],
	REQUEST_TYPE_METHOD_SEND_RAID_INVITATION: [1504, POGOProtos.Rpc.SendRaidInvitationProto, POGOProtos.Rpc.SendRaidInvitationOutProto],
	REQUEST_TYPE_METHOD_GET_DAILY_ENCOUNTER: [1601, POGOProtos.Rpc.GetDailyEncounterProto, POGOProtos.Rpc.GetDailyEncounterOutProto],
	REQUEST_TYPE_METHOD_DAILY_ENCOUNTER: [1602, POGOProtos.Rpc.DailyEncounterProto, POGOProtos.Rpc.DailyEncounterOutProto],
	REQUEST_TYPE_METHOD_OPEN_SPONSORED_GIFT: [1650, POGOProtos.Rpc.OpenSponsoredGiftProto, POGOProtos.Rpc.OpenSponsoredGiftOutProto],
	REQUEST_TYPE_METHOD_SPONSORED_GIFT_REPORT_INTERACTION: [1651, null, null],
	REQUEST_TYPE_METHOD_SAVE_PLAYER_PREFERENCES: [1652, POGOProtos.Rpc.SavePlayerPreferencesProto, POGOProtos.Rpc.SavePlayerPreferencesOutProto],
	REQUEST_TYPE_METHOD_PROFANITY_CHECK: [1653, POGOProtos.Rpc.ProfanityCheckProto, POGOProtos.Rpc.ProfanityCheckOutProto],
	REQUEST_TYPE_METHOD_GET_TIMED_GROUP_CHALLENGE: [1700, POGOProtos.Rpc.GetTimedGroupChallengeProto, POGOProtos.Rpc.GetTimedGroupChallengeOutProto],
	REQUEST_TYPE_METHOD_GET_NINTENDO_ACCOUNT: [1710, POGOProtos.Rpc.GetNintendoAccountProto, POGOProtos.Rpc.GetNintendoAccountOutProto],
	REQUEST_TYPE_METHOD_UNLINK_NINTENDO_ACCOUNT: [1711, POGOProtos.Rpc.UnlinkNintendoAccountProto, POGOProtos.Rpc.UnlinkNintendoAccountOutProto],
	REQUEST_TYPE_METHOD_GET_NINTENDO_OAUTH2_URL: [1712, POGOProtos.Rpc.GetNintendoOAuth2UrlProto, POGOProtos.Rpc.GetNintendoOAuth2UrlOutProto],
	REQUEST_TYPE_METHOD_TRANSFER_TO_POKEMON_HOME: [1713, POGOProtos.Rpc.TransferPokemonToPokemonHomeProto, POGOProtos.Rpc.TransferPokemonToPokemonHomeOutProto],
	REQUEST_TYPE_METHOD_REPORT_AD_FEEDBACK: [1716, POGOProtos.Rpc.ReportAdFeedbackRequest, POGOProtos.Rpc.ReportAdFeedbackResponse],
	REQUEST_TYPE_METHOD_CREATE_POKEMON_TAG: [1717, POGOProtos.Rpc.CreatePokemonTagProto, POGOProtos.Rpc.CreatePokemonTagOutProto],
	REQUEST_TYPE_METHOD_DELETE_POKEMON_TAG: [1718, POGOProtos.Rpc.DeletePokemonTagProto, POGOProtos.Rpc.DeletePokemonTagOutProto],
	REQUEST_TYPE_METHOD_EDIT_POKEMON_TAG: [1719, POGOProtos.Rpc.EditPokemonTagProto, POGOProtos.Rpc.EditPokemonTagOutProto],
	REQUEST_TYPE_METHOD_SET_POKEMON_TAGS_FOR_POKEMON: [1720, POGOProtos.Rpc.SetPokemonTagsForPokemonProto, POGOProtos.Rpc.SetPokemonTagsForPokemonOutProto],
	REQUEST_TYPE_METHOD_GET_POKEMON_TAGS: [1721, POGOProtos.Rpc.GetPokemonTagsProto, POGOProtos.Rpc.GetPokemonTagsOutProto],
	REQUEST_TYPE_METHOD_CHANGE_POKEMON_FORM: [1722, POGOProtos.Rpc.ChangePokemonFormProto, POGOProtos.Rpc.ChangePokemonFormOutProto],
	REQUEST_TYPE_METHOD_CHOOSE_EVENT_VARIANT: [1723, POGOProtos.Rpc.ChooseGlobalTicketedEventVariantProto, POGOProtos.Rpc.ChooseGlobalTicketedEventVariantOutProto],
	REQUEST_TYPE_METHOD_GET_REFERRAL_CODE: [1800, POGOProtos.Rpc.GetReferralCodeProto, POGOProtos.Rpc.GetReferralCodeOutProto],
	REQUEST_TYPE_METHOD_ADD_REFERRER: [1801, POGOProtos.Rpc.AddReferrerProto, POGOProtos.Rpc.AddReferrerOutProto],
	REQUEST_TYPE_METHOD_SEND_FRIEND_INVITE_VIA_REFERRAL_CODE: [1802, POGOProtos.Rpc.SendFriendInviteViaReferralCodeProto, POGOProtos.Rpc.SendFriendInviteViaReferralCodeOutProto],
	REQUEST_TYPE_METHOD_GET_MILESTONES: [1803, POGOProtos.Rpc.GetMilestonesProto, POGOProtos.Rpc.GetMilestonesOutProto],
	REQUEST_TYPE_METHOD_MARK_MILESTONES_AS_VIEWED: [1804, POGOProtos.Rpc.MarkMilestoneAsViewedProto, POGOProtos.Rpc.MarkMilestoneAsViewedOutProto],
	REQUEST_TYPE_METHOD_GET_MILESTONES_PREVIEW: [1805, POGOProtos.Rpc.GetMilestonesPreviewProto, POGOProtos.Rpc.GetMilestonesPreviewOutProto],
	REQUEST_TYPE_METHOD_COMPLETE_MILESTONE: [1806, POGOProtos.Rpc.CompleteMilestoneProto, POGOProtos.Rpc.CompleteMilestoneOutProto],
	REQUEST_TYPE_METHOD_GET_GEOFENCED_AD: [1820, POGOProtos.Rpc.GetGeofencedAdProto, POGOProtos.Rpc.GetGeofencedAdOutProto],
	REQUEST_TYPE_METHOD_POWER_UP_POKESTOP_ENCOUNTER: [1900, null, null],
	REQUEST_TYPE_METHOD_CREATE_POSTCARD: [1910, POGOProtos.Rpc.CreatePostcardProto, POGOProtos.Rpc.CreatePostcardOutProto],
	REQUEST_TYPE_METHOD_UPDATE_POSTCARD: [1911, POGOProtos.Rpc.UpdatePostcardProto, POGOProtos.Rpc.UpdatePostcardOutProto],
	REQUEST_TYPE_METHOD_DELETE_POSTCARD: [1912, POGOProtos.Rpc.DeletePostcardProto, POGOProtos.Rpc.DeletePostcardOutProto],
	REQUEST_TYPE_METHOD_GET_MEMENTO_LIST: [1913, POGOProtos.Rpc.GetMementoListProto, POGOProtos.Rpc.GetMementoListOutProto],
	REQUEST_TYPE_METHOD_UPLOAD_RAID_CLIENT_LOG: [1914, POGOProtos.Rpc.UploadRaidClientLogProto, POGOProtos.Rpc.UploadRaidClientLogOutProto],
	REQUEST_TYPE_METHOD_SKIP_ENTER_REFERRAL_CODE: [1915, null, null],
	REQUEST_TYPE_METHOD_UPLOAD_COMBAT_CLIENT_LOG: [1916, null, null],
	REQUEST_TYPE_METHOD_COMBAT_SYNC_SERVER_OFFSET: [1917, null, null],
	REQUEST_TYPE_METHOD_CHECK_GIFTING_ELIGIBILITY: [2000, POGOProtos.Rpc.CheckGiftingEligibilityProto, POGOProtos.Rpc.CheckGiftingEligibilityOutProto],
	REQUEST_TYPE_METHOD_REDEEM_TICKET_GIFT_FOR_FRIEND: [2001, POGOProtos.Rpc.RedeemTicketGiftForFriendProto, POGOProtos.Rpc.RedeemTicketGiftForFriendOutProto],
	REQUEST_TYPE_CLIENT_ACTION_REGISTER_PUSH_NOTIFICATION: [5000, POGOProtos.Rpc.PushNotificationRegistryProto, POGOProtos.Rpc.PushNotificationRegistryOutProto],
	REQUEST_TYPE_CLIENT_ACTION_UNREGISTER_PUSH_NOTIFICATION: [5001, null, null],
	REQUEST_TYPE_CLIENT_ACTION_UPDATE_NOTIFICATION_STATUS: [5002, POGOProtos.Rpc.UpdateNotificationProto, POGOProtos.Rpc.UpdateNotificationOutProto],
	REQUEST_TYPE_CLIENT_ACTION_OPT_OUT_PUSH_NOTIFICATION_CATEGORY: [5003, null, POGOProtos.Rpc.OptOutProto],
	REQUEST_TYPE_CLIENT_ACTION_DOWNLOAD_GAME_MASTER_TEMPLATES: [5004, POGOProtos.Rpc.DownloadGmTemplatesRequestProto, POGOProtos.Rpc.DownloadGmTemplatesResponseProto],
	REQUEST_TYPE_CLIENT_ACTION_GET_INVENTORY: [5005, POGOProtos.Rpc.GetInventoryProto, POGOProtos.Rpc.GetInventoryResponseProto],
	REQUEST_TYPE_CLIENT_ACTION_REDEEM_PASSCODE: [5006, POGOProtos.Rpc.RedeemPasscodeRequestProto, POGOProtos.Rpc.RedeemPasscodeResponseProto],
	REQUEST_TYPE_CLIENT_ACTION_PING: [5007, POGOProtos.Rpc.PingRequestProto, POGOProtos.Rpc.PingResponseProto],
	REQUEST_TYPE_CLIENT_ACTION_ADD_LOGIN_ACTION: [5008, POGOProtos.Rpc.AddLoginActionProto, POGOProtos.Rpc.AddLoginActionOutProto],
	REQUEST_TYPE_CLIENT_ACTION_REMOVE_LOGIN_ACTION: [5009, POGOProtos.Rpc.RemoveLoginActionProto, POGOProtos.Rpc.RemoveLoginActionOutProto],
	REQUEST_TYPE_CLIENT_ACTION_LIST_LOGIN_ACTION: [5010, null, POGOProtos.Rpc.ListLoginActionOutProto],
	REQUEST_TYPE_CLIENT_ACTION_ADD_NEW_POI: [5011, POGOProtos.Rpc.SubmitNewPoiProto, POGOProtos.Rpc.SubmitNewPoiOutProto],
	REQUEST_TYPE_CLIENT_ACTION_PROXY_SOCIAL_ACTION: [5012, POGOProtos.Rpc.ProxyRequestProto, POGOProtos.Rpc.ProxyResponseProto],
	REQUEST_TYPE_CLIENT_ACTION_DEPRECATED_CLIENT_TELEMETRY: [5013, null, null],
	REQUEST_TYPE_CLIENT_ACTION_GET_AVAILABLE_SUBMISSIONS: [5014, POGOProtos.Rpc.GetAvailableSubmissionsProto, POGOProtos.Rpc.GetAvailableSubmissionsOutProto],
	REQUEST_TYPE_CLIENT_ACTION_GET_SIGNED_URL_FOR_PHOTO_UPLOAD: [5015, null, null],
	REQUEST_TYPE_CLIENT_ACTION_REPLACE_LOGIN_ACTION: [5016, null, null],
	REQUEST_TYPE_CLIENT_ACTION_PROXY_SOCIAL_SIDE_CHANNEL_ACTION: [5017, null, null],
	REQUEST_TYPE_CLIENT_ACTION_COLLECT_CLIENT_TELEMETRY: [5018, null, null],
	REQUEST_TYPE_CLIENT_ACTION_PURCHASE_SKU: [5019, POGOProtos.Rpc.PurchaseSkuProto, POGOProtos.Rpc.PurchaseSkuOutProto],
	REQUEST_TYPE_CLIENT_ACTION_GET_AVAILABLE_SKUS_AND_BALANCES: [5020, POGOProtos.Rpc.GetAvailableSkusAndBalancesProto, POGOProtos.Rpc.GetAvailableSkusAndBalancesOutProto],
	REQUEST_TYPE_CLIENT_ACTION_REDEEM_GOOGLE_RECEIPT: [5021, POGOProtos.Rpc.RedeemGoogleReceiptProto, POGOProtos.Rpc.RedeemGoogleReceiptOutProto],
	REQUEST_TYPE_CLIENT_ACTION_REDEEM_APPLE_RECEIPT: [5022, POGOProtos.Rpc.RedeemAppleReceiptProto, POGOProtos.Rpc.RedeemAppleReceiptOutProto],
	REQUEST_TYPE_CLIENT_ACTION_REDEEM_DESKTOP_RECEIPT: [5023, null, null],
	REQUEST_TYPE_CLIENT_ACTION_UPDATE_FITNESS_METRICS: [5024, null, null],
	REQUEST_TYPE_CLIENT_ACTION_GET_FITNESS_REPORT: [5025, POGOProtos.Rpc.GetFitnessReportProto, POGOProtos.Rpc.GetFitnessReportOutProto],
	REQUEST_TYPE_CLIENT_ACTION_GET_CLIENT_TELEMETRY_SETTINGS: [5026, POGOProtos.Rpc.ClientTelemetrySettingsRequestProto, null],
	REQUEST_TYPE_CLIENT_ACTION_PING_ASYNC: [5027, null, null],
	REQUEST_TYPE_CLIENT_ACTION_REGISTER_BACKGROUND_SERVICE: [5028, null, null],
	REQUEST_TYPE_CLIENT_ACTION_GET_CLIENT_BGMODE_SETTINGS: [5029, null, null],
	REQUEST_TYPE_CLIENT_ACTION_PING_DOWNSTREAM: [5030, null, null],
	REQUEST_TYPE_CLIENT_ACTION_SET_IN_GAME_CURRENCY_EXCHANGE_RATE: [5032, POGOProtos.Rpc.SetInGameCurrencyExchangeRateProto, POGOProtos.Rpc.SetInGameCurrencyExchangeRateOutProto],
	REQUEST_TYPE_CLIENT_ACTION_REQUEST_GEOFENCE_UPDATES: [5033, POGOProtos.Rpc.GeofenceUpdateProto, POGOProtos.Rpc.GeofenceUpdateOutProto],
	REQUEST_TYPE_CLIENT_ACTION_UPDATE_PLAYER_LOCATION: [5034, POGOProtos.Rpc.LocationPingProto, POGOProtos.Rpc.LocationPingOutProto],
	REQUEST_TYPE_CLIENT_ACTION_GENERATE_GMAP_SIGNED_URL: [5035, POGOProtos.Rpc.GenerateGmapSignedUrlProto, POGOProtos.Rpc.GenerateGmapSignedUrlOutProto],
	REQUEST_TYPE_CLIENT_ACTION_GET_GMAP_SETTINGS: [5036, POGOProtos.Rpc.GetGmapSettingsProto, POGOProtos.Rpc.GetGmapSettingsOutProto],
	REQUEST_TYPE_CLIENT_ACTION_REDEEM_SAMSUNG_RECEIPT: [5037, POGOProtos.Rpc.RedeemSamsungReceiptProto, POGOProtos.Rpc.RedeemSamsungReceiptOutProto],
	REQUEST_TYPE_CLIENT_ACTION_ADD_NEW_ROUTE: [5038, null, null],
	REQUEST_TYPE_CLIENT_ACTION_GET_OUTSTANDING_WARNINGS: [5039, null, null],
	REQUEST_TYPE_CLIENT_ACTION_ACKNOWLEDGE_WARNINGS: [5040, null, null],
	REQUEST_TYPE_CLIENT_ACTION_SUBMIT_POI_IMAGE: [5041, POGOProtos.Rpc.SubmitPoiImageProto, null],
	REQUEST_TYPE_CLIENT_ACTION_SUBMIT_POI_TEXT_METADATA_UPDATE: [5042, POGOProtos.Rpc.SubmitPoiTextMetadataUpdateProto, null],
	REQUEST_TYPE_CLIENT_ACTION_SUBMIT_POI_LOCATION_UPDATE: [5043, POGOProtos.Rpc.SubmitPoiLocationUpdateProto, null],
	REQUEST_TYPE_CLIENT_ACTION_SUBMIT_POI_TAKEDOWN_REQUEST: [5044, POGOProtos.Rpc.SubmitPoiTakedownRequestProto, null],
	REQUEST_TYPE_CLIENT_ACTION_GET_WEB_TOKEN_ACTION: [5045, POGOProtos.Rpc.GetWebTokenProto, POGOProtos.Rpc.GetWebTokenOutProto],
	REQUEST_TYPE_CLIENT_ACTION_GET_ADVENTURE_SYNC_SETTINGS: [5046, POGOProtos.Rpc.GetAdventureSyncSettingsRequestProto, POGOProtos.Rpc.GetAdventureSyncSettingsResponseProto],
	REQUEST_TYPE_CLIENT_ACTION_UPDATE_ADVENTURE_SYNC_SETTINGS: [5047, POGOProtos.Rpc.UpdateAdventureSyncSettingsRequestProto, POGOProtos.Rpc.UpdateAdventureSyncSettingsResponseProto],
	REQUEST_TYPE_CLIENT_ACTION_SET_BIRTHDAY: [5048, POGOProtos.Rpc.UpdateAdventureSyncSettingsRequestProto, POGOProtos.Rpc.UpdateAdventureSyncSettingsResponseProto],
	REQUEST_TYPE_SOCIAL_ACTION_SEARCH_PLAYER: [10000, POGOProtos.Rpc.SearchPlayerProto, POGOProtos.Rpc.SearchPlayerOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_SEND_FRIEND_INVITE: [10002, POGOProtos.Rpc.SendFriendInviteProto, POGOProtos.Rpc.SendFriendInviteOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_CANCEL_FRIEND_INVITE: [10003, POGOProtos.Rpc.CancelFriendInviteProto, POGOProtos.Rpc.CancelFriendInviteOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_ACCEPT_FRIEND_INVITE: [10004, POGOProtos.Rpc.AcceptFriendInviteProto, POGOProtos.Rpc.AcceptFriendInviteOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_DECLINE_FRIEND_INVITE: [10005, POGOProtos.Rpc.DeclineFriendInviteProto, POGOProtos.Rpc.DeclineFriendInviteOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_LIST_FRIENDS: [10006, POGOProtos.Rpc.ListFriendsRequest, POGOProtos.Rpc.ListFriendsResponse],
	REQUEST_TYPE_SOCIAL_ACTION_LIST_OUTGOING_FRIEND_INVITES: [10007, POGOProtos.Rpc.GetOutgoingFriendInvitesProto, POGOProtos.Rpc.GetOutgoingFriendInvitesOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_LIST_INCOMING_FRIEND_INVITES: [10008, POGOProtos.Rpc.GetIncomingFriendInvitesProto, POGOProtos.Rpc.GetIncomingFriendInvitesOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_REMOVE_FRIEND: [10009, POGOProtos.Rpc.RemoveFriendProto, POGOProtos.Rpc.RemoveFriendOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_LIST_FRIEND_STATUS: [10010, POGOProtos.Rpc.GetFriendDetailsProto, POGOProtos.Rpc.GetFriendDetailsOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_SEND_FACEBOOK_FRIEND_INVITE: [10011, POGOProtos.Rpc.InviteFacebookFriendProto, POGOProtos.Rpc.InviteFacebookFriendOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_IS_MY_FRIEND: [10012, POGOProtos.Rpc.IsMyFriendProto, POGOProtos.Rpc.IsMyFriendOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_CREATE_INVITE_CODE: [10013, POGOProtos.Rpc.GetFriendCodeProto, POGOProtos.Rpc.GetFriendCodeOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_GET_FACEBOOK_FRIEND_LIST: [10014, POGOProtos.Rpc.GetFacebookFriendListProto, POGOProtos.Rpc.GetFacebookFriendListOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_UPDATE_FACEBOOK_STATUS: [10015, POGOProtos.Rpc.UpdateFacebookStatusProto, POGOProtos.Rpc.UpdateFacebookStatusOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_SAVE_PLAYER_SETTINGS: [10016, POGOProtos.Rpc.SaveSocialPlayerSettingsProto, POGOProtos.Rpc.SaveSocialPlayerSettingsOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_GET_PLAYER_SETTINGS: [10017, POGOProtos.Rpc.GetPlayerSettingsProto, POGOProtos.Rpc.GetPlayerSettingsOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_GET_NIANTIC_FRIEND_LIST_DELETED: [10018, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_GET_NIANTIC_FRIEND_DETAILS_DELETED: [10019, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_SEND_NIANTIC_FRIEND_INVITE_DELETED: [10020, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_SET_ACCOUNT_SETTINGS: [10021, POGOProtos.Rpc.SetAccountSettingsProto, POGOProtos.Rpc.SetAccountSettingsOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_GET_ACCOUNT_SETTINGS: [10022, POGOProtos.Rpc.GetAccountSettingsProto, POGOProtos.Rpc.GetAccountSettingsOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_ADD_FAVORITE_FRIEND: [10023, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_REMOVE_FAVORITE_FRIEND: [10024, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_REGISTER_PUSH_NOTIFICATION: [10101, POGOProtos.Rpc.PushNotificationRegistryProto, POGOProtos.Rpc.PushNotificationRegistryOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_UNREGISTER_PUSH_NOTIFICATION: [10102, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_UPDATE_NOTIFICATION: [10103, POGOProtos.Rpc.UpdateNotificationProto, POGOProtos.Rpc.UpdateNotificationOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_OPT_OUT_PUSH_NOTIFICATION_CATEGORY: [10104, null, POGOProtos.Rpc.OptOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_GET_INBOX: [10105, POGOProtos.Rpc.GetInboxV2Proto, POGOProtos.Rpc.GetInboxOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_GET_SIGNED_URL: [10201, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_SUBMIT_IMAGE: [10202, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_GET_PHOTOS: [10203, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_DELETE_PHOTO: [10204, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_FLAG_PHOTO: [10205, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_UPDATE_PROFILE_V2: [20001, POGOProtos.Rpc.UpdateProfileRequest, POGOProtos.Rpc.UpdateProfileResponse],
	REQUEST_TYPE_SOCIAL_ACTION_UPDATE_FRIENDSHIP_V2: [20002, POGOProtos.Rpc.UpdateFriendshipRequest, POGOProtos.Rpc.UpdateFriendshipResponse],
	REQUEST_TYPE_SOCIAL_ACTION_GET_PROFILE_V2: [20003, POGOProtos.Rpc.GetProfileRequest, POGOProtos.Rpc.GetProfileResponse],
	REQUEST_TYPE_SOCIAL_ACTION_INVITE_GAME_V2: [20004, POGOProtos.Rpc.InviteGameRequest, POGOProtos.Rpc.InviteGameResponse],
	REQUEST_TYPE_SOCIAL_ACTION_RESERVED_ACTION_2: [20005, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_LIST_FRIENDS_V2: [20006, POGOProtos.Rpc.ListFriendsRequest, POGOProtos.Rpc.ListFriendsResponse],
	REQUEST_TYPE_SOCIAL_ACTION_GET_FRIEND_DETAILS_V2: [20007, POGOProtos.Rpc.GetFriendDetailsProto, POGOProtos.Rpc.GetFriendDetailsOutProto],
	REQUEST_TYPE_SOCIAL_ACTION_GET_CLIENT_FEATURE_FLAGS_V2: [20008, POGOProtos.Rpc.GetClientFeatureFlagsRequest, POGOProtos.Rpc.GetClientFeatureFlagsResponse],
	REQUEST_TYPE_SOCIAL_ACTION_RESERVED_ACTION_1: [20009, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_GET_INCOMING_GAME_INVITES_V2: [20010, POGOProtos.Rpc.GetIncomingGameInvitesRequest, POGOProtos.Rpc.GetIncomingGameInvitesResponse],
	REQUEST_TYPE_SOCIAL_ACTION_UPDATE_INCOMING_GAME_INVITE_V2: [20011, POGOProtos.Rpc.UpdateIncomingGameInviteRequest, POGOProtos.Rpc.UpdateIncomingGameInviteResponse],
	REQUEST_TYPE_SOCIAL_ACTION_DISMISS_OUTGOING_GAME_INVITES_V2: [20012, POGOProtos.Rpc.DismissOutgoingGameInvitesRequest, POGOProtos.Rpc.DismissOutgoingGameInvitesResponse],
	REQUEST_TYPE_SOCIAL_ACTION_SYNC_CONTACT_LIST_V2: [20013, POGOProtos.Rpc.SyncContactListRequest, POGOProtos.Rpc.SyncContactListResponse],
	REQUEST_TYPE_SOCIAL_ACTION_SEND_CONTACT_LIST_FRIEND_INVITE_V2: [20014, POGOProtos.Rpc.SendContactListFriendInviteRequest, POGOProtos.Rpc.SendContactListFriendInviteResponse],
	REQUEST_TYPE_SOCIAL_ACTION_REFER_CONTACT_LIST_FRIEND_V2: [20015, POGOProtos.Rpc.ReferContactListFriendRequest, POGOProtos.Rpc.ReferContactListFriendResponse],
	REQUEST_TYPE_SOCIAL_ACTION_GET_CONTACT_LIST_INFO_V2: [20016, POGOProtos.Rpc.GetContactListInfoRequest, POGOProtos.Rpc.GetContactListInfoResponse],
	REQUEST_TYPE_SOCIAL_ACTION_DISMISS_CONTACT_LIST_UPDATE_V2: [20017, POGOProtos.Rpc.DismissContactListUpdateRequest, POGOProtos.Rpc.DismissContactListUpdateResponse],
	REQUEST_TYPE_SOCIAL_ACTION_NOTIFY_CONTACT_LIST_FRIENDS_V2: [20018, POGOProtos.Rpc.NotifyContactListFriendsRequest, POGOProtos.Rpc.NotifyContactListFriendsResponse],
	REQUEST_TYPE_SOCIAL_ACTION_RESERVED_ACTION_6: [20019, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_RESERVED_ACTION_7: [20020, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_RESERVED_ACTION_3: [20400, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_RESERVED_ACTION_4: [20401, null, null],
	REQUEST_TYPE_SOCIAL_ACTION_RESERVED_ACTION_5: [20402, null, null],
	REQUEST_TYPE_REQUEST_GEOFENCE_UPDATES_1: [360000, POGOProtos.Rpc.GeofenceUpdateProto, POGOProtos.Rpc.GeofenceUpdateOutProto],
	REQUEST_TYPE_UPDATE_PLAYER_LOCATION_1: [360001, POGOProtos.Rpc.LocationPingProto, POGOProtos.Rpc.LocationPingOutProto],
	REQUEST_TYPE_UPDATE_BREADCRUMB_HISTORY: [361000, POGOProtos.Rpc.UpdateBreadcrumbHistoryRequestProto, POGOProtos.Rpc.UpdateBreadcrumbHistoryResponseProto],
	REQUEST_TYPE_REFRESH_PROXIMITY_TOKENS: [362000, null, null],
	REQUEST_TYPE_REPORT_PROXIMITY_CONTACTS: [362001, null, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_ADD_NEW_POI: [620000, POGOProtos.Rpc.SubmitNewPoiProto, POGOProtos.Rpc.SubmitNewPoiOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_AVAILABLE_SUBMISSIONS: [620001, POGOProtos.Rpc.GetAvailableSubmissionsProto, POGOProtos.Rpc.GetAvailableSubmissionsOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_SIGNED_URL_FOR_PHOTO_UPLOAD: [620002, null, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_PLAYER_SUBMISSION_VALIDATION_SETTINGS: [620003, POGOProtos.Rpc.GetPlayerSubmissionValidationSettingsProto, POGOProtos.Rpc.GetPlayerSubmissionValidationSettingsOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_POI_IMAGE: [620100, POGOProtos.Rpc.SubmitPoiImageProto, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_POI_TEXT_METADATA_UPDATE: [620101, POGOProtos.Rpc.SubmitPoiTextMetadataUpdateProto, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_POI_LOCATION_UPDATE: [620102, POGOProtos.Rpc.SubmitPoiLocationUpdateProto, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_POI_TAKEDOWN_REQUEST: [620103, POGOProtos.Rpc.SubmitPoiTakedownRequestProto, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_SPONSOR_POI_REPORT: [620104, POGOProtos.Rpc.SubmitSponsorPoiReportProto, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_SPONSOR_POI_LOCATION_UPDATE: [620105, POGOProtos.Rpc.SubmitSponsorPoiLocationUpdateProto, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_POI_CATEGORY_VOTE: [620106, POGOProtos.Rpc.SubmitPoiCategoryVoteRecordProto, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_ADD_NEW_ROUTE: [620200, null, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GENERATE_GMAP_SIGNED_URL: [620300, POGOProtos.Rpc.GenerateGmapSignedUrlProto, POGOProtos.Rpc.GenerateGmapSignedUrlOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_GMAP_SETTINGS: [620301, POGOProtos.Rpc.GetGmapSettingsProto, POGOProtos.Rpc.GetGmapSettingsOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_POI_AR_VIDEO_METADATA: [620400, POGOProtos.Rpc.PoiVideoSubmissionMetadataProto, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_GRAPESHOT_FILE_UPLOAD_URL: [620401, null, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_ASYNC_FILE_UPLOAD_COMPLETE: [620402, POGOProtos.Rpc.AsyncFileUploadCompleteProto, POGOProtos.Rpc.AsyncFileUploadCompleteOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_AR_MAPPING_SETTINGS: [620403, POGOProtos.Rpc.GetARMappingSettingsProto, POGOProtos.Rpc.GetARMappingSettingsOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_IMAGES_FOR_POI: [620500, POGOProtos.Rpc.GetImagesForPoiProto, POGOProtos.Rpc.GetImagesForPoiOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_SUBMIT_PLAYER_IMAGE_VOTE_FOR_POI: [620501, POGOProtos.Rpc.SubmitPlayerImageVoteForPoiProto, POGOProtos.Rpc.SubmitPlayerImageVoteForPoiOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_IMAGE_GALLERY_SETTINGS: [620502, POGOProtos.Rpc.GetImageGallerySettingsProto, POGOProtos.Rpc.GetImageGallerySettingsOutProto],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_MAP_DATA: [620600, null, null],
	REQUEST_TYPE_PLAYER_SUBMISSION_ACTION_GET_POIS_IN_RADIUS: [620601, POGOProtos.Rpc.GetPoisInRadiusProto, POGOProtos.Rpc.GetPoisInRadiusOutProto],
	REQUEST_TYPE_UPDATE_FITNESS_METRICS_1: [640000, null, null],
	REQUEST_TYPE_GET_FITNESS_REPORT_1: [640001, POGOProtos.Rpc.GetFitnessReportProto, POGOProtos.Rpc.GetFitnessReportOutProto],
	REQUEST_TYPE_GET_ADVENTURE_SYNC_SETTINGS_1: [640002, POGOProtos.Rpc.GetAdventureSyncSettingsRequestProto, POGOProtos.Rpc.GetAdventureSyncSettingsResponseProto],
	REQUEST_TYPE_UPDATE_ADVENTURE_SYNC_SETTINGS_1: [640003, POGOProtos.Rpc.UpdateAdventureSyncSettingsRequestProto, POGOProtos.Rpc.UpdateAdventureSyncSettingsResponseProto],
	REQUEST_TYPE_UPDATE_ADVENTURE_SYNC_FITNESS: [640004, POGOProtos.Rpc.UpdateAdventureSyncFitnessRequestProto, POGOProtos.Rpc.UpdateAdventureSyncFitnessResponseProto],
	REQUEST_TYPE_GET_ADVENTURE_SYNC_FITNESS_REPORT: [640005, POGOProtos.Rpc.GetAdventureSyncFitnessReportRequestProto, POGOProtos.Rpc.GetAdventureSyncFitnessReportResponseProto]
};


for (let i = 0; i < Object.keys(requestMessagesResponses).length; i++) {
    let my_req = Object.values(requestMessagesResponses)[i][0];
    if (my_req == 0)
    {
        continue;
    }

    switch(my_req){
        case 137:    // REQUEST_TYPE_METHOD_RECYCLE_INVENTORY_ITEM
            if (requestMessagesResponses.REQUEST_TYPE_METHOD_RECYCLE_INVENTORY_ITEM[1] != null)
            {
                var myMessage = requestMessagesResponses.REQUEST_TYPE_METHOD_RECYCLE_INVENTORY_ITEM[1].fromObject({
                    item: POGOProtos.Rpc.Item.ITEM_POTION,
                    count: 50
                });
  
                var encoded = requestMessagesResponses.REQUEST_TYPE_METHOD_RECYCLE_INVENTORY_ITEM[1].encode(myMessage).finish();
                var decodedAgain = requestMessagesResponses.REQUEST_TYPE_METHOD_RECYCLE_INVENTORY_ITEM[1].decode(encoded);
                console.log('Test encode/decode:\nItem: ' + decodedAgain.item + ' count: ' + decodedAgain.count);
            }
            break;
    }
}
*/

const RpcMethod = {
    UnSet: 0, // 0
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
                if (config.dataparser.addDevicesThroughParser) {
                    console.debug("Need to add Devices through Data");
                    try {
                        console.debug("Getting Account with username ", username);
                        let account = await Account.getWithUsername(username);
                        if (!account || account.username==null) {
                            console.debug("No account with that username found");
                            let account = Account.create({
                                username: username,
                                password: 'temp',
                                firstWarningTimestamp: 0,
                                failedTimestamp: 0,
                                failed: null,
                                level: trainerLevel,
                            });
                            console.debug("Account created");
                        }
                        console.debug("Getting Device that is linked with the given username");
                        let deviceByUsername = await Device.getByAccountUsername(username);
                        if (!deviceByUsername) {
                            console.debug("No Device found yet for the given username");
                        } else {
                            if (deviceByUsername.uuid != uuid) {
                                console.debug("Account is logged in on another device, clear accountname for this device");
                                await Device.setAccountUsername(deviceByUsername.uuid, '');
                            }
                        }

                        console.debug("Getting Device based on uuid", uuid);
                        let device = await Device.getById(uuid);
                        if (!device) {
                            console.debug("No Device found for the given uuid, getting AutoAddedByParser instance");
                            let instance = await Instance.getByName('AutoAddedByParser');
                            if (!instance || instance.name==null) {
                                console.debug("Instance not found");
                                const data = {
                                    area: [
                                        {
                                            "lat":-90,
                                            "lon":-180
                                        },{
                                            "lat":-90,
                                            "lon":180
                                        },{
                                            "lat":90,
                                            "lon":180
                                        },{
                                            "lat":90,
                                            "lon":-180
                                        }
                                    ],
                                    timezone_offset: 7200,
                                    min_level: 1,
                                    max_level: 40,
                                };
                                let instance = Instance.create({
                                    name: 'AutoAddedByParser',
                                    type: InstanceType.CirclePokemon,
                                    data: data,
                                });
                                console.debug("Instance created");
                            }

                            console.debug("Creating device");
                            let device = Device.create({
                                uuid: uuid,
                                instanceName: instance.name,
                                accountUsername: username,
                                lastHost: null,
                                lastSeen: Math.floor(Date.now() / 1000),
                                lastLat: latTarget,
                                lastLon: lonTarget,
                            });
                            console.debug("Device created");
                        }
                        console.debug("Checking if the device username is the current account username");
                        if (device && device.accountUsername != account.username) {
                            console.debug("Different account logged in, changing account");
                            await Device.setAccountUsername(uuid, account.username);
                            console.debug("Account username updated");
                        }
                    } catch (err) {
                        console.error('[Raw] Error:', err);
                    }
                }

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
