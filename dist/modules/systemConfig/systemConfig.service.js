"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigServices = void 0;
const systemConfig_model_1 = require("./systemConfig.model");
/**
 * Get the current system configuration
 * If no config exists, create one with default values
 */
const getSystemConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    let config = yield systemConfig_model_1.SystemConfig.findOne();
    // If no config exists, create one with defaults
    if (!config) {
        config = yield systemConfig_model_1.SystemConfig.create({});
    }
    return config;
});
/**
 * Update system configuration (Admin only)
 * @param payload - Partial system config to update
 */
const updateSystemConfig = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let config = yield systemConfig_model_1.SystemConfig.findOne();
    if (!config) {
        // Create if doesn't exist
        config = yield systemConfig_model_1.SystemConfig.create(payload);
    }
    else {
        // Update existing
        Object.assign(config, payload);
        yield config.save();
    }
    return config;
});
exports.SystemConfigServices = {
    getSystemConfig,
    updateSystemConfig,
};
