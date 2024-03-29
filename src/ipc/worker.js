'use strict';

const pending = {};
let nextToken;

module.exports = new Proxy({}, {
    get: (target, prop) => {
        return function (...args) {
            if (nextToken === undefined) {
                process.on('message', function (message) {
                    const { token, error, result } = message;
                    const promise = pending[token];
                    delete pending[token];
                    if (promise) {
                        (error ? promise.reject : promise.resolve)(result);
                    } else {
                        console.error('Unrecognized message received with token', token,
                            '. Are you running with pm2 (or other process managers using clusters API)?',
                            'This is not supported.');
                    }
                });
                nextToken = 0;
            }
            const token = nextToken++;
            const promise = new Promise((resolve, reject) => {
                pending[token] = { resolve, reject };
            });
            process.send({
                token,
                name: prop,
                args,
            });
            return promise;
        };
    },
});
