'use strict';

const betterLogging = require('better-logging');
const { MessageConstructionStrategy, Theme } = betterLogging;
const config = require('./config.js');

const fileName = new Date().toLocaleDateString().replace(/\//g, '-');
betterLogging(console, {
    color: Theme.dark,
    messageConstructionStrategy: MessageConstructionStrategy.NONE,
    saveToFile: config.logs.file ? `./logs/${fileName}.log` : null,
});

console.logLevel = config.logs.level;
/**
 * debug: 4
 * log: 3
 * info: 2
 * warn: 1
 * error: 0
 * line: 1
 * turn off all logging: -1
 * default: 3
 */
