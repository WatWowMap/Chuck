'use strict';

const axios = require('axios');
const { webhooks } = require('./config.js');

/**
 * WebhookController relay class.
 */
class WebhookController {
    static instance = new WebhookController(webhooks.urls, webhooks.delay, webhooks.retryCount, webhooks.polling);

    /**
     * Initialize new WebhookController object.
     * @param {*} urls
     * @param {number} delay
     * @param {number} retryCount
     */
    constructor(urls, delay = 5, retryCount, polling) {
        console.info('[WebhookController] Starting up...');
        this.urls = urls;
        this.delay = delay;
        this.retryCount = retryCount;
        this.polling = polling;
        this.online = new Set();
        this.pokemonEvents = [];
        this.pokestopEvents = [];
        this.lureEvents = [];
        this.invasionEvents = [];
        this.questEvents = [];
        this.gymEvents = [];
        this.gymInfoEvents = [];
        this.raidEvents = [];
        this.eggEvents = [];
        this.weatherEvents = [];
    }

    /**
     * Starts the webhook sending interval timer
     */
    start() {
        this.timer = setInterval(() => this.loopEvents(), this.delay * 1000);
        setInterval(() => this.checkOnline(), this.polling * 1000);
    }

    /**
     * Stops the webhook timer
     */
    stop() {
        // Stop the timer
        clearInterval(this.timer);
    }

