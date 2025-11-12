import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ISystemSettings } from "./system-settings.interface";
import { SystemSettings } from "./system-settings.model";

const getSystemSettings = async () => {
    let settings = await SystemSettings.findOne();
    if (!settings) {
        // If no settings exist, create the first one with default values
        settings = await SystemSettings.create({});
    }
    return settings;
};

const updateSystemSettings = async (
    adminId: string,
    payload: Partial<ISystemSettings>,
) => {
    const updateData: Partial<ISystemSettings> = {};

    if (payload.transactionFee !== undefined) {
        updateData.transactionFee = payload.transactionFee;
    }

    if (Object.keys(updateData).length === 0) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "No valid settings fields to update.",
        );
    }

    updateData.updatedBy = adminId as unknown as Types.ObjectId;

    // First, ensure a settings document exists
    let settings = await SystemSettings.findOne();
    if (!settings) {
        // Create a new settings document with schema defaults
        settings = await SystemSettings.create({});
    }

    // Now update the existing document with the partial update
    settings = await SystemSettings.findOneAndUpdate({}, updateData, {
        new: true,
        runValidators: true,
    });

    if (!settings) {
        throw new AppError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Failed to update settings.",
        );
    }

    return settings;
};

export const SystemSettingsServices = {
    getSystemSettings,
    updateSystemSettings,
};
