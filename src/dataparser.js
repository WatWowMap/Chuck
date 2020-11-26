'use strict';

const express = require('express');
const helmet = require('helmet');
const app = express();

const config = require('./services/config.js');
const Migrator = require('./services/migrator.js');
const utils = require('./services/utils.js');
const WebhookController = require('./services/webhook.js');
require('./services/logger.js');

// TODO: Add webhooks to redis instead of internally cached
// TODO: Make request->consumer async
// TODO: Add raw proto to redis
// TODO: Loop redis insert into mysql

(async () => {
    // Start database migrator
    const dbMigrator = new Migrator();
    await dbMigrator.load();

    // Wait until migrations are done to proceed
    while (!dbMigrator.done) {
        await utils.snooze(1000);
    }

    const RouteController = require('./routes/routecontroller.js');
    const routes = new RouteController();

    // Basic security protection middleware
    app.use(helmet());

    // Body parsing middleware
    app.use(express.json({ limit: '50mb' }));
    //app.use(require('express-status-monitor')()); //http://ip:port/status

    // Parsing routes
    app.get('/', (req, res) => res.send('OK'));
    app.post('/', (req, res) => {
        const body = req.body;
        console.log('[Webhook Test] Received', body.length, 'webhook payloads:', body);
        res.send('OK');
    });
    app.post('/raw', async (req, res) => await routes.handleRawData(req, res));

    app.listen(config.dataparser.port, config.host, () => console.log(`Listening on ${config.host}:${config.dataparser.port}...`));

    if (config.webhooks.enabled && config.webhooks.urls.length > 0) {
        WebhookController.instance.start();
    }
})();
