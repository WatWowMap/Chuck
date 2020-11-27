'use strict';

const mysql = require('mysql');
const config = require('./config.js');

// Create a mysql connection pool with the specified options
const pool  = mysql.createPool({
    host             : config.db.host,
    port             : config.db.port,
    user             : config.db.username,
    password         : config.db.password,
    database         : config.db.database,
    charset          : config.db.charset,
    supportBigNumbers: true,
    connectionLimit  : config.db.connectionLimit,
    //connectTimeout   : 15 * 1000,
    //acquireTimeout   : 15 * 1000,
    //timeout          : 15 * 1000
});

//pool.on('acquire', (connection) => {
//    console.log('[MySQL] Connection %d acquired', connection.threadId);
//});

pool.on('enqueue', () => {
    // console.log('[MySQL] Waiting for available connection slot');
});

//pool.on('release', (connection) => {
//    console.log('[MySQL] Connection %d released', connection.threadId);
//});

/**
 * MySql Connector class
 */
class MySQLConnector {

    /**
     * 
     * @param {*} config 
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * 
     * @param {*} sql 
     * @param {*} args 
     */
    async query(sql, args) {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    // Not connected
                    return reject(err);
                }
                // Use the connection
                connection.query(sql, args, (error, results, fields) => {
                    // When done with the connection, release it back to the pool
                    connection.release();
                    // Handle error after the release
                    if (error) {
                        return reject(error);
                    }
                    // Return results
                    return resolve(results);
                });
            });
        });
    }
}

module.exports = MySQLConnector;
