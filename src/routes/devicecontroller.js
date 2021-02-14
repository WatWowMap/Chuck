'use strict';

const InstanceController = require('../controllers/instance-controller.js');
const Account = require('../models/account.js');
const Device = require('../models/device.js');

/**
 * DeviceController class
 */
class DeviceController {

    /**
     * Initialize new DeviceController object.
     */
    constructor() {
    }

    /* Controller routes */
    async handleControllerData(req, res) {
        let payload = req.body;
        let type = payload['type'];
        let uuid = payload['uuid'];
        if (!type || !uuid) {
            console.error('[Controller] Failed to parse controller data');
            return res.sendStatus(400);
        }
        //let username = payload['username'];
        //let tutorial = parseInt(payload['tutorial'] || 0);
        let minLevel = parseInt(payload['min_level'] || 0); // TODO: min/max_level not sent via client anymore??? :feelslapras:
        let maxLevel = parseInt(payload['max_level'] || 29);
        let device = await Device.getById(uuid);

        console.debug(`[Controller] [${uuid}] Received control request: ${type}`);
        switch (type) {
            case 'init':
                await this.handleInitialize(req, res, uuid, device);
                break;
            case 'heartbeat':
                await this.handleHeartbeat(req, res, uuid);
                break;
            case 'get_job':
                await this.handleJob(req, res, uuid, device, minLevel, maxLevel);
                break;
            case 'get_account':
                await this.handleAccount(req, res, device, minLevel, maxLevel);
                break;
            case 'account_banned':
            case 'account_warning':
            case 'account_invalid_credentials':
                await this.handleAccountStatus(req, res, type, device);
                break;
            case 'tutorial_done':
                await this.handleTutorialStatus(req, res, uuid);
                break;
            case 'logged_out':
                await this.handleLogout(req, res, uuid);
                break;
            case 'job_failed':
                sendResponse(res, 'ok', null);
                break;
            default:
                console.error(`[Controller] [${uuid}] Unhandled Request: ${type}`);
                return res.sendStatus(404);
        }
    }

    async handleInitialize(req, res, uuid, device) {
        let ts = new Date().getTime() / 1000;
        let firstWarningTimestamp;
        if (!device || !device.accountUsername) {
            firstWarningTimestamp = null;
        } else {
            let account = await Account.getWithUsername(device.accountUsername, true);
            if (account instanceof Account) {
                firstWarningTimestamp = account.firstWarningTimestamp;
            } else {
                firstWarningTimestamp = null;
            }
        }
        if (device instanceof Device) {
            // Device is already registered
            console.debug(`[Controller] [${uuid}] Device already registered`);
            let assignedInstance = device.instanceName !== undefined && device.instanceName !== null && device.instanceName !== '';
            if (!assignedInstance) {
                console.log(`[Controller] [${uuid}] Device not assigned to an instance!`);
            }
            sendResponse(res, 'ok', {
                assigned: assignedInstance,
                first_warning_timestamp: firstWarningTimestamp || 0
            });
        } else {
            // Register new device
            console.log(`[Controller] [${uuid}] Registering device`);
            await Device.create({
                uuid: uuid,
                instanceName: null,
                accountUsername: null,
                lastSeen: ts,
                lastHost: null,
                lastLat: 0,
                lastLon: 0,
            });
            sendResponse(res, 'ok', {
                assigned: false,
                first_warning_timestamp: firstWarningTimestamp
            });
        }
    }

    async handleHeartbeat(req, res, uuid) {
        try {
            const host = (req.headers['x-forwarded-for'] || '').split(', ')[0] || (req.connection.remoteAddress || req.connection.localAddress).match('[0-9]+.[0-9].+[0-9]+.[0-9]+$')[0];
            await Device.touch(uuid, host, false);
            sendResponse(res, 'ok', null);
        } catch (err) {
            res.send(err);
        }
    }

    async handleJob(req, res, uuid, device, minLevel, maxLevel) {
        if (device && device.accountUsername) {
            let instanceController = InstanceController.instance.getInstanceController(uuid);
            if (!instanceController) {
                console.error(`[Controller] [${uuid}] Failed to get instance controller`);
                return res.sendStatus(404);
            }
            let task = await instanceController.getTask(uuid, device.accountUsername, false);
            if (task) {
                console.log(`[Controller] [${uuid}] Sending ${task.action} job to ${task.lat}, ${task.lon}`);
                sendResponse(res, 'ok', task);
            } else {
                console.warn(`[Controller] [${uuid}] No tasks available yet`);
                return res.sendStatus(404);
            }
        } else {
            console.log(`[Controller] [${uuid}] Device not assigned any account, switching accounts...`);
            sendResponse(res, 'ok', {
                'action': 'switch_account',
                'min_level': minLevel,
                'max_level': maxLevel
            });
        }
    }

