'use strict';

const LRU = require('lru-cache');
const rpc = require('purified-protos');
const cpMultipliers = require('../../static/data/cp_multiplier.json');
const masterfile = require('../../static/data/masterfile.json');
const config = require('./config.js');

const rankCache = new LRU({
    maxAge: 1000 * 60 * 60 * 24,
    updateAgeOnGet: true,
});
//add to config once Chuck db has one pvp column
const leagues = {
    great: 1500,
    ultra: 2500,
};
/**
 * A list of level caps that will be considered. Must be a strictly increasing sequence.
 * CP multiplier up to level (maxLevelCap + .5) must all be defined.
 * @type {number[]}
 */
const levelCaps = config.dataparser.pvp.levelCaps;

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
        for (const [leagueName, cpCap] of Object.entries(leagues)) {
            let combinations;
            for (const lvCap of levelCaps) {
                if (calculateCP(stats, 15, 15, 15, lvCap) <= cpCap) {
                    continue;   // not viable
                }
                const arrayToSort = [];
                if (combinations === undefined) {
                    combinations = [];
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
                } else {
                    for (let a = 0; a <= 15; a++) {
                        for (let d = 0; d <= 15; d++) {
                            const arrD = combinations[a][d];
                            const notFirst = Array.isArray(arrD[0]);
                            for (let s = 0; s <= 15; s++) {
                                const currentStat = calculatePvPStat(stats, a, d, s, cpCap, lvCap);
                                if (!notFirst) {
                                    arrD[s] = [arrD[s]];
                                }
                                arrD[s].push(currentStat);
                                arrayToSort.push(currentStat);
                            }
                        }
                    }
                }

                arrayToSort.sort((a, b) => b.value - a.value);
                // it is relevant only if adding the next worst thing matters
                const isLevelCapRelevant = calculateCP(stats, 0, 0, 0, lvCap + .5) <= cpCap;
                const best = arrayToSort[0].value;
                for (let i = 0, j = 0; i < arrayToSort.length; i++) {
                    const entry = arrayToSort[i];
                    entry.percentage = Number((entry.value / best).toFixed(5));
                    if (isLevelCapRelevant) {
                        entry.cap = lvCap;
                    }
                    if (entry.value < arrayToSort[j].value) {
                        j = i;
                    }
                    entry.rank = j + 1;
                    entry.value = Math.floor(entry.value);
                }
                if (!isLevelCapRelevant) {
                    break;  // further increasing the cap will not be relevant
                }
            }
            if (combinations !== undefined) {
                value[leagueName] = combinations;
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
    const masterForm = masterPokemon.forms[formId] || masterPokemon;
    const baseEntry = { pokemon: pokemonId };
    if (formId) {
        baseEntry.form = formId;
    }
    const allRanks = calculateAllRanks(masterForm.attack ? masterForm : masterPokemon);
    for (const [leagueName, combinations] of Object.entries(allRanks)) {
        const ivEntries = combinations[attack][defense][stamina];
        for (const ivEntry of Array.isArray(ivEntries) ? ivEntries : [ivEntries]) {
            if (level > ivEntry.level) {
                continue;   // over leveled, cannot get into cap
            }
            if (!result[leagueName]) {
                result[leagueName] = [];
            }
            result[leagueName].push({ ...baseEntry, ...ivEntry });
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
            for (const [leagueName, combinations] of Object.entries(tempRanks)) {
                const ivEntries = combinations[attack][defense][stamina];
                for (const ivEntry of Array.isArray(ivEntries) ? ivEntries : [ivEntries]) {
                    if (level > ivEntry.level) {
                        continue;   // over leveled, cannot get into cap
                    }
                    if (!result[leagueName]) {
                        result[leagueName] = [];
                    }
                    result[leagueName].push({...baseEntry, evolution: parseInt(tempEvoId), ...ivEntry});
                }
            }
        }
    }
    return result;
};

module.exports = (ipcMaster) => {
    ipcMaster.registerCallback('queryPvPRank', queryPvPRank);
};
