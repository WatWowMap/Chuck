'use strict';

const Ohbem = require('ohbem');
const masterfile = require('../../static/data/masterfile.json');
const config = require('./config.js');

const ohbem = new Ohbem({
    leagues: config.dataparser.pvp.leagues,
    levelCaps: config.dataparser.pvp.levelCaps,
    pokemonData: masterfile,
    cachingStrategy: Ohbem.cachingStrategies.lru({
        maxAge: config.dataparser.pvp.rankCacheAge,
        updateAgeOnGet: true,
    }, true),
});
const queryPvPRank = async (pokemonId, form, costume, gender, attack, defense, stamina, level) => {
    return ohbem.queryPvPRank(pokemonId, form, costume, gender, attack, defense, stamina, level);
};
const queryCp = async (pokemonId, form, attack, defense, stamina, level) => {
    const masterPokemon = masterfile.pokemon[pokemonId];
    const masterForm = form ? masterPokemon.forms[form] || masterPokemon : masterPokemon;
    return Ohbem.calculateCp(masterForm.attack ? masterForm : masterPokemon, attack, defense, stamina, level);
};

module.exports = {
    initMaster: (ipcMaster) => {
        ipcMaster.registerCallback('queryPvPRank', queryPvPRank);
        ipcMaster.registerCallback('queryCp', queryCp);
    },
    queryPvPRank,
    queryCp,
};
