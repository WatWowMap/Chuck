'use strict';

const config = require('../services/config.js');
const data = require('../../static/locales/' + config.locale + '.json');
data.started = new Date().toLocaleString();
data.title = config.controller.title;
data.locale = config.controller.locale;
data.locale_new = config.controller.locale;
data.body_class = config.controller.style === 'dark' ? 'theme-dark' : '';
data.table_class = config.controller.style === 'dark' ? 'table-dark' : '';
data.current_version = require('../../package.json').version;

module.exports = data;