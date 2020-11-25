'use strict';

const LRU = require('lru-cache');
const rpc = require('purified-protos');
const cpMultipliers = require('../../static/data/cp_multiplier.json');
const masterfile = require('../../static/data/masterfile.json');
const config = require('./config.js');

const rankCache = new LRU({
    maxAge: config.dataparser.pvp.rankCacheAge,
    updateAgeOnGet: true,
});

const calculateStatProduct = (stats, attack, defense, stamina, level) => {
    const multiplier = cpMultipliers[level];
    let hp = Math.floor((stamina + stats.stamina) * multiplier);
    if (hp < 10) {
        hp = 10;
    }
    return (attack + stats.attack) * multiplier *
        (defense + stats.defense) * multiplier *
        hp;
};

const calculateCP = (stats, attack, defense, stamina, level) => {
    const multiplier = Math.pow(cpMultipliers[level], 2);

    const attackMultiplier = stats.attack + attack;
    const defenseMultiplier = Math.pow(stats.defense + defense, 0.5);
    const staminaMultiplier = Math.pow(stats.stamina + stamina, 0.5);

    const cp = Math.floor((attackMultiplier * defenseMultiplier * staminaMultiplier * multiplier) / 10);
    return cp < 10 ? 10 : cp;
};

const calculatePvPStat = (stats, attack, defense, stamina, cap, lvCap) => {
    let bestCP = cap, lowest = 1, highest = lvCap;
    for (let mid = Math.ceil(lowest + highest) / 2; lowest < highest; mid = Math.ceil(lowest + highest) / 2) {
        const cp = calculateCP(stats, attack, defense, stamina, mid);
        if (cp <= cap) {
            lowest = mid;
            bestCP = cp;
        } else {
            highest = mid - .5;
        }
    }
    // TODO: currently we assume lv1 cp is always below cpCap. If this is not the case, we need to add a check here
    return { value: calculateStatProduct(stats, attack, defense, stamina, lowest), level: lowest, cp: bestCP };
};

const calculateAllRanks = (stats) => {
    const key = `${stats.attack},${stats.defense},${stats.stamina}`;
    let value = rankCache.get(key);
    if (value === undefined) {
        value = {};
        for (const [leagueName, cpCap] of Object.entries(config.dataparser.pvp.leagues)) {
            let combinationIndex;
            for (const lvCap of config.dataparser.pvp.levelCaps) {
                if (calculateCP(stats, 15, 15, 15, lvCap) <= cpCap) {
                    continue;   // not viable
                }
                const arrayToSort = [];
                const combinations = [];
                for (let a = 0; a <= 15; a++) {
                    const arrA = [];
                    for (let d = 0; d <= 15; d++) {
                        const arrD = [];
                        for (let s = 0; s <= 15; s++) {
                            const currentStat = calculatePvPStat(stats, a, d, s, cpCap, lvCap);
                            arrD.push(currentStat);
                            arrayToSort.push(currentStat);
                        }
                        arrA.push(arrD);
                    }
                    combinations.push(arrA);
                }
                if (combinationIndex === undefined) {
                    combinationIndex = { [lvCap]: combinations };
                } else {
                    combinationIndex[lvCap] = combinations;
                }

                arrayToSort.sort((a, b) => b.value - a.value);
                const best = arrayToSort[0].value;
                for (let i = 0, j = 0; i < arrayToSort.length; i++) {
                    const entry = arrayToSort[i];
                    entry.percentage = Number((entry.value / best).toFixed(5));
                    if (entry.value < arrayToSort[j].value) {
                        j = i;
                    }
                    entry.rank = j + 1;
                    entry.value = Math.floor(entry.value);
                }
                // check if no more power up is possible: further increasing the cap will not be relevant
                if (calculateCP(stats, 0, 0, 0, lvCap + .5) > cpCap) {
                    combinations.maxed = true;
                    break;
                }
            }
            if (combinationIndex !== undefined) {
                value[leagueName] = combinationIndex;
            }
        }
        rankCache.set(key, value);
    }
    return value;
};

const queryPvPRank = async (pokemonId, formId, costumeId, attack, defense, stamina, level, gender) => {
    const result = {};
    const masterPokemon = masterfile.pokemon[pokemonId];
    if (!masterPokemon || !masterPokemon.attack) {
        return result;
    }
    const pushEntry = (leagueName, maxed, entry) => {
        if (!result[leagueName]) {
            result[leagueName] = [];
        }
        if (maxed) {
            entry.capped = true;
        }
        result[leagueName].push(entry);
    };
    const masterForm = masterPokemon.forms[formId] || masterPokemon;
    const baseEntry = { pokemon: pokemonId };
    if (formId) {
        baseEntry.form = formId;
    }
    const allRanks = calculateAllRanks(masterForm.attack ? masterForm : masterPokemon);
    for (const [leagueName, combinationIndex] of Object.entries(allRanks)) {
        for (const [lvCap, combinations] of Object.entries(combinationIndex)) {
            const ivEntry = combinations[attack][defense][stamina];
            if (level <= ivEntry.level) {
                pushEntry(leagueName, combinations.maxed, { ...baseEntry, cap: parseFloat(lvCap), ...ivEntry });
            }
        }
    }
    let canEvolve = true;
    if (costumeId) {
        const costumeName = (await rpc()).PokemonDisplayProto.Costume[costumeId];
        canEvolve = costumeName.endsWith('_NOEVOLVE') || costumeName.endsWith('_NO_EVOLVE');
    }
    if (canEvolve && masterForm.evolutions) {
        for (const [evoId, evolution] of Object.entries(masterForm.evolutions)) {
            if (evolution.gender_requirement && gender !== evolution.gender_requirement) {
                continue;
            }
            // reset costume since we know it can evolve
            const evolvedRanks = await queryPvPRank(parseInt(evoId), evolution.form || 0, 0,
                attack, defense, stamina, level, gender);
            for (const [leagueName, results] of Object.entries(evolvedRanks)) {
                result[leagueName] = result[leagueName] ? result[leagueName].concat(results) : results;
            }
        }
    }
    if (masterForm.temp_evolutions) {
        for (const [tempEvoId, tempEvo] of Object.entries(masterForm.temp_evolutions)) {
            const overrideStats = tempEvo.attack ? tempEvo : masterPokemon.temp_evolutions[tempEvoId];
            const tempRanks = calculateAllRanks(overrideStats);
            for (const [leagueName, combinationIndex] of Object.entries(tempRanks)) {
                for (const [lvCap, combinations] of Object.entries(combinationIndex)) {
                    const ivEntry = combinations[attack][defense][stamina];
                    if (level <= ivEntry.level) {
                        pushEntry(leagueName, combinations.maxed, {
                            ...baseEntry,
                            evolution: parseInt(tempEvoId),
                            cap: parseFloat(lvCap),
                            ...ivEntry,
                        });
                    }
                }
            }
        }
    }
    return result;
};

module.exports = (ipcMaster) => {
    ipcMaster.registerCallback('queryPvPRank', queryPvPRank);
};
