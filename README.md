# Chuck
 
![Node.js CI](https://github.com/versx/ControllerJS/workflows/Node.js%20CI/badge.svg)

Backend alternative to [RealDeviceMap](https://github.com/RealDeviceMap/RealDeviceMap) `/controler` endpoint  

## Prerequisites  
- [MySQL 8](https://dev.mysql.com/downloads/mysql/) or [MariaDB 10](https://mariadb.org/download/) database server  
- [Redis Server](https://redis.io/download) 

## Installation  
1.) Clone repository `git clone https://github.com/vwwm/chuck`  
2.) Install dependencies `npm run update`  
3.) Copy config `cp src/config.example.json src/config.json`  
4.) Fill out config `vi src/config.json` (listening port, instances, db info, etc)  
5.) Create PvP stat tables, run npm run create-pvp-tables
6.) Run `npm run dataparser` to run dataparser (Database tables will be created if they don't exist)  
7.) Run `npm run controller` 
8.) Point `backend_url` config property in [DeviceConfigManager](https://github.com/versx/DeviceConfigManager) to `http://host_ip:9002`  
9.) Import your existing `RDM` instances to your ControllerJS/DataParser `instance` table (replace `bjsdb` with database name for Controller/DataParser) and replace `rdmdb` with your existing RDM's database name):  
10.) Point `data_endpoint` config property in [DeviceConfigManager](https://github.com/versx/DeviceConfigManager) to `http://dataparser_ip:9001`
```
INSERT INTO bjsdb.instance (name, type, data)
SELECT name, type, data FROM rdmdb.instance;
```
9.) Visit `http://controllerip:9002` to add accounts, assign devices, or manage instances and auto-assignments  

## Configuration
```js
{
    // Listening host interface
    "host": "0.0.0.0",
    // Locale Language
    "locale": "en",
    // Controller Settings
    "controller": {
        // Backend Controller IP to point devices to
        "port": 9000,
        // Title of your backend
        "title": "BackendJS",
        // Style
        "style": "dark"
    },
    // Parser Settings
    "dataparser": {
        // Data Endpoint for your devices
        "port": 9001,
        // Number of clusters to use for parsing
        "clusters": 4,
        // Protos to parse
        "parse": {
            "pokemon": true,
            "encounters": true,
            "gym": true,
            "pokestops": true,
            "quests": true,
            "gymDefenders": true,
            "weather": true
        }
    },
    // Database Connection
    "db": {
        "type": "mysql",
        "host": "127.0.0.1",
        "port": 3306,
        "username": "user",
        "password": "userPassword",
        "database": "databaseSchema",
        "charset": "utf8mb4",
        "connectionLimit": 1000
    },
    // Redis Connection
    "redis": {
        "host": "127.0.0.1",
        "port": 6379,
        "password": ""
    },
    // Webhooks (WhMgr, Poracle, WDR, etc)
    "webhooks": {
        "enabled": false,
        "urls": ["http://127.0.0.1:9003"],
        "delay": 5,
        "retryCount": 5
    },
    "logs": {
        "level": 4,
        "file": false
    }
}
```
## Updating  
1.) `git pull`  
3.) `npm run update`  

## Current Issues  
- Auto-Assignments might not work correctly

## Discord  
https://discordapp.com/invite/zZ9h9Xa  
