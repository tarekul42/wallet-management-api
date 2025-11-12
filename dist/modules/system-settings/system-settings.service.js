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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingsServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const system_settings_model_1 = require("./system-settings.model");
const getSystemSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield system_settings_model_1.SystemSettings.findOne();
    if (!settings) {
        // If no settings exist, create the first one with default values
        settings = yield system_settings_model_1.SystemSettings.create({});
    }
    return settings;
});
const updateSystemSettings = (adminId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = {};
    if (payload.transactionFee !== undefined) {
        updateData.transactionFee = payload.transactionFee;
    }
    if (Object.keys(updateData).length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No valid settings fields to update.");
    }
    updateData.updatedBy = adminId;
    // First, ensure a settings document exists
    let settings = yield system_settings_model_1.SystemSettings.findOne();
    if (!settings) {
        // Create a new settings document with schema defaults
        settings = yield system_settings_model_1.SystemSettings.create({});
    }
    // Now update the existing document with the partial update
    settings = yield system_settings_model_1.SystemSettings.findOneAndUpdate({}, updateData, {
        new: true,
        runValidators: true,
    });
    if (!settings) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update settings.");
    }
    return settings;
});
exports.SystemSettingsServices = {
    getSystemSettings,
    updateSystemSettings,
};
