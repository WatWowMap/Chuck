'use strict';

const masterfile = require('./masterfile.json');
const cpMultiplier = require('./cp_multiplier.json');
const redisClient = require('../src/services/redis.js');
//const fs = require('fs-extra');

let pokemon = {};
let pokemonObject = masterfile.pokemon;


const calculateAllRanks = async () => {
    for (let pokemonId in pokemonObject) {
        if (pokemonObject[pokemonId].attack) {
            calculateTopRanks(pokemonId, -1, 1500);
        }
        for (let formId in pokemonObject[pokemonId].forms) {
            if (pokemonObject[pokemonId].forms[formId].attack) {
                calculateTopRanks(pokemonId, formId, 1500);
            }
        }
    }

    //fs.writeFileSync('./great_pvp_ranks.json',JSON.stringify(pokemon, null, 4));
    console.log('[PvP] About to write great_league pvp data to SQL table');
    await writePvPData(pokemon, 'great_league');
    console.log('[PvP] Done writing great_league data to SQL');


    for (let pokemonId in pokemonObject) {
        if (pokemonObject[pokemonId].attack) {
            calculateTopRanks(pokemonId, -1, 2500);
        }
        for (let formId in pokemonObject[pokemonId].forms) {
            if (pokemonObject[pokemonId].forms[formId].attack) {
                calculateTopRanks(pokemonId, formId, 2500);
            }
        }
    }

    //fs.writeFileSync('./ultra_pvp_ranks.json',JSON.stringify(pokemon, null, 4));
    console.log('[PvP] About to write ultra_league pvp data to SQL table');
    await writePvPData(pokemon, 'ultra_league');
    console.log('[PvP] Done writing ultra_league data to SQL');

    console.log('[PvP] Done writing all data. Exiting the script.');
    process.exit();
};

const calculateTopRanks = (pokemonId, formId, cap) => {
    console.log('[PvP] Calculating Top Ranks for:', masterfile.pokemon[pokemonId].name, '(' + pokemonId + ')', 'with form id:', formId);
    let currentPokemon = initializeBlankPokemon();
    let bestStat = { attack: 0, defense: 0, stamina: 0, value: 0 };
    let arrayToSort = [];

    if (!pokemon[pokemonId]) {
        pokemon[pokemonId] = {};
    }

    for (let a = 0; a <= 15; a++) {
        for (let d = 0; d <= 15; d++) {
            for (let s = 0; s <= 15; s++) {
                let currentStat = calculateBestPvPStat(pokemonId, formId, a, d, s, cap);
                if(currentStat > bestStat.value) {
                    bestStat = { attack: a, defense: d, stamina: s, value: currentStat.value, level: currentStat.level };
                }
                currentPokemon[a][d][s] = { value: currentStat.value, level: currentStat.level, cp: currentStat.cp };
                arrayToSort.push({ attack: a, defense: d, stamina: s, value: currentStat.value });
            }
        }
    }

    arrayToSort.sort((a, b) => b.value - a.value);
    const best = arrayToSort[0].value;
    for (let i = 0; i < arrayToSort.length; i++) {
        let percent = precisionRound((arrayToSort[i].value / best) * 100, 2);
        arrayToSort[i].percent = percent;
        currentPokemon[arrayToSort[i].attack][arrayToSort[i].defense][arrayToSort[i].stamina].percent = percent;
        currentPokemon[arrayToSort[i].attack][arrayToSort[i].defense][arrayToSort[i].stamina].rank = i + 1;
    }

    if (formId >= 0) {
        if (!pokemon[pokemonId].forms) {
            pokemon[pokemonId].forms = {};
        }
        pokemon[pokemonId].forms[formId] = currentPokemon;
    } else {
        pokemon[pokemonId] = currentPokemon;
    }
    return currentPokemon;
};

