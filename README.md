# Chuck
 
![Node.js CI](https://github.com/WatWowMap/Chuck/workflows/Node.js%20CI/badge.svg)
![Mocha](https://github.com/WatWowMap/Chuck/workflows/Mocha/badge.svg)  

[![GitHub Release](https://img.shields.io/github/release/WatWowMap/Chuck.svg)](https://github.com/WatWowMap/Chuck/releases/)
[![GitHub Contributors](https://img.shields.io/github/contributors/WatWowMap/Chuck.svg)](https://github.com/WatWowMap/Chuck/graphs/contributors/)
[![Discord](https://img.shields.io/discord/552003258000998401.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/zZ9h9Xa)  

Backend alternative to [RealDeviceMap](https://github.com/RealDeviceMap/RealDeviceMap)  

## Prerequisites  
- [MySQL 8](https://dev.mysql.com/downloads/mysql/) or [MariaDB 10](https://mariadb.org/download/) database server  
- [Redis Server](https://redis.io/download) 

## Installation  
1.) Clone repository `git clone https://github.com/WatWowMap/Chuck`  
2.) Install dependencies `npm run update`  
3.) Copy config `cp src/configs/config.example.json src/configs/config.json`  
4.) Fill out config `vi src/configs/config.json` (listening port, instances, db info, etc)  
5.) Run `npm run dataparser` to run dataparser (Database tables will be created if they don't exist)  
6.) Run `npm run controller`  //not currently working! Set DCM endpoint to Chuck parser for the time being, use RDM Controller.  
7.) Point `backend_url` config property in [DeviceConfigManager](https://github.com/versx/DeviceConfigManager) to `http://host_ip:9002`  
8.) Import your existing `RDM` instances to your ControllerJS/DataParser `instance` table (replace `bjsdb` with database name for Controller/DataParser) and replace `rdmdb` with your existing RDM's database name):  
9.) Point `data_endpoint` config property in [DeviceConfigManager](https://github.com/versx/DeviceConfigManager) to `http://dataparser_ip:9001`
```
INSERT INTO bjsdb.instance (name, type, data)
SELECT name, type, data FROM rdmdb.instance;
```
11.) Visit `http://controllerip:9002` to add accounts, assign devices, or manage instances and auto-assignments  

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
            "weather": true,
            "inventory": true,
            "gamemaster": true,
            "assetdigest": true,
            "downloadsettings": true,
            "getforgamemaster": true,
            "remoteconfig": true
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

Additional config values can be found in `src/configs/default.json`. **Do not edit these values directly in `default.json`!** If you would like to edit them, please first copy and paste them into the *EXACT* respective locations in your `config.json` file, then you can edit them. Failure to do the first part could lead to unexpected consequences. 

# Why are there two config files? 
This allows the devs to constantly add more config options in the future, without forcing you to update your `config.json` everytime you pull. If you would like __us__ to maintain these config options for you (For example if Ditto disguises are updated in the game or if new PVP Leagues are added), then leave them in `default.json`. 

```js
        "pokemonTimeUnseen": 20,
        "pokemonTimeReseen": 10,
        "dittoDisguises": [ 46,163,165,167,187,223,293,316,322,399,590 ],
        "lureTime": 30,
        "pvp": {
            // A list of level caps that will be considered. Must be a strictly increasing sequence.
            // CP multiplier up to level (maxLevelCap + .5) must all be defined.
            "levelCaps": [40, 41, 50, 51],
            "leagues": {
                // additional leagues are not currently supported, please do not touch these until this message is removed!
                "great": 1500,
                "ultra": 2500
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
