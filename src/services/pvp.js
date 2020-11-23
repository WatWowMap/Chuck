'use strict';

const LRU = require('lru-cache');
const cpMultipliers = require('../../static/data/cp_multiplier.json');
const masterfile = require('../../static/data/masterfile.json');

const rankCache = new LRU({
    maxAge: 1000 * 60 * 60 * 24,
    updateAgeOnGet: true,
});
const leagues = {
    great: [1500, 40],
    ultra: [2500, 40],
};

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
    let bestCP = cap, lowest = 1, highest = lvCap + .5;
    for (let mid = Math.ceil(lowest + highest) / 2; lowest < highest; mid = Math.ceil(lowest + highest) / 2) {
        const cp = calculateCP(stats, attack, defense, stamina, mid);
        if (cp <= cap) {
            lowest = mid;
            bestCP = cp;
        } else {
            highest = mid - .5;
        }
    }
    return { value: calculateStatProduct(stats, attack, defense, stamina, lowest), level: lowest, cp: bestCP };
};

const calculateAllRanks = (stats) => {
    const key = [stats.attack, stats.defense, stats.stamina];
    let value = rankCache.get(key);
    if (value === undefined) {
        value = {};
        for (const [leagueName, [cpCap, lvCap]] of Object.entries(leagues)) {
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
                        arrayToSort.push({ attack: a, defense: d, stamina: s, value: currentStat.value });
                    }
                    arrA.push(arrD);
                }
                combinations.push(arrA);
            }

            arrayToSort.sort((a, b) => b.value - a.value);
            const best = arrayToSort[0].value;
            for (let i = 0, j = 0; i < arrayToSort.length; i++) {
                let percent = Number(((arrayToSort[i].value / best) * 100).toPrecision(4));
                const entry = combinations[arrayToSort[i].attack][arrayToSort[i].defense][arrayToSort[i].stamina];
                entry.percent = percent;
                if (entry.value < arrayToSort[j].value) {
                    j = i;
                }
                entry.rank = j + 1;
                entry.value = Math.floor(entry.value);
            }
            value[leagueName] = combinations;
        }
        rankCache.set(key, value);
    }
    return value;
};

const queryPvPRank = async (pokemonId, formId, attack, defense, stamina, level, gender) => {
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
        if (!result[leagueName]) {
            result[leagueName] = [];
        }
        result[leagueName].push({ ...baseEntry, ...combinations[attack][defense][stamina] });
    }
    if (masterForm.evolutions) {
        for (const [evoId, evolution] of Object.entries(masterForm.evolutions)) {
            if (evolution.gender_requirement && gender !== evolution.gender_requirement) {
                continue;
            }
            const evolvedRanks = await queryPvPRank(parseInt(evoId), evolution.form || 0, attack, defense, stamina, level, gender);
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
                if (!result[leagueName]) {
                    result[leagueName] = [];
                }
                result[leagueName].push({ ...baseEntry, evolution: parseInt(tempEvoId), ...combinations[attack][defense][stamina] });
            }
        }
    }
    return result;
};

module.exports = (ipcMaster) => {
    ipcMaster.registerCallback('queryPvPRank', queryPvPRank);
};
