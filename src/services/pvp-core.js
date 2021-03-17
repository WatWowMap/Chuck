'use strict';

const cpMultipliers = require('../../static/data/cp_multiplier.json');

/**
 * This file should not be included directly, other than testing purposes.
 * Use ./pvp.js instead.
 */

const calculateCpMultiplier = (level, test = false) => {
    if (test ? level < 40 : level <= 55) {
        return cpMultipliers[level];
    }
    const baseLevel = Math.floor(level);
    const baseCpm = Math.fround(0.5903 + baseLevel * 0.005);
    if (baseLevel === level) {
        return Math.fround(baseCpm);
    }
    const nextCpm = Math.fround(0.5903 + (baseLevel + 1) * 0.005);
    return Math.sqrt((baseCpm * baseCpm + nextCpm * nextCpm) / 2);
};

const calculateStatProduct = (stats, attack, defense, stamina, level) => {
    const multiplier = calculateCpMultiplier(level);
    let hp = Math.floor((stamina + stats.stamina) * multiplier);
    if (hp < 10) {
        hp = 10;
    }
    return (attack + stats.attack) * multiplier *
        (defense + stats.defense) * multiplier *
        hp;
};

const calculateCP = (stats, attack, defense, stamina, level) => {
    const multiplier = calculateCpMultiplier(level);

    const a = stats.attack + attack;
    const d = stats.defense + defense;
    const s = stats.stamina + stamina;

    const cp = Math.floor(multiplier * multiplier * a * Math.sqrt(d * s) / 10);
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

const calculateRanks = (stats, cpCap, lvCap) => {
    const combinations = [];
    const sortedRanks = [];
    for (let a = 0; a <= 15; a++) {
        const arrA = [];
        for (let d = 0; d <= 15; d++) {
            const arrD = [];
            for (let s = 0; s <= 15; s++) {
                const currentStat = calculatePvPStat(stats, a, d, s, cpCap, lvCap);
                arrD.push(currentStat);
                sortedRanks.push(currentStat);
            }
            arrA.push(arrD);
        }
        combinations.push(arrA);
    }
    sortedRanks.sort((a, b) => b.value - a.value);
    const best = sortedRanks[0].value;
    for (let i = 0, j = 0; i < sortedRanks.length; i++) {
        const entry = sortedRanks[i];
        entry.percentage = Number((entry.value / best).toFixed(5));
        if (entry.value < sortedRanks[j].value) {
            j = i;
        }
        entry.rank = j + 1;
    }
    return { combinations, sortedRanks };
};

module.exports = { calculateCpMultiplier, calculateCP, calculateRanks };
