"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMockEmail = exports.generateToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a random token for verification or password reset.
 * @returns {string} A random hex string.
 */
const generateToken = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
exports.generateToken = generateToken;
/**
 * Mocks sending an email by logging the content to the console.
 * This is useful for development and testing without an SMTP server.
 *
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The body of the email.
 */
const sendMockEmail = (to, subject, text) => {
    console.log("\n================ MOCK EMAIL ================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log("============================================\n");
};
exports.sendMockEmail = sendMockEmail;
