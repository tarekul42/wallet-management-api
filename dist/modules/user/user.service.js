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
exports.UserServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("./user.model");
const user_interface_1 = require("./user.interface");
const mongoose_1 = __importDefault(require("mongoose"));
const wallet_model_1 = require("../wallet/wallet.model");
const user_helpers_1 = require("./user.helpers");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Service to get a user's own profile
const getMyProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findById(userId);
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return result;
});
const updateMyProfile = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = {};
    if (payload.name) {
        updateData.name = payload.name;
    }
    if (payload.phone) {
        updateData.phone = payload.phone;
    }
    if (Object.keys(updateData).length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No valid fields to update.");
    }
    const result = yield user_model_1.User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return result;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (query.role) {
        if (!Object.values(user_interface_1.Role).includes(query.role)) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid role value");
        }
        filter.role = query.role;
    }
    if (query.approvalStatus) {
        if (!Object.values(user_interface_1.ApprovalStatus).includes(query.approvalStatus)) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid approvalStatus value");
        }
        filter.approvalStatus = query.approvalStatus;
    }
    const result = yield user_model_1.User.find(filter);
    return result;
});
const updateUserStatus = (targetUserId, newStatus, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const targetUser = yield user_model_1.User.findById(targetUserId);
    if (!targetUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Target user not found");
    }
    if (newStatus === user_interface_1.IsActive.BLOCKED) {
        if (!currentUserId) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "currentUserId is required to block a user.");
        }
        if (currentUserId === targetUserId) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You cannot block yourself.");
        }
        if (targetUser.role === user_interface_1.Role.ADMIN) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Admins cannot block other admins.");
        }
    }
    const session = yield mongoose_1.default.startSession();
    let updatedUser;
    try {
        session.startTransaction();
        targetUser.isActive = newStatus;
        updatedUser = yield targetUser.save({ session });
        if (targetUser.wallet) {
            const walletStatus = newStatus === user_interface_1.IsActive.BLOCKED ? "BLOCKED" : "ACTIVE";
            yield wallet_model_1.Wallet.findByIdAndUpdate(targetUser.wallet, { status: walletStatus }, { session });
        }
        yield session.commitTransaction();
    }
    catch (error) {
        yield session.abortTransaction();
        let errorMessage = `Failed to ${newStatus.toLowerCase()} user and wallet.`;
        if (error instanceof Error) {
            errorMessage = `${errorMessage} Error: ${error.message}`;
        }
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
    finally {
        session.endSession();
    }
    return updatedUser;
});
const blockUser = (currentUserId, targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    return updateUserStatus(targetUserId, user_interface_1.IsActive.BLOCKED, currentUserId);
});
const unblockUser = (targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    return updateUserStatus(targetUserId, user_interface_1.IsActive.ACTIVE);
});
const agentApprovalByAdmin = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield user_model_1.User.findById(userId);
    if (!agent) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Agent not found");
    }
    if (agent.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "This user is not an agent. You can only approve agents.");
    }
    if (agent.approvalStatus !== user_interface_1.ApprovalStatus.PENDING) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `This agent has already been reviewed and is currently in '${agent.approvalStatus}' status.`);
    }
    if (payload.approvalStatus === user_interface_1.ApprovalStatus.PENDING) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Cannot set agent status back to PENDING.");
    }
    if (payload.approvalStatus === user_interface_1.ApprovalStatus.APPROVED) {
        agent.approvalStatus = user_interface_1.ApprovalStatus.APPROVED;
        agent.commissionRate = payload.commissionRate || 0.02;
    }
    else {
        agent.approvalStatus = user_interface_1.ApprovalStatus.REJECTED;
        agent.commissionRate = null;
    }
    yield agent.save();
    return agent;
});
const suspendAgent = (agentId, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield user_model_1.User.findById(agentId);
    if (!agent) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Agent not found");
    }
    if (agent.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "This user is not an agent. You can only suspend agents.");
    }
    if (newStatus === user_interface_1.ApprovalStatus.SUSPENDED) {
        if (agent.approvalStatus !== user_interface_1.ApprovalStatus.APPROVED) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You can only suspend an agent who is currently approved.");
        }
        agent.approvalStatus = user_interface_1.ApprovalStatus.SUSPENDED;
    }
    else if (newStatus === user_interface_1.ApprovalStatus.APPROVED) {
        if (agent.approvalStatus !== user_interface_1.ApprovalStatus.SUSPENDED) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You can only re-approve an agent who is currently suspended.");
        }
        agent.approvalStatus = user_interface_1.ApprovalStatus.APPROVED;
    }
    yield agent.save();
    return agent;
});
const updatePassword = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(payload.oldPassword, user.password);
    if (!isPasswordValid) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid old password");
    }
    user.password = payload.newPassword;
    yield user.save();
    return user;
});
const createAdmin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email: payload.email });
    if (user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User already exists with this email.");
    }
    if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Registration is only available for admins and super admins.");
    }
    const session = yield mongoose_1.default.startSession();
    let result;
    try {
        session.startTransaction();
        const adminData = {
            name: payload.name,
            email: payload.email,
            password: payload.password,
            phone: payload.phone,
            role: payload.role,
        };
        const newUser = yield (0, user_helpers_1.createUserAndWallet)(adminData, session);
        yield session.commitTransaction();
        result = newUser;
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
exports.UserServices = {
    getMyProfile,
    updateMyProfile,
    getAllUsers,
    blockUser,
    unblockUser,
    agentApprovalByAdmin,
    suspendAgent,
    updatePassword,
    createAdmin,
};
