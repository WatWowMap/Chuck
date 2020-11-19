'use strict';

const express = require('express');
const i18n = require('i18n');
const mustacheExpress = require('mustache-express');
const path = require('path');
const app = express();
const helmet = require('helmet');

const config = require('./config.json');
const AssignmentController = require('./controllers/assignment-controller.js');
const DeviceController = require('./routes/devicecontroller.js');
const apiRoutes = require('./routes/api.js');
const uiRoutes = require('./routes/ui.js');
const routes = new DeviceController();

(async () => {
    // View engine
    app.set('view engine', 'mustache');
    app.set('views', path.resolve(__dirname, 'views'));
    app.engine('mustache', mustacheExpress());

    // Static paths
    app.use(express.static(path.resolve(__dirname, '../static')));

    // Body parsing middleware
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: false, limit: '50mb' }));

    // Initialize localzation handler
    i18n.configure({
        locales:['en', 'es', 'de'],
        // TODO: Why does it look for .js translation files??!?!!
        extension: '.json',
        syncFiles: true,
        directory: path.resolve(__dirname, '../static/locales')
    });
    app.use(i18n.init);

    // Register helper as a locals function wrroutered as mustache expects
    app.use((req, res, next) => {
        // Mustache helper
        res.locals.__ = () => {
            /* eslint-disable no-unused-vars */
            return (text, render) => {
            /* eslint-enable no-unused-vars */
                return i18n.__.routerly(req, arguments);
            };
        };
        next();
    });

    // Set locale
    i18n.setLocale(config.locale);

    // Set HTTP routes
    app.post(['/controler', '/controller'], async (req, res) => await routes.handleControllerData(req, res));
    app.use('/', uiRoutes);
    app.use('/api', apiRoutes);

    // Start HTTP listener
    app.listen(config.controller.port, config.host, () => console.log(`Listening on ${config.host}:${config.controller.port}...`));

    // Start assignment controller
    await AssignmentController.instance.setup();
})();