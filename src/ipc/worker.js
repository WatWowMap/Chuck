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
                    if (delete pending[token]) {
                        (error ? promise.reject : promise.resolve)(result);
                    } else {
                        console.warn('Unrecognized message received with token', token);
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
