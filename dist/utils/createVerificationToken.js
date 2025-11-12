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
const crypto_1 = __importDefault(require("crypto"));
const dayjs_1 = __importDefault(require("dayjs"));
const verificationToken_model_1 = __importDefault(require("../modules/verificationToken/verificationToken.model"));
const createVerificationToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const rawToken = crypto_1.default.randomBytes(32).toString("hex");
    const hashedToken = crypto_1.default
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
    const expiresAt = (0, dayjs_1.default)().add(1, "hour").toDate();
    yield verificationToken_model_1.default.create({
        userId,
        token: hashedToken,
        expiresAt,
    });
    return rawToken;
});
exports.default = createVerificationToken;