    async handleAccount(req, res, device, minLevel, maxLevel) {
        if (device) {
            let instanceController = InstanceController.instance.getInstanceController(device.uuid);

            if (instanceController) {
                // let instance decide min/max level instead of client
                minLevel = instanceController.minLevel;
                maxLevel = instanceController.maxLevel;
            }
        }

        let account = await Account.getNewAccount(minLevel, maxLevel);

        console.log(`[Controller] [${device.uuid}] GetNewAccount: ${account ? JSON.stringify(account) : null}`);
        if (device && !account) {
            if (device.accountUsername) {
                let oldAccount = await Account.getWithUsername(device.accountUsername);
                console.log(`[Controller] [${device.uuid}] GetOldAccount: ${oldAccount ? JSON.stringify(oldAccount) : null}`);
                account = oldAccount;
                if (oldAccount instanceof Account &&
                    oldAccount.level >= minLevel &&
                    oldAccount.level <= maxLevel &&
                    !oldAccount.firstWarningTimestamp &&
                    !oldAccount.failed &&
                    !oldAccount.failedTimestamp) {
                    sendResponse(res, 'ok', {
                        username: oldAccount.username.trim(),
                        password: oldAccount.password.trim(),
                        first_warning_timestamp: oldAccount.firstWarningTimestamp,
                        level: oldAccount.level
                    });
                    return;
                }
            } else {
                console.error(`[Controller] [${device.uuid}] Failed to get account. Make sure you have accounts in your 'account' table`);
                return res.sendStatus(400);
            }
        }

        device.accountUsername = account.username;
        device.deviceLevel = account.level;
        await device.save();
        sendResponse(res, 'ok', {
            username: account.username.trim(),
            password: account.password.trim(),
            first_warning_timestamp: account.firstWarningTimestamp,
            level: account.level
        });
    }

    async handleAccountStatus(req, res, type, device) {
        let ts = new Date().getTime() / 1000;
        let account = await Account.getWithUsername(device.accountUsername, true);
        if (account instanceof Account) {
            switch (type) {
                case 'account_banned':
                    if (!account.failedTimestamp || !account.failed) {
                        account.failedTimestamp = ts;
                        account.failed = 'banned';
                    }
                    break;
                case 'account_warning':
                    if (!account.firstWarningTimestamp) {
                        account.firstWarningTimestamp = ts;
                    }
                    break;
                case 'account_invalid_credentials':
                    if (!account.failedTimestamp || !account.failed) {
                        account.failedTimestamp = ts;
                        account.failed = 'invalid_credentials';
                    }
                    break;
            }
            await account.save();
            sendResponse(res, 'ok', null);
        } else {
            if (!device || !account) {
                console.error('[Controller] Failed to get account, device or account is null.');
                return res.sendStatus(400);
            }
        }
    }

    async handleTutorialStatus(req, res, uuid) {
        try {
            let device = await Device.getById(uuid);
            let username = device.accountUsername;
            let account = await Account.getWithUsername(username);
            if (!device || !username || !account) {
                sendResponse(res, 'error', 'Failed to get account.');
                return;
            }
            if (account.level === 0) {
                account.level = 1;
            }
            account.tutorial = 1;
            await account.save();
            sendResponse(res, 'ok', null);
        } catch (err) {
            sendResponse(res, 'error', { message: err });
        }
    }

    async handleLogout(req, res, uuid) {
        try {
            let device = await Device.getById(uuid);
            if (device instanceof Device) {
                if (device.accountUsername === null) {
                    return res.sendStatus(404);
                }
                device.accountUsername = null;
                await device.save(device.uuid);
                sendResponse(res, 'ok', null);
            } else {
                return res.sendStatus(404);
            }
        } catch {
            return res.sendStatus(500);
        }
    }
}

const sendResponse = (res, status, data) => {
    res.json({
        status: status,
        data: data
    });
};

module.exports = DeviceController;
