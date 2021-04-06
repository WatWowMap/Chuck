const assert = require('assert');
const { calculateCpMultiplier, calculateCP, calculateRanks } = require('../src/services/pvp-core.js');

const cpMultipliers = require('../static/data/cp_multiplier.json');
const masterfile = require('../static/data/masterfile.json');

describe('PvP', () => {
    it('calculateCpMultiplier', () => {
        for (const [key, value] of Object.entries(cpMultipliers)) {
            const level = parseFloat(key);
            if (level < 40) {
                continue;
            }
            // predicted CP multiplier must be consistent for L40+
            assert.strictEqual(calculateCpMultiplier(level, true).toFixed(13), value.toFixed(13), 'CP multiplier at level ' + level);
        }
    });
    it('calculateCP', () => {
        assert.strictEqual(calculateCP(masterfile.pokemon[150], 15, 15, 15, 40), 4178, 'Mewtwo CP');
        assert.strictEqual(calculateCP(masterfile.pokemon[618], 15, 15, 15, 51), 2474, 'Stunfisk CP');
    });
    it('calculateRanks', () => {
        assert.strictEqual(calculateRanks(masterfile.pokemon[26], 1500, 40).combinations[15][15][15].rank, 742, 'Hundo Raichu rank');
        assert.strictEqual(calculateRanks(masterfile.pokemon[351], 1500, 51).combinations[4][14][15].rank, 56, 'Weather boosted Castform rank');
        assert.strictEqual(calculateRanks(masterfile.pokemon[660], 1500, 100).combinations[0][15][11].rank, 1, 'Diggersby uncapped rank');
        assert.strictEqual(calculateRanks(masterfile.pokemon[663], 2500, 51).combinations[13][15][15].rank, 1, 'Talonflame functionally perfect @15');
        assert.strictEqual(calculateRanks(masterfile.pokemon[663], 2500, 51).combinations[13][15][14].rank, 1, 'Talonflame functionally perfect @14');
    });
});
