// 'use strict';

// const cluster = require('cluster');
// const express = require('express');
// const i18n = require('i18n');
// const mustacheExpress = require('mustache-express');
// const path = require('path');
// const app = express();
// const helmet = require('helmet');

// const config = require('./config.json');
// const AssignmentController = require('./controllers/assignment-controller.js');
// const DeviceController = require('./routes/devicecontroller.js');
// const apiRoutes = require('./routes/api.js');
// const uiRoutes = require('./routes/ui.js');
// const routes = new DeviceController();
// const Migrator = require('./services/migrator.js');
// const utils = require('./services/utils.js');
// const WebhookController = require('./services/webhook.js');
// const instances = config.clusters || 4;
// require('./services/logger.js');

// // TODO: Add webhooks to redis instead of internally cached
// // TODO: Make request->consumer async
// // TODO: Add raw proto to redis
// // TODO: Loop redis insert into mysql

// (async () => {
//     // View engine
//     app.set('view engine', 'mustache');
//     app.set('views', path.resolve(__dirname, 'views'));
//     app.engine('mustache', mustacheExpress());

//     // Static paths
//     app.use(express.static(path.resolve(__dirname, '../static')));

//     // Body parsing middleware
//     app.use(express.json({ limit: '50mb' }));
//     app.use(express.urlencoded({ extended: false, limit: '50mb' }));

//     // Initialize localzation handler
//     i18n.configure({
//         locales:['en', 'es', 'de'],
//         // TODO: Why does it look for .js translation files??!?!!
//         extension: '.json',
//         syncFiles: true,
//         directory: path.resolve(__dirname, '../static/locales')
//     });
//     app.use(i18n.init);

//     // Register helper as a locals function wrroutered as mustache expects
//     app.use((req, res, next) => {
//         // Mustache helper
//         res.locals.__ = () => {
//             /* eslint-disable no-unused-vars */
//             return (text, render) => {
//             /* eslint-enable no-unused-vars */
//                 return i18n.__.routerly(req, arguments);
//             };
//         };
//         next();
//     });

//     // Set locale
//     i18n.setLocale(config.locale);

//     // Set HTTP routes
//     app.post(['/controler', '/controller'], async (req, res) => await routes.handleControllerData(req, res));
//     app.use('/', uiRoutes);
//     app.use('/api', apiRoutes);

//     // Start HTTP listener
//     app.listen(config.controller.port, config.host, () => console.log(`Listening on ${config.host}:${config.controller.port}...`));

//     // Start assignment controller
//     await AssignmentController.instance.setup();
// })();

// (async () => {
//     // Check if cluster node is master or child
//     if (cluster.isMaster) {
//         console.log(`[Cluster] Master ${process.pid} is running`);

//         // Start database migrator
//         const dbMigrator = new Migrator();
//         await dbMigrator.load();

//         // Wait until migrations are done to proceed
//         while (!dbMigrator.done) {
//             await utils.snooze(1000);
//         }
        
//         // Fork workers
//         for (let i = 0; i < instances; i++) {
//             cluster.fork();
//         }

//         // If worker gets disconnected, start new one. 
//         cluster.on('disconnect', function (worker) {
//             console.error(`[Cluster] Worker disconnected with id ${worker.id}`);
//             let newWorker = cluster.fork();
//             console.log('[Cluster] New worker started with process id %s', newWorker.process.pid);
//         });
    
//         cluster.on('online', function (worker) {
//             console.log(`[Cluster] New worker online with id ${worker.id}`);
//         });

//         cluster.on('exit', (worker, code, signal) => {
//             console.log(`[Cluster] Worker ${worker.process.pid} died with error code ${code}`);
//         });
//     } else {
//         const RouteController = require('./routes/routecontroller.js');
//         const routes = new RouteController();

//         // Basic security protection middleware
//         app.use(helmet());

//         // Body parsing middleware
//         app.use(express.json({ limit: '50mb' }));
//         //app.use(require('express-status-monitor')()); //http://ip:port/status

//         // Parsing routes
//         app.get('/', (req, res) => res.send('OK'));
//         app.post('/', (req, res) => {
//             const body = req.body;
//             console.log('[Webhook Test] Received', body.length, 'webhook payloads:', body);
//             res.send('OK');
//         });
//         app.post('/raw', async (req, res) => await routes.handleRawData(req, res));

//         app.listen(config.dataparser.port, config.host, () => console.log(`Listening on ${config.host}:${config.dataparser.port}...`));

//         if (config.webhooks.enabled && config.webhooks.urls.length > 0) {
//             WebhookController.instance.start();
//         }
//     }
// })();