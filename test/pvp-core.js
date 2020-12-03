const assert = require('assert');
const { calculateCP, calculateRanks } = require('../src/services/pvp-core.js');

const masterfile = require('../static/data/masterfile.json');

describe('PvP', () => {
    it('calculateCP', () => {
        assert.strictEqual(calculateCP(masterfile.pokemon[150], 15, 15, 15, 40), 4178, 'Mewtwo CP');
        assert.strictEqual(calculateCP(masterfile.pokemon[618], 15, 15, 15, 51), 2474, 'Stunfisk CP');
    });
    it('calculateRanks', () => {
        assert.strictEqual(calculateRanks(masterfile.pokemon[26], 1500, 40).combinations[15][15][15].rank, 742, 'Hundo Raichu rank');
        assert.strictEqual(calculateRanks(masterfile.pokemon[663], 2500, 51).combinations[13][15][15].rank, 1, 'Talonflame functionally perfect @15');
        assert.strictEqual(calculateRanks(masterfile.pokemon[663], 2500, 51).combinations[13][15][14].rank, 1, 'Talonflame functionally perfect @14');
    });
});
