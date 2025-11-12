"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const env_1 = require("../config/env");
const logger = {
    info: (...args) => {
        console.log(new Date().toISOString(), ...args);
    },
    warn: (...args) => {
        console.warn(new Date().toISOString(), ...args);
    },
    error: (...args) => {
        console.error(new Date().toISOString(), ...args);
    },
    debug: (...args) => {
        if (env_1.envVars.NODE_ENV === "development") {
            console.log(new Date().toISOString(), "[DEBUG]", ...args);
        }
    },
};
exports.default = logger;
