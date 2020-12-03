'use strict';

const LRU = require('lru-cache');
const rpc = require('purified-protos');
const masterfile = require('../../static/data/masterfile.json');
const config = require('./config.js');
const { calculateCP, calculateRanks } = require('./pvp-core.js');

const rankCache = new LRU({
    maxAge: config.dataparser.pvp.rankCacheAge,
    updateAgeOnGet: true,
});
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
                const { combinations } = calculateRanks(stats, cpCap, lvCap);
                if (combinationIndex === undefined) {
                    combinationIndex = { [lvCap]: combinations };
                } else {
                    combinationIndex[lvCap] = combinations;
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
    const masterForm = formId ? masterPokemon.forms[formId] || masterPokemon : masterPokemon;
    const baseEntry = { pokemon: pokemonId };
    if (formId) {
        baseEntry.form = formId;
    }
    const pushAllEntries = (stats, evolution = 0) => {
        const allRanks = calculateAllRanks(stats);
        for (const [leagueName, combinationIndex] of Object.entries(allRanks)) {
            for (const [lvCap, combinations] of Object.entries(combinationIndex)) {
                const ivEntry = combinations[attack][defense][stamina];
                if (level > ivEntry.level) {
                    continue;
                }
                const entry = { ...baseEntry, cap: parseFloat(lvCap), ...ivEntry };
                if (evolution) {
                    entry.evolution = evolution;
                }
                if (combinations.maxed) {
                    entry.capped = true;
                }
                if (!result[leagueName]) {
                    result[leagueName] = [];
                }
                entry.value = Math.floor(entry.value);
                result[leagueName].push(entry);
            }
        }
    };
    pushAllEntries(masterForm.attack ? masterForm : masterPokemon);
    let canEvolve = true;
    if (costumeId) {
        const costumeName = (await rpc()).PokemonDisplayProto.Costume[costumeId];
        canEvolve = costumeName.endsWith('_NOEVOLVE') || costumeName.endsWith('_NO_EVOLVE');
    }
    if (canEvolve && masterForm.evolutions) {
        for (const evolution of masterForm.evolutions) {
            if (evolution.gender_requirement && gender !== evolution.gender_requirement) {
                continue;
            }
            // reset costume since we know it can evolve
            const evolvedRanks = await queryPvPRank(evolution.pokemon, evolution.form || 0, 0,
                attack, defense, stamina, level, gender);
            for (const [leagueName, results] of Object.entries(evolvedRanks)) {
                result[leagueName] = result[leagueName] ? result[leagueName].concat(results) : results;
            }
        }
    }
    if (masterForm.temp_evolutions) {
        for (const [tempEvoId, tempEvo] of Object.entries(masterForm.temp_evolutions)) {
            pushAllEntries(tempEvo.attack ? tempEvo : masterPokemon.temp_evolutions[tempEvoId], parseInt(tempEvoId));
        }
    }
    return result;
};

module.exports = {
    initMaster: (ipcMaster) => {
        ipcMaster.registerCallback('queryPvPRank', queryPvPRank);
    },
};
