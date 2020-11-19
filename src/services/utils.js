'use strict';

const fs = require('fs');

/**
 * Base64 decodes the string to raw data.
 * @param {*} data 
 */
const base64_decode = (data) => {
    return Buffer.from(data, 'base64');
};

const sendResponse = (res, status, data) => {
    res.json({
        status: status,
        data: data
    });
};

const snooze = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const readFile = async (path, encoding = 'utf8') => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data.toString(encoding));
        });
    });
};

const zeroPad = (num, places) => String(num).padStart(places, '0');

module.exports = {
    base64_decode,
    sendResponse,
    snooze,
    readFile,
    zeroPad
};