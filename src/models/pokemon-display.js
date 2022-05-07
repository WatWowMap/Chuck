const util = require('util');

class PokemonDisplay {
    /**
     * Two PokemonProtos are considered the same spawn if they have the same PokemonDisplay.
     *
     * @param pokemonId
     * @param form
     * @param costume
     * @param gender
     */
    constructor(pokemonId, form, costume, gender) {
        this.pokemonId = pokemonId;
        this.form = form;
        this.costume = costume;
        this.gender = gender;
    }

    static fromProtos(pokemonId, display) {
        return new PokemonDisplay(pokemonId, display.form, display.costume, display.gender);
    }

    equals(other) {
        return this.pokemonId === other.pokemonId &&
            this.form === other.form &&
            this.costume === other.costume &&
            this.gender === other.gender;
    }

    toString() {
        return `${this.pokemonId},${this.form},${this.costume},${this.gender}`;
    }

    [util.inspect.custom]() {
        return this.toString();
    }
}

module.exports = PokemonDisplay;
