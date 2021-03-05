'use strict';

class EnvUtil {
    constructor() {
        this.envConfig = {};
    }

    isNumeric(value) {
        return /^-?\d+$/.test(value);
    }

    assignValue(key, value) {
        var arr = key.toLowerCase().split('_');
        var i = 0;
        var curobj = this.envConfig;
        while (i < (arr.length - 1)) {
            if (curobj[arr[i]] === undefined) {
                curobj[arr[i]] = {};
            }
            curobj = curobj[arr[i++]];
        }
        if (this.isNumeric(value)) {
            curobj[arr[i]] = +value;
        } else {
            curobj[arr[i]] = value;
        }
    }

    parse(configJson, parent = "") {
        Object.keys(configJson).forEach(key => {
            let newParent = "";
            if (parent != "") {
                newParent = parent + "_" + key.toUpperCase();
            } else {
                newParent = key.toUpperCase();
            }
            if (typeof configJson[key] === 'object') {
                this.parse(configJson[key], newParent);
            }
            else {
                this.assignValue(newParent, process.env[newParent]);
            }
        })

        return this.envConfig;
    }

}

module.exports = EnvUtil;