const calculateBestPvPStat = (pokemonId, formId, attack, defense, stamina, cap) => {
    let bestStat = 0;
    let level = 0;
    let bestCP = 0;
    for (let i = 1; i <= 40; i += 0.5) {
        let cp = calculateCP(pokemonId, formId, attack, defense, stamina, i);
        if(cp <= cap) {
            let stat = calculatePvPStat(pokemonId, formId, i, attack, defense, stamina);
            if (stat > bestStat) {
                bestStat = stat;
                level = i;
                bestCP = cp;
            }
        }
    }
    return { value: bestStat, level: level, cp: bestCP };
};

const calculatePvPStat = (pokemonId, formId, level, attack, defense, stamina) => {
    const pokemonAttack = formId >= 0 && pokemonObject[pokemonId].forms[formId].attack
        ? pokemonObject[pokemonId].forms[formId].attack
        : pokemonObject[pokemonId].attack;
    const pokemonDefense = formId >= 0 && pokemonObject[pokemonId].forms[formId].defense
        ? pokemonObject[pokemonId].forms[formId].defense
        : pokemonObject[pokemonId].defense;
    const pokemonStamina = formId >= 0 && pokemonObject[pokemonId].forms[formId].stamina
        ? pokemonObject[pokemonId].forms[formId].stamina
        : pokemonObject[pokemonId].stamina;
    return Math.round(
        (attack + pokemonAttack) * cpMultiplier[level] *
        (defense + pokemonDefense) * cpMultiplier[level] *
        (stamina + pokemonStamina) * cpMultiplier[level]);
};

const calculateCP = (pokemonId, formId, attack , defense, stamina, level) => {
    const multiplier = Math.pow(cpMultiplier[level], 2);

    const pokemonAttack = (formId >= 0 && pokemonObject[pokemonId].forms[formId].attack) ? pokemonObject[pokemonId].forms[formId].attack : pokemonObject[pokemonId].attack;
    const pokemonDefense = (formId >= 0 && pokemonObject[pokemonId].forms[formId].defense) ? pokemonObject[pokemonId].forms[formId].defense : pokemonObject[pokemonId].defense;
    const pokemonStamina = (formId >= 0 && pokemonObject[pokemonId].forms[formId].stamina) ? pokemonObject[pokemonId].forms[formId].stamina : pokemonObject[pokemonId].stamina;

    const attackMultiplier = pokemonAttack + parseInt(attack);
    const defenseMultiplier = Math.pow(pokemonDefense + parseInt(defense), 0.5);
    const staminaMultiplier = Math.pow(pokemonStamina + parseInt(stamina), 0.5);

    const cp = Math.floor((attackMultiplier * defenseMultiplier * staminaMultiplier * multiplier) / 10);
    return cp < 10 ? 10 : cp;
};

const initializeBlankPokemon = () => {
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
};

const precisionRound = (number, precision) => {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
};

const writePvPData = async (data, league) => {
    for (let pokemon in data) {
        if (data[pokemon].forms) {
            for (let form in data[pokemon].forms) {
                console.log('[PvP] Inserting pokemon_id', pokemon, 'with form_id', form);
                const currentPokemon = data[pokemon].forms[form];
                await insertCurrentPokemon(league, parseInt(pokemon), parseInt(form), currentPokemon);
            }
        } else {
            console.log('[PvP] Inserting pokemon_id', pokemon, 'with no form');
            const currentPokemon = data[pokemon];
            await insertCurrentPokemon(league, parseInt(pokemon), 0, currentPokemon);
        }
    }
};

const insertCurrentPokemon = async (league, pokemonId, formId, pokemon) => {
    for (let attack in pokemon) {
        for (let defense in pokemon[attack]) {
            for (let stamina in pokemon[attack][defense]) {
                const currentValue = pokemon[attack][defense][stamina];
                const value = {
                    pokemon_id: pokemonId,
                    form_id: formId,
                    attack: attack,
                    defense: defense,
                    stamina: stamina,
                    cp: currentValue.cp,
                    level: currentValue.level,
                    percent: currentValue.percent / 100,
                    rank: currentValue.rank,
                    value: currentValue.value
                };
                const key = `${pokemonId}-${formId}-${attack}-${defense}-${stamina}`;
                await redisClient.hset(league, key, value);
            }
        }
    }
};

calculateAllRanks();
