const assert = require('assert');
const pvp = require('../src/services/pvp.js')._test;

const masterfile = require('../static/data/masterfile.json');

describe('PvP', () => {
    it('calculateCP', () => {
        assert.strictEqual(pvp.calculateCP(masterfile.pokemon[150], 15, 15, 15, 40), 4178, 'Mewtwo CP');
        assert.strictEqual(pvp.calculateCP(masterfile.pokemon[618], 15, 15, 15, 51), 2474, 'Stunfisk CP');
    });
    it('calculateRanks', () => {
        assert.strictEqual(pvp.calculateRanks(masterfile.pokemon[26], 1500, 40).combinations[15][15][15].rank, 742, 'Hundo Raichu rank');
    });
});
