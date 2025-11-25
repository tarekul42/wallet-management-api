import crypto from "crypto";

/**
 * Generates a random token for verification or password reset.
 * @returns {string} A random hex string.
 */
export const generateToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};

/**
 * Mocks sending an email by logging the content to the console.
 * This is useful for development and testing without an SMTP server.
 *
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The body of the email.
 */
export const sendMockEmail = (to: string, subject: string, text: string) => {
    console.log("\n================ MOCK EMAIL ================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log("============================================\n");
};