    /**
     * Add Pokemon event json to pokemon events queue
     * @param {*} pokemon 
     */
    addPokemonEvent(pokemon) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.pokemonEvents.push(pokemon);
    }

    /**
     * Add Pokestop event json to pokestop events queue
     * @param {*} pokestop 
     */
    addPokestopEvent(pokestop) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.pokestopEvents.push(pokestop);
    }

    /**
     * Add Pokestop lure event json to pokestop lure events queue
     * @param {*} pokestop
     */
    addLureEvent(pokestop) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.lureEvents.push(pokestop);
    }

    /**
     * Add Pokestop invasion event json to pokestop invasion events queue
     * @param {*} pokestop
     */
    addInvasionEvent(pokestop) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.invasionEvents.push(pokestop);
    }

    /**
     * Add Pokestop quest event json to pokestop quest events queue
     * @param {*} pokestop
     */
    addQuestEvent(pokestop) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.questEvents.push(pokestop);
    }

    /**
     * Add Gym event json to gym events queue
     * @param {*} gym
     */
    addGymEvent(gym) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.gymEvents.push(gym);
    }

    /**
     * Add Gym info/details event json to gym info events queue
     * @param {*} gym
     */
    addGymInfoEvent(gym) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.gymInfoEvents.push(gym);
    }

    /**
     * Add raid egg event json to egg events queue
     * @param {*} gym
     */
    addEggEvent(gym) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.eggEvents.push(gym);
    }

    /**
     * Add raid boss event json to raid events queue
     * @param {*} gym
     */
    addRaidEvent(gym) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.raidEvents.push(gym);
    }

    /**
     * Add Weather event json to weather events queue
     * @param {*} weather
     */
    addWeatherEvent(weather) {
        if (!webhooks.enabled || this.urls.length === 0) {
            return;
        }
        this.weatherEvents.push(weather);
    }

    /**
     * Loop through the events and send them off to each webhool url
     */
    loopEvents() {
        let events = [];
        // Check if any queued pokemon events
        if (this.pokemonEvents.length > 0) {
            for (let i = 0; i < this.pokemonEvents.length; i++) {
                // Grab and remove the last pokemon event from the queue
                let pokemonEvent = this.pokemonEvents.pop();
                // Push pokemon event to new events queue with all types
                events.push(pokemonEvent);
            }
        }

        // Check if any queued pokestop events
        if (this.pokestopEvents.length > 0) {
            for (let i = 0; i < this.pokestopEvents.length; i++) {
                // Grab and remove the last pokestop event from the queue
                let pokestopEvent = this.pokestopEvents.pop();
                // Push pokestop event to new events queue with all types
                events.push(pokestopEvent);
            }
        }
        
        // Check if any queued lure events
        if (this.lureEvents.length > 0) {
            for (let i = 0; i < this.lureEvents.length; i++) {
                // Grab and remove the last lure event from the queue
                let lureEvent = this.lureEvents.pop();
                // Push lure event to new events queue with all types
                events.push(lureEvent);
            }
        }
        
        // Check if any queued invasion events
        if (this.invasionEvents.length > 0) {
            for (let i = 0; i < this.invasionEvents.length; i++) {
                // Grab and remove the last invasion event from the queue
                let invasionEvent = this.invasionEvents.pop();
                // Push invasion event to new events queue with all types
                events.push(invasionEvent);
            }
        }
        
        // Check if any queued quest events
        if (this.questEvents.length > 0) {
            for (let i = 0; i < this.questEvents.length; i++) {
                // Grab and remove the last quest event from the queue
                let questEvent = this.questEvents.pop();
                // Push quest event to new events queue with all types
                events.push(questEvent);
            }
        }
        
        // Check if any queued gym events
        if (this.gymEvents.length > 0) {
            for (let i = 0; i < this.gymEvents.length; i++) {
                // Grab and remove the last gym event from the queue
                let gymEvent = this.gymEvents.pop();
                // Push gym event to new events queue with all types
                events.push(gymEvent);
            }
        }
        
        // Check if any queued gym info events
        if (this.gymInfoEvents.length > 0) {
            for (let i = 0; i < this.gymInfoEvents.length; i++) {
                // Grab and remove the last gym info event from the queue
                let gymInfoEvent = this.gymInfoEvents.pop()
                // Push gym info event to new events queue with all types
                events.push(gymInfoEvent);
            }
        }
        
        // Check if any queued egg events
        if (this.eggEvents.length > 0) {
            for (let i = 0; i < this.eggEvents.length; i++) {
                // Grab and remove the last egg event from the queue
                let eggEvent = this.eggEvents.pop();
                // Push egg event to new events queue with all types
                events.push(eggEvent);
            }
        }
        
        // Check if any queued raid events
        if (this.raidEvents.length > 0) {
            for (let i = 0; i < this.raidEvent.length; i++) {
                // Grab and remove the last raid event from the queue
                let raidEvent = this.raidEvents.pop();
                // Push raid event to new events queue with all types
                events.push(raidEvent);
            }
        }

        // Check if any queued weather events
        if (this.weatherEvents.length > 0) {
            for (let i = 0; i < this.weatherEvents.length; i++) {
                // Grab and remove the last weather event from the queue
                let weatherEvent = this.weatherEvents.pop();
                // Push weather event to new events queue with all types
                events.push(weatherEvent);
            }
        }

        // Check if any events in the array
        if (events.length > 0) {
            // Send the events to each webhook
            this.urls.forEach(url => this.sendEvents(events, url, 0));
        }
    }

    /**
     * Send the webhook events to the provided webhook endpoint
     * @param {*} events
     * @param {string} url
     * @param {number} retryCount
     */
    sendEvents(events, url, retryCount) {
        // If events is not set, skip..
        if (!events || !this.online.has(url)) {
            return;
        }
        // axios request options
        let options = {
            url: url,
            method: 'POST',
            data: events,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'User-Agent': 'Nodedradamus'
            }
        };
        // Send request
        axios(options)
            .then(x => console.log('[WebhookController] Webhook event with', events.length, 'payloads sent to', url))
            .catch(err => {
                if (err) {
                    if (retryCount < this.retryCount) {
                        console.error(`[WebhookController] Error occurred, trying again for ${url}`);
                        this.sendEvents(events, url, retryCount++);
                    } else {
                        console.error(`[WebhookController] Error occurred, max retry count reached for ${url}`);
                    }
                }
            });
    }

    checkOnline() {
        this.urls.forEach(url => {
            axios({
                url: url,
                method: 'POST',
                data: { pokemon_id: 0 },
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache',
                  'User-Agent': 'Nodedradamus',
                },
            })
                .then(() => this.online.add(url))
                .catch(err => {
                    if (err) {
                      this.online.delete(url)
                      console.warn(`${url} is offline`);
                    };
                });
          });
        if (webhooks.urls.length > 0 && this.online.size === 0) {
          console.error('No webhooks are online')
        }
    };
}

module.exports = WebhookController;
