import crypto from "crypto";
import logger from "../../utils/logger.js";

export const generateToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};

export const sendMockEmail = (to: string, subject: string, text: string) => {
    logger.log("\n================ MOCK EMAIL ================");
    logger.log(`To: ${to}`);
    logger.log(`Subject: ${subject}`);
    logger.log(`Body:\n${text}`);
    logger.log("============================================\n");
};
