const {Op} = require('sequelize');
const {S1Angle, S2Cell, S2CellId, S2LatLng} = require('nodes2ts');

const masterfile = require('../../static/data/masterfile.json');
const Pokemon = require('../models/pokemon.js');
const Weather = require('../models/weather.js');
const pvpManager = require('./pvp.js');
const RedisClient = require('./redis.js');
const WebhookController = require('./webhook.js');

const weatherCells = {};
let updateWorking = false;

async function requestUpdate() {
    if (updateWorking) return;
    updateWorking = true;
    try {
        let cell;
        while ((cell = Object.values(weatherCells).find((cell) => cell.pendingWeather !== null))) {
            await cell.performUpdate();
        }
    } finally {
        updateWorking = false;
    }
}

class WeatherCell {
    constructor(weather, id, username) {
        if (id === undefined) {
            this.id = weather.id.toString();
            this.weather = weather.gameplayCondition;
            this.username = null;
            this.lastUpdated = 0;
        } else {
            this.id = id.toString();
            this.weather = weather;
            this.username = username;
            this.lastUpdated = Date.now();
        }
        this.pendingWeather = null;
        new S2Cell(new S2CellId(this.id));  // if invalid will throw
    }

    update(weather, username) {
        if (weather !== this.weather && weather !== this.pendingWeather) {
            console.info('[WeatherCell] Cell', this.id, 'changed from',
                this.pendingWeather === null ? this.weather : this.pendingWeather, 'by', this.username, 'at',
                this.lastUpdated ? new Date(this.lastUpdated).toLocaleTimeString() : null, 'to', weather,
                'by', username);
            this.pendingWeather = weather;
            requestUpdate();
        }
        this.username = username;
        this.lastUpdated = Date.now();
    }

    async performUpdate() {
        const weather = this.pendingWeather;
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
            expireTimestamp: { [Op.gt]: Date.now() / 1000 },
            // skip entries with no IVs, which includes the ones without accurate location
            [Op.not]: {
                atkIv: null,
                atkInactive: null,
            },
            weather: { [Op.ne]: weather },
        };
        const boosted = masterfile.weather[weather];
        try {
            const [redis, webhook] = await Pokemon.robustTransaction(async (transaction) => {
                if (this.pendingWeather !== weather) return [[], []];
                const impacted = await Pokemon.findAll({
                    where,
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });
                let counter = 0;
                const redis = [], webhook = [];
                for (const pokemon of impacted) {
                    if (!s2cell.contains(S2LatLng.fromDegrees(pokemon.lat, pokemon.lon).toPoint())) continue;
                    const pokemonMaster = masterfile.pokemon[pokemon.pokemonId];
                    if (!pokemonMaster) continue;
                    const newWeather = ((pokemonMaster.forms[pokemon.form] || {}).types || pokemonMaster.types)
                        .some((type) => boosted.indexOf(type) >= 0) ? weather : 0;
                    if (pokemon.weather === newWeather) continue;
                    if (pokemon.setWeather(newWeather)) {
                        await pokemon.populateAuxFields(false, pvpManager);
                        redis.push(pokemon);
                        if (pokemon.atkIv !== null) webhook.push(pokemon);
                    }
                    await pokemon.save({ transaction });
                    ++counter;
                }
                console.info('[WeatherCell] Cell', this.id, 'Locked', impacted.length, 'Updated', counter,
                    'Redis', redis.length, 'Webhook', webhook.length);
                return [redis, webhook];
            });
            if (RedisClient) for (const pokemon of redis) await pokemon.redisCallback(weather);
            for (const pokemon of webhook) WebhookController.instance.addPokemonEvent(pokemon.toJson());
        } catch (e) {
            console.warn('[WeatherCell] Failed to update Pokemon in cell', this.id, e);
        }
        if (weather === this.pendingWeather) {
            this.weather = this.pendingWeather;
            this.pendingWeather = null;
        }
    }
}

async function initWeather() {
    for (const weather of await Weather.findAll()) {
        try {
            weatherCells[weather.id.toString()] = new WeatherCell(weather);
        } catch (e) {
            console.warn('Unrecognized weather db entry', weather, e);
        }
    }
}

function reportWeather(username, update) {
    update.forEach(([id, weather]) => {
        try {
            const weatherCell = weatherCells[id];
            if (weatherCell === undefined) weatherCells[id.toString()] = new WeatherCell(weather, id, username);
            else weatherCell.update(weather, username);
        } catch (e) {
            console.warn('Unrecognized weather cell id', id, e);
        }
    });
}

module.exports = {
    initMaster: async (ipcMaster) => {
        await initWeather();
        ipcMaster.registerCallback('reportWeather', reportWeather);
    },
};
