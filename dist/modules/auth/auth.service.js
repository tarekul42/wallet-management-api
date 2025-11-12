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
exports.AuthServices = void 0;
const crypto_1 = __importDefault(require("crypto"));
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const userTokens_1 = require("../../utils/userTokens");
const createVerificationToken_1 = __importDefault(require("../../utils/createVerificationToken"));
const verificationToken_model_1 = __importDefault(require("../verificationToken/verificationToken.model"));
const getNewAccessToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const newAccessToken = yield (0, userTokens_1.createNewAccessTokenWithRefreshToken)(refreshToken);
    return { accessToken: newAccessToken };
});
const user_helpers_1 = require("../user/user.helpers");
const registerUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // check if user exists
    const user = yield user_model_1.User.findOne({ email: payload.email });
    if (user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User already exists with this email.");
    }
    // As per instructions, only 'user' and 'agent' can register through this public service.
    if (payload.role !== "USER" && payload.role !== "AGENT") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Registration is only available for users and agents.");
    }
    // Sanitize payload to prevent mass assignment
    const userData = {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        role: payload.role,
    };
    // Set default values for agents
    if (userData.role === "AGENT") {
        userData.approvalStatus = user_interface_1.ApprovalStatus.PENDING;
        userData.commissionRate = null; // Rate will be set upon approval
    }
    const session = yield mongoose_1.default.startSession();
    let result;
    try {
        session.startTransaction();
        const newUser = yield (0, user_helpers_1.createUserAndWallet)(userData, session);
        const verificationToken = yield (0, createVerificationToken_1.default)(newUser._id);
        yield session.commitTransaction();
        result = Object.assign(Object.assign({}, newUser.toObject()), { verificationToken });
    }
    catch (error) {
        yield session.abortTransaction();
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to register user. Please try again later. ${errMsg}`);
    }
    finally {
        session.endSession();
    }
    return result;
});
const verifyEmail = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const verificationToken = yield verificationToken_model_1.default.findOne({
        token: hashedToken,
        expiresAt: { $gt: Date.now() },
    });
    if (!verificationToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Token is invalid or has expired.");
    }
    const user = yield user_model_1.User.findById(verificationToken.userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found.");
    }
    if (user.isVerified) {
        yield verificationToken_model_1.default.findByIdAndDelete(verificationToken._id);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "This account has already been verified.");
    }
    user.isVerified = true;
    yield user.save();
    yield verificationToken_model_1.default.findByIdAndDelete(verificationToken._id);
    return { message: "Email verified successfully. You can now log in." };
});
const logoutUser = () => {
    return { message: "Logged out successfully." };
};
exports.AuthServices = {
    getNewAccessToken,
    registerUser,
    verifyEmail,
    logoutUser,
};
