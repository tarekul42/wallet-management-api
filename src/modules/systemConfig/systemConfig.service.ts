
import { ISystemConfig } from "./systemConfig.interface";
import { SystemConfig } from "./systemConfig.model";

/**
 * Get the current system configuration
 * If no config exists, create one with default values
 */
const getSystemConfig = async (): Promise<ISystemConfig> => {
    let config = await SystemConfig.findOne();

    // If no config exists, create one with defaults
    if (!config) {
        config = await SystemConfig.create({});
    }

    return config;
};

/**
 * Update system configuration (Admin only)
 * @param payload - Partial system config to update
 */
const updateSystemConfig = async (
    payload: Partial<ISystemConfig>,
): Promise<ISystemConfig> => {
    let config = await SystemConfig.findOne();

    if (!config) {
        // Create if doesn't exist
        config = await SystemConfig.create(payload);
    } else {
        // Update existing
        Object.assign(config, payload);
        await config.save();
    }

    return config;
};

export const SystemConfigServices = {
    getSystemConfig,
    updateSystemConfig,
};
