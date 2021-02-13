'use strict';

const callbacks = {};

module.exports = {
    setup: (worker) => {
        worker.on('message', async function (message) {
            const { token, name, args } = message;
            const callback = callbacks[name];
            if (callback === undefined) {
                this.send({
                    token,
                    error: true,
                    result: `Unknown function ${name}`,
                });
                return;
            }
            try {
                const result = await callback.call(this, ...args);
                this.send({
                    token,
                    error: false,
                    result,
                });
            } catch (err) {
                this.send({
                    token,
                    error: true,
                    result: err,
                });
            }
        });
    },
    registerCallback: (name, func) => {
        if (callbacks[name] !== undefined) {
            throw Error(`Redefining callback ${name}`);
        }
        callbacks[name] = func;
    },
};
