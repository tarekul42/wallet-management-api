"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenError = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class TokenError extends Error {
    constructor(message) {
        super(message);
        this.name = "TokenError";
    }
}
exports.TokenError = TokenError;
const generateToken = (payload, secret, expiresIn) => {
    const token = jsonwebtoken_1.default.sign(payload, secret, {
        expiresIn,
    });
    return token;
};
exports.generateToken = generateToken;
const verifyToken = (token, secret) => {
    try {
        const decodedToken = jsonwebtoken_1.default.verify(token, secret);
        return decodedToken;
    }
    catch (error) {
        throw new TokenError(`Invalid token: ${error.message}`);
    }
};
exports.verifyToken = verifyToken;
