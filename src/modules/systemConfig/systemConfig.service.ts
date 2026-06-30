
import { ISystemConfig } from "./systemConfig.interface.js";
import { SystemConfig } from "./systemConfig.model.js";

let cachedConfig: ISystemConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

const getSystemConfig = async (): Promise<ISystemConfig> => {
    const now = Date.now();
    if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedConfig;
    }

    let config = await SystemConfig.findOne();

    if (!config) {
        config = await SystemConfig.create({});
    }

    cachedConfig = config;
    cacheTimestamp = now;

    return config;
};

const invalidateCache = () => {
    cachedConfig = null;
    cacheTimestamp = 0;
};

const updateSystemConfig = async (
    payload: Partial<ISystemConfig>,
): Promise<ISystemConfig> => {
    let config = await SystemConfig.findOne();

    if (!config) {
        config = await SystemConfig.create(payload);
    } else {
        Object.assign(config, payload);
        await config.save();
    }

    invalidateCache();

    return config;
};

export const SystemConfigServices = {
    getSystemConfig,
    updateSystemConfig,
};
