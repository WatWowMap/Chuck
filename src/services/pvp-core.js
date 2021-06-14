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

const calculateStats = (stats, attack, defense, stamina, level) => {
    const multiplier = calculateCpMultiplier(level);
    const hp = Math.floor((stamina + stats.stamina) * multiplier);
    return {
        atk: (attack + stats.attack) * multiplier,
        def: (defense + stats.defense) * multiplier,
        sta: hp < 10 ? 10 : hp,
        level,
    };
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
    const result = calculateStats(stats, attack, defense, stamina, lowest);
    result.cp = bestCP;
    result.value = result.atk * result.def * result.sta;
    return result;
};

const strictlyDominates = (a, b) => a.atk >= b.atk && a.def >= b.def && a.sta >= b.sta &&
    (a.atk !== b.atk || a.def !== b.def || a.sta !== b.sta);

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
                for (const other of sortedRanks) {
                    if (other.rank === null) {
                        continue;
                    }
                    if (strictlyDominates(other, currentStat)) {
                        currentStat.rank = null;
                        break;
                    }
                    if (strictlyDominates(currentStat, other)) {
                        other.rank = null;
                    }
                }
                sortedRanks.push(currentStat);
            }
            arrA.push(arrD);
        }
        combinations.push(arrA);
    }
    sortedRanks.sort((a, b) => {
        const d = b.value - a.value;
        return d === 0 ? a.sta - b.sta : d;
    });
    let lastStat, nextRank = 1;
    for (const stat of sortedRanks) {
        if (stat.rank === null) {
            continue;
        }
        if (lastStat === undefined || stat.value < lastStat.value) {
            lastStat = stat;
            stat.rank = nextRank;
        } else {
            stat.rank = lastStat.rank;
        }
        ++nextRank;
    }
    const best = sortedRanks[0].value, worst = lastStat.value;
    for (const stat of sortedRanks) {
        stat.percentage = best === worst ? stat.value === best ? 1 : -Infinity : (stat.value - worst) / (best - worst);
        delete stat.atk;
        delete stat.def;
        delete stat.sta;
    }
    return { combinations, sortedRanks };
};

module.exports = { calculateCpMultiplier, calculateCP, calculateRanks };
