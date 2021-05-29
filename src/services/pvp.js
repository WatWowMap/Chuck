'use strict';

const LRU = require('lru-cache');
const POGOProtos = require('pogo-protos');
const masterfile = require('../../static/data/masterfile.json');
const config = require('./config.js');
const { calculateHP, calculateCP, calculateRanks } = require('./pvp-core.js');

const rankCache = new LRU({
    maxAge: config.dataparser.pvp.rankCacheAge,
    updateAgeOnGet: true,
});
const maxLevel = 100;
const calculateAllRanks = (stats, cpCap) => {
    const key = `${stats.attack},${stats.defense},${stats.stamina},${cpCap}`;
    let combinationIndex = rankCache.get(key);
    if (combinationIndex === undefined) {
        combinationIndex = null;
        let maxed = false;
        for (const lvCap of config.dataparser.pvp.levelCaps) {
            if (calculateCP(stats, 15, 15, 15, lvCap) <= cpCap) {
                continue;   // not viable
            }
            const { combinations } = calculateRanks(stats, cpCap, lvCap);
            if (combinationIndex === null) {
                combinationIndex = { [lvCap]: combinations };
            } else {
                combinationIndex[lvCap] = combinations;
            }
            // check if no more power up is possible: further increasing the cap will not be relevant
            if (calculateCP(stats, 0, 0, 0, lvCap + .5) > cpCap) {
                maxed = true;
                break;
            }
        }
        if (combinationIndex !== null && !maxed) {
            combinationIndex[maxLevel] = calculateRanks(stats, cpCap, maxLevel).combinations;
        }
        rankCache.set(key, combinationIndex);
    }
    return combinationIndex;
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
    result.cp = calculateCP(masterForm.attack ? masterForm : masterPokemon, attack, defense, stamina, level);
    const pushAllEntries = (stats, evolution = 0) => {
        for (const [leagueName, cpCap] of Object.entries(config.dataparser.pvp.leagues)) {
            const entries = [];
            if (cpCap !== null) {
                if (leagueName.startsWith('little') && !(stats.little || masterPokemon.little)) {
                    continue;
                }
                const combinationIndex = calculateAllRanks(stats, cpCap);
                if (combinationIndex === null) {
                    continue;
                }
                for (const [lvCap, combinations] of Object.entries(combinationIndex)) {
                    const ivEntry = combinations[attack][defense][stamina];
                    if (level > ivEntry.level) {
                        continue;
                    }
                    const entry = {...baseEntry, cap: parseFloat(lvCap), ...ivEntry};
                    if (evolution) {
                        entry.evolution = evolution;
                    }
                    entry.value = Math.floor(entry.value);
                    entries.push(entry);
                }
                if (entries.length === 0) {
                    continue;
                }
                let last = entries[entries.length - 1];
                while (entries.length >= 2) {   // remove duplicate ranks at highest caps
                    const secondLast = entries[entries.length - 2];
                    if (secondLast.level !== last.level || secondLast.rank !== last.rank) {
                        break;
                    }
                    entries.pop();
                    last = secondLast;
                }
                if (last.cap < maxLevel) {
                    last.capped = true;
                } else {
                    if (entries.length === 1) {
                        continue;
                    }
                    entries.pop();
                }
            } else if (!evolution && attack === 15 && defense === 15 && stamina < 15) {
                // Temporary evolutions always preserve HP
                for (const lvCap of config.dataparser.pvp.levelCaps) {
                    if (calculateHP(stats, stamina, lvCap) === calculateHP(stats, 15, lvCap)) {
                        entries.push({...baseEntry, level: parseFloat(lvCap), rank: 1, percentage: 1});
                    }
                }
            }
            if (entries.length > 0) {
                result[leagueName] = result[leagueName] ? result[leagueName].concat(entries) : entries;
            }
        }
    };
    pushAllEntries(masterForm.attack ? masterForm : masterPokemon);
    let canEvolve = true;
    if (costumeId) {
        const costumeName = POGOProtos.Rpc.PokemonDisplayProto.Costume[costumeId];
        canEvolve = !costumeName.endsWith('_NOEVOLVE') && !costumeName.endsWith('_NO_EVOLVE');
    }
    if (canEvolve && masterForm.evolutions) {
        for (const evolution of masterForm.evolutions) {
            switch (evolution.pokemon) {
                case POGOProtos.Rpc.HoloPokemonId.HITMONLEE:
                    if (attack < defense || attack < stamina) {
                        continue;
                    }
                    break;
                case POGOProtos.Rpc.HoloPokemonId.HITMONCHAN:
                    if (defense < attack || defense < stamina) {
                        continue;
                    }
                    break;
                case POGOProtos.Rpc.HoloPokemonId.HITMONTOP:
                    if (stamina < attack || stamina < defense) {
                        continue;
                    }
                    break;
            }
            if (evolution.gender_requirement && gender !== evolution.gender_requirement) {
                continue;
            }
            // reset costume since we know it can evolve
            const evolvedRanks = await queryPvPRank(evolution.pokemon, evolution.form || 0, 0,
                attack, defense, stamina, level, gender);
            for (const [leagueName, results] of Object.entries(evolvedRanks)) {
                if (leagueName !== 'cp') {
                    result[leagueName] = result[leagueName] ? result[leagueName].concat(results) : results;
                }
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
