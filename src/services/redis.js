'use strict';

const config = require('./config.js');
const redis = require('redis');

class Redis {
    constructor(config) {
        const redisOptions = {
            host: config.host,
            port: config.port,
            //string_numbers: true,
            //socket_keepalive: true,
            //db: null,
            tls: false
        };
        if (config.password) {
            redisOptions.password = config.password;
        }
        const client = redis.createClient(redisOptions);
        client.on('connect', () => {
            console.log('[Redis] Connected');
        });
        client.on('error', (error) => {
            console.error('[Redis] Error:', error);
        });
        this.client = client;
    }

    async hget(key, field) {
        return new Promise(async (resolve, reject) => {
            this.client.hget(key, field, (err, reply) => {
                if (err) {
                    console.error('[Redis] Error:', err);
                    return reject(err);
                }
                if (!reply) {
                    return resolve(reply);
                }
                let obj = JSON.parse(reply);
                return resolve(obj);
            });
        });
    }

    async hset(key, field, value) {
        return new Promise(async (resolve, reject) => {
            this.client.hset(key, field, JSON.stringify(value), (err, reply) => {
                if (err) {
                    console.error('[Redis] Error:', err);
                    return reject(err);
                }
                //console.log('[Redis] Reply:', reply);
                resolve(reply);
            });
        });
    }

    async publish(channel, value) {
        return new Promise((resolve, reject) => {
            this.client.publish(channel, value, (err, reply) => {
                if (err) {
                    console.error('[Redis] Error:', err);
                    return reject(err);
                }
                //console.log('[Redis] Reply:', reply);
                resolve();
            });
        });
    }

    async subscribe(channel) {
        return new Promise((resolve, reject) => {
            this.client.subscribe(channel, (err, reply) => {
                if (err) {
                    console.error('[Redis] Error:', err);
                    return reject(err);
                }
                //console.log('[Redis] Reply:', reply);
                resolve();
            });
        });
    }

    getClient() {
        return this.client;
    }

    async onEvent(event, cb) {
        this.client.on(event, cb);
    }
}

module.exports = config.redis.enabled !== false ? new Redis(config.redis) : null;
