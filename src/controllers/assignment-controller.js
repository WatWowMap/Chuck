'use strict';

const InstanceController = require('./instance-controller.js');
const Assignment = require('../models/assignment.js');
const Device = require('../models/device.js');

class AssignmentController {
    static instance = new AssignmentController();

    constructor() {
        this.assignments = [];
        this.initialized = false;
        this.timeZone = '';
        this.lastUpdate = -2;
    }

    async setup() {
        this.assignments = await Assignment.getAll();
        this.timeZone = null;//config.timeZone;
        if (!this.initialized) {
            console.log('[AssignmentController] Starting AssignmentController...');
            this.initialized = true;
            setInterval(async () => await this.checkAssignments(), 5000);
        }
    }

    async checkAssignments() {
        let now = this.todaySeconds();
        if (this.lastUpdate === -2) {
            // TODO: Sleep 5 seconds
            this.lastUpdate = parseInt(now);
            return;
        } else if (this.lastUpdate > now) {
            this.lastUpdate = -1;
        }

        let assignments = this.assignments;
        for (let i = 0; i < assignments.length; i++) {
            let assignment = assignments[i];
            if (assignment.enabled && assignment.time !== 0 && now > assignment.time && this.lastUpdate < assignment.time) {
                await this.triggerAssignment(assignment);
            }
        }
        // TODO: Sleep 5 seconds
        this.lastUpdate = parseInt(now);
    }

    addAssignment(assignment) {
        this.assignments.push(assignment);
    }

    editAssignment(oldAssignment, newAssignment) {
        let index = this.assignments.indexOf(oldAssignment);
        if (index) {
            this.assignments.splice(index, 1);
        }
        this.assignments.push(newAssignment);
    }

    deleteAssignment(assignment) {
        let index = this.assignments.indexOf(assignment);
        if (index) {
            this.assignments.splice(index, 1);
        }
    }

    async triggerAssignment(assignment, force = false) {
        if (!(force || (assignment.enabled && (!assignment.date || new Date(assignment.date) === new Date())))) {
            return;
        }
        let device;
        try {
            device = await Device.getById(assignment.deviceUUID);
        } catch (err) {
            console.error('[AssignmentController] Error:', err);
        }
        if (device && device.instanceName !== assignment.instanceName) {
            console.log(`[AssignmentController] Assigning device ${device.uuid} to ${assignment.instanceName}`);
            await InstanceController.instance.removeDevice(device);
            device.instanceName = assignment.instanceName;
            try {
                await device.save(device.uuid);
            } catch (err) {
                console.error('[AssignmentController] Failed to update device', device.uuid, 'assignment with instance name:', assignment.instanceName);
            }
            InstanceController.instance.addDevice(device);
        }
    }

    todaySeconds() {
        // TODO: Timezone
        let date = new Date();
        let hour = date.getHours() || 0;
        let minute = date.getMinutes() || 0;
        let second = date.getSeconds() || 0;
        return hour * 3600 + minute * 60 + second;
    }

    instanceControllerDone(name) {
        for (let i = 0; i < this.assignments.length; i++) {
            let assignment = this.assignments[i];
            let deviceUUIDs = InstanceController.instance.getDeviceUUIDsInInstance(name);
            if (assignment.enabled && assignment.time !== 0 && deviceUUIDs.includes(assignment.deviceUUID)) {
                this.triggerAssignment(assignment);
                return;
            }
        }
    }
}

module.exports = AssignmentController;