'use strict';

const masterfile = require('../../static/data/masterfile.json');
const redisClient = require('./redis.js');

/*
function calculateCP(pokemonId, formId, attack , defense, stamina, level) {
    let cp = 0;
    let pokemonAttack = 0, pokemonDefense = 0, pokemonStamina = 0;
    let cpMultiplier = cpMultipliers[level];

    if (!masterfile.pokemon[pokemonId]) {
        console.log(`Can't find Pokemon ID: ${pokemonId} Form: ${formId}`);
        return null;
    }
    if (!masterfile.pokemon[pokemonId].attack){
        if (!masterfile.pokemon[pokemonId].forms[formId] || !masterfile.pokemon[pokemonId].forms[formId].attack) {
            console.log(`Can't find attack of Pokemon ID: ${pokemonId} Form: ${formId}`);
            return null;
        }
        pokemonAttack = masterfile.pokemon[pokemonId].forms[formId].attack;
        pokemonDefense = masterfile.pokemon[pokemonId].forms[formId].defense;
        pokemonStamina = masterfile.pokemon[pokemonId].forms[formId].stamina;
    } else {
        pokemonAttack = masterfile.pokemon[pokemonId].attack;
        pokemonDefense = masterfile.pokemon[pokemonId].defense;
        pokemonStamina = masterfile.pokemon[pokemonId].stamina;
    }

    let attackMultiplier = pokemonAttack + parseInt(attack);
    let defenseMultiplier = Math.pow(pokemonDefense + parseInt(defense), 0.5);
    let staminaMultiplier = Math.pow(pokemonStamina + parseInt(stamina), 0.5);
    cpMultiplier = Math.pow(cpMultiplier, 2);

    cp = Math.floor((attackMultiplier * defenseMultiplier * staminaMultiplier * cpMultiplier) / 10);
    return cp < 10 ? 10 : cp;
}

function calculateTopRanks(pokemonId, formId, cap) {
    let currentPokemon = initializeBlankPokemon();
    let bestStat = { attack: 0, defense: 0, stamina: 0, value: 0 };
    let arrayToSort = [];

    for(let a = 0; a <= 15; a++) {
        for(let d = 0; d <= 15; d++) {
            for(let s = 0; s <= 15; s++) {
                let currentStat = calculateBestPvPStat(pokemonId, formId, a, d, s, cap);
                if(currentStat > bestStat.value) {
                    bestStat = { attack: a, defense: d, stamina: s, value: currentStat.value, level: currentStat.level };
                }
                currentPokemon[a][d][s] = { value: currentStat.value, level: currentStat.level };
                arrayToSort.push({attack:a, defense:d, stamina:s, value:currentStat.value});
            }
        }
    }

    arrayToSort.sort((a,b) => b.value - a.value);
    let best = arrayToSort[0].value;
    for (let i = 0; i < arrayToSort.length; i++) {
        let percent = precisionRound((arrayToSort[i].value / best) * 100, 2);
        arrayToSort[i].percent = percent;
        currentPokemon[arrayToSort[i].attack][arrayToSort[i].defense][arrayToSort[i].stamina].percent = percent;
        currentPokemon[arrayToSort[i].attack][arrayToSort[i].defense][arrayToSort[i].stamina].rank = i + 1;
    }
    return currentPokemon;
}

function calculateBestPvPStat(pokemonId, formId, attack, defense, stamina, cap) {
    let bestStat = 0;
    let level = 0;
    for (let i = 1; i <= 40; i += 0.5) {
        let cp = calculateCP(pokemonId, formId, attack, defense, stamina, i);
        if (cp <= cap) {
            let stat = calculatePvPStat(pokemonId, formId, i, attack, defense, stamina);
            if (stat > bestStat) {
                bestStat = stat;
                level = i;
            }
        }
        else if (cp > cap) {
          i = 41;
        }
    }
    return { value: bestStat, level: level };
}

function calculatePvPStat(pokemonId, formId, level, attack, defense, stamina) {
    let cpMultiplier = cpMultipliers[level];
    if (!masterfile.pokemon[pokemonId].attack) {
        attack = (attack + masterfile.pokemon[pokemonId].forms[formId].attack) * cpMultiplier;
        defense = (defense + masterfile.pokemon[pokemonId].forms[formId].defense) * cpMultiplier;
        stamina = (stamina + masterfile.pokemon[pokemonId].forms[formId].stamina) * cpMultiplier;
    } else {
        attack = (attack + masterfile.pokemon[pokemonId].attack) * cpMultipliers[level];
        defense = (defense + masterfile.pokemon[pokemonId].defense) * cpMultiplier;
        stamina = (stamina + masterfile.pokemon[pokemonId].stamina) * cpMultiplier;
    }
    return Math.round(attack * defense * Math.floor(stamina));
}

function initializeBlankPokemon() {
    let newPokemon = {};
    for (let a = 0; a <= 15; a++) {
        newPokemon[a] = {};
        for (let d = 0; d <= 15; d++) {
            newPokemon[a][d] = {};
            for (let s = 0; s <= 15; s++) {
                newPokemon[a][d][s] = {};
            }
        }
    }
    return newPokemon;
}

function precisionRound(number, precision) {
    let factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}

function filterPossibleCPsByRank(possibleCPs, minRank = 4096){
    let returnCPs = {};
    for (let pokemon in possibleCPs) {
        if (possibleCPs[pokemon].rank <= minRank) {
            returnCPs[pokemon] = possibleCPs[pokemon];
        }
    }
    return returnCPs;
}

function filterPossibleCPsByPercent(possibleCPs, minPercent = 0) {
    let returnCPs = {};
    for (let pokemon in possibleCPs){
        if (possibleCPs[pokemon].percent >= minPercent) {
            returnCPs[pokemon] = possibleCPs[pokemon];
        }
    }
    return returnCPs;
}

function searchTopRank(search, filter) {
    // RUN CALCULATIONS
    let possible_cps = calculatePossibleCPs(search.pokemon.pokemon_id, search.pokemon.form, search.stats.atk, search.stats.def, search.stats.sta, 1, 'Male', filter.min_cp_range, filter.max_cp_range);
    let unique_cps = {}, ranks = {};

    for (let i = possible_cps.length - 1; i >= 0; i--) {
        if (!unique_cps[possible_cps[i].pokemonId]) {
            unique_cps[possible_cps[i].pokemonId] = {};
            pvpRanks = calculateTopRanks(possible_cps[i].pokemonId, possible_cps[i].formId, filter.max_cp_range);
            ranks = pvpRanks[search.stats.atk][search.stats.def][search.stats.sta];
            for (let a = 0; a <= 15; a++) {
                for (let d = 0; d <= 15; d++) {
                    for (let s = 0; s <= 15; s++) {
                        let ads = pvpRanks[a][d][s];
                        if (ads.rank == '1' && calculateCP(search.pokemon.pokemon_id, search.pokemon.form, a, d, s, ads.level) <= filter.max_cp_range) {
                            ranks.topRank = pvpRanks[a][d][s];
                            ranks.topRank.atk = a;
                            ranks.topRank.def = d;
                            ranks.topRank.sta = s;
                        }
                    }
                }
            }
        }
    }
    return ranks;
}
*/

