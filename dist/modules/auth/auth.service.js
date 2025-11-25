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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const user_helpers_1 = require("../user/user.helpers");
const userTokens_1 = require("../../utils/userTokens");
const env_1 = require("../../config/env");
const jwt_1 = require("../../utils/jwt");
const auth_utils_1 = require("./auth.utils");
const notification_utils_1 = require("../../utils/notification.utils");
const getNewAccessToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const newAccessToken = yield (0, userTokens_1.createNewAccessToken)(refreshToken);
    return { accessToken: newAccessToken };
});
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
        address: payload.address,
        nid: payload.nid,
        role: payload.role,
        verificationToken: (0, auth_utils_1.generateToken)(),
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
        yield session.commitTransaction();
        result = Object.assign({}, newUser.toObject());
        (0, auth_utils_1.sendMockEmail)(newUser.email, "Verify Your Email", `Your verification token is: ${userData.verificationToken}`);
        // Send registration notification
        (0, notification_utils_1.notifyRegistration)({
            userId: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name,
        });
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
const credentialsLogin = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userTokens = (0, userTokens_1.createUserTokens)(user);
    const userObject = user.toObject();
    const { password } = userObject, sanitizedUser = __rest(userObject, ["password"]);
    return Object.assign({ user: sanitizedUser }, userTokens);
});
const logoutUser = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decodedToken = yield (0, jwt_1.verifyToken)(refreshToken, env_1.envVars.JWT_REFRESH_SECRET);
        const userId = decodedToken.id;
        yield user_model_1.User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
        return { message: "Logged out successfully." };
    }
    catch (error) {
        // We swallow the error and return success to prevent token enumeration/leaking state
        // If the token is invalid, the user is effectively logged out anyway
        return { message: "Logged out successfully." };
    }
});
const verifyEmail = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ verificationToken: token });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid verification token");
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    yield user.save();
    return { message: "Email verified successfully" };
});
const forgotPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const resetToken = (0, auth_utils_1.generateToken)();
    user.resetPasswordToken = resetToken;
    yield user.save();
    (0, auth_utils_1.sendMockEmail)(user.email, "Reset Your Password", `Your password reset token is: ${resetToken}`);
    return { message: "Password reset email sent" };
});
const resetPassword = (token, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ resetPasswordToken: token }).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid reset token");
    }
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    yield user.save();
    return { message: "Password reset successfully" };
});
exports.AuthServices = {
    getNewAccessToken,
    registerUser,
    credentialsLogin,
    logoutUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
};
