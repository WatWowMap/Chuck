const {Op} = require('sequelize');
const {S1Angle, S2Cell, S2CellId, S2LatLng} = require('nodes2ts');

const masterfile = require('../../static/data/masterfile.json');
const Pokemon = require('../models/pokemon.js');
const Weather = require('../models/weather.js');
const pvpManager = require('./pvp.js');
const RedisClient = require('./redis.js');
const WebhookController = require('./webhook.js');

class WeatherCell {
    constructor(weather, id, username) {
        if (id === undefined) {
            this.id = weather.id;
            this.weather = weather.gameplayCondition;
            this.username = null;
            this.lastUpdated = 0;
        } else {
            console.info('[WeatherCell] new cell added to monitor', id);
            this.id = id;
            this.weather = weather;
            this.username = username;
            this.lastUpdated = Date.now();
        }
    }

    async update(weather, username) {
        const now = Date.now();
        if (weather !== this.weather) {
            console.info('[WeatherCell] Cell', this.id,
                'changed from', this.weather, 'by', this.username, 'at', this.lastUpdated && new Date(this.lastUpdated),
                'to', weather, 'by', username);
            const s2cell = new S2Cell(new S2CellId(this.id));
            const rect = s2cell.getRectBound();
            const where = {
                lat: rect.lat.lo < rect.lat.hi ? {
                    [Op.between]: [new S1Angle(rect.lat.lo).degrees(), new S1Angle(rect.lat.hi).degrees()],
                } : {
                    [Op.or]: {
                        [Op.lt]: new S1Angle(rect.lat.hi).degrees(),
                        [Op.gt]: new S1Angle(rect.lat.lo).degrees(),
                    },
                },
                lon: { [Op.between]: [new S1Angle(rect.lng.lo).degrees(), new S1Angle(rect.lng.hi).degrees()] },
                // if the timer is not verified and incorrect, it will be recalculated when reseen
                expireTimestamp: { [Op.gt]: now / 1000 },
                // skip entries with no IVs, which includes the ones without accurate location
                [Op.not]: {
                    atkIv: null,
                    atkInactive: null,
                },
            };
            const boosted = [
                [],
                ['Grass', 'Fire', 'Ground'],
                ['Water', 'Electric', 'Bug'],
                ['Normal', 'Rock'],
                ['Fairy', 'Fighting', 'Poison'],
                ['Flying', 'Dragon', 'Psychic'],
                ['Ice', 'Steel'],
                ['Dark', 'Ghost'],
            ][weather];
            try {
                const [redis, webhook] = await Pokemon.robustTransaction(async (transaction) => {
                    const impacted = await Pokemon.findAll({
                        where,
                        transaction,
                        lock: transaction.LOCK,
                    });
                    let counter = 0;
                    const redis = [], webhook = [];
                    for (const pokemon in impacted) {
                        if (!s2cell.contains(S2LatLng.fromDegrees(pokemon.lat, pokemon.lon).toPoint())) continue;
                        const pokemonMaster = masterfile.pokemon[pokemon.pokemonId];
                        if (!pokemonMaster) continue;
                        let newWeather = 0;
                        for (const type of (pokemonMaster.forms[pokemon.form] || {}).types || pokemonMaster.types) {
                            if (boosted.indexOf(type) >= 0) {
                                newWeather = weather;
                                break;
                            }
                        }
                        if (pokemon.weather === newWeather) continue;
                        if (pokemon.setWeather(newWeather)) {
                            await pokemon.populateAuxFields(false, pvpManager);
                            redis.push(pokemon);
                            if (pokemon.atkIv !== null) webhook.push(pokemon);
                        }
                        pokemon.save();
                        ++counter;
                    }
                    console.info('[WeatherCell] Locked', impacted.length, 'Updated', counter,
                        'Redis', redis.length, 'Webhook', webhook.length);
                    return [redis, webhook];
                });
                if (RedisClient) for (const pokemon of redis) await pokemon.redisCallback();
                for (const pokemon of webhook) WebhookController.instance.addPokemonEvent(pokemon.toJson());
            } catch (e) {
                console.warn('[WeatherCell] Failed to update Pokemon in cell', this.id, e);
            }
        }
        this.weather = weather;
        this.username = username;
        this.lastUpdated = now;
    }
}

const weatherCells = {};

async function initWeather() {
    for (const weather of await Weather.findAll()) weatherCells[weather.id] = new WeatherCell(weather);
}

function reportWeather(username, update) {
    return Promise.all(update.map(async ([id, weather]) => {
        const weatherCell = weatherCells[id];
        if (weatherCell === undefined) weatherCells[id] = new WeatherCell(weather, id, username);
        else await weatherCell.update(weather, username);
    }));
}

module.exports = {
    initMaster: async (ipcMaster) => {
        await initWeather();
        ipcMaster.registerCallback('reportWeather', reportWeather);
    },
};