const calculatePossibleCPs = async (pokemonId, formId, attack, defense, stamina, level, gender, league) => {
    return new Promise(async (resolve) => {
        let possibleCPs = [];
        if (isNaN(attack) || isNaN(defense) || isNaN(stamina) || isNaN(level)) {
            return resolve(possibleCPs);
        }

        // Check for required gender on evolution
        if (masterfile.pokemon[pokemonId].gender_requirement &&
            masterfile.pokemon[pokemonId].gender_requirement !== gender) {
            return resolve(possibleCPs);
        }

        let pokemonPvPValue = await queryPvPRank(pokemonId, formId, attack, defense, stamina, level, league);
        if (pokemonPvPValue) {
            possibleCPs.push(pokemonPvPValue);
        }

        // If no data about possible evolutions just return now rather than moving on
        if (!masterfile.pokemon[pokemonId].evolutions) {
            return possibleCPs;
        }

        let evolvedForm;
        for (let i = 0; i < masterfile.pokemon[pokemonId].evolutions.length; i++) {
            // Check for Evolution Form
            if (formId > 0) {
                if (!masterfile.pokemon[pokemonId].forms[formId]) {
                    evolvedForm = masterfile.pokemon[masterfile.pokemon[pokemonId].evolutions[i]].default_form;
                } else {
                    evolvedForm = masterfile.pokemon[pokemonId].forms[formId].evolved_form;
                }
            } else if (masterfile.pokemon[pokemonId].evolved_form) {
                evolvedForm = masterfile.pokemon[pokemonId].evolved_form;
            } else {
                evolvedForm = formId;
            }

            let evolvedCPs =  await calculatePossibleCPs(masterfile.pokemon[pokemonId].evolutions_ids[i], evolvedForm, attack, defense, stamina, level, gender, league);
            possibleCPs = possibleCPs.concat(evolvedCPs);
        }
        return resolve(possibleCPs);
    });
};

const queryPvPRank = async (pokemonId, formId, attack, defense, stamina, level, league) => {
    let form = formId;
    if (!masterfile.pokemon[pokemonId].forms[formId] ||
        !masterfile.pokemon[pokemonId].forms[formId].attack) {
        form = 0;
    }
    const key = league + '_league';
    const field = `${pokemonId}-${form}-${attack}-${defense}-${stamina}`;
    const stats = await redisClient.hget(key, field);
    if (stats && stats.level > level) {
        return stats;
    }
    return null;
};

module.exports = {
    calculatePossibleCPs
};

/*
//227
calculatePossibleCPs(1, 0, 0, 15, 15, 1, null, 'great').then(x => {
    console.log('Great league pvp result:', x);
}).catch(err => {
    console.error('pvp error:', err);
});

calculatePossibleCPs(1, 0, 0, 15, 15, 1, null, 'ultra').then(x => {
    console.log('Ultra league pvp result:', x);
}).catch(err => {
    console.error('pvp error:', err);
});
*/
