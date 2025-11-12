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
exports.TransactionServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_codes_1 = require("http-status-codes");
const uuid_1 = require("uuid");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const wallet_model_1 = require("../wallet/wallet.model");
const wallet_interface_1 = require("../wallet/wallet.interface");
const transaction_model_1 = require("./transaction.model");
const transaction_interface_1 = require("./transaction.interface");
const user_interface_1 = require("../user/user.interface");
const system_settings_service_1 = require("../system-settings/system-settings.service");
const MAX_PAGINATION_LIMIT = 100;
const DAILY_TRANSACTION_LIMIT = 5000;
// Helper to check daily transaction limit
const checkDailyTransactionLimit = (userId, amount, session) => __awaiter(void 0, void 0, void 0, function* () {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const filter = {
        sender: userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        type: { $in: [transaction_interface_1.TransactionType.SEND_MONEY, transaction_interface_1.TransactionType.WITHDRAW] },
        status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
    };
    const transactions = yield transaction_model_1.Transaction.find(filter).session(session || null);
    const totalSentToday = transactions.reduce((acc, tr) => acc + tr.amount, 0);
    if (totalSentToday + amount > DAILY_TRANSACTION_LIMIT) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Daily transaction limit of ${DAILY_TRANSACTION_LIMIT} exceeded. You have already sent ${totalSentToday} today.`);
    }
});
// Private helper to handle agent commission
const _handleAgentCommission = (session, agent, transactionAmount, transactionType) => __awaiter(void 0, void 0, void 0, function* () {
    if (agent.role === user_interface_1.Role.AGENT &&
        agent.commissionRate != null &&
        agent.wallet) {
        const commissionRateNum = parseFloat(String(agent.commissionRate));
        if (isNaN(commissionRateNum) || commissionRateNum < 0)
            return;
        const commission = transactionAmount * commissionRateNum;
        if (commission <= 0)
            return; // Don't process zero or negative commission
        // Add commission to agent's wallet
        yield wallet_model_1.Wallet.findByIdAndUpdate(agent.wallet._id, { $inc: { balance: commission } }, { session });
        // Create commission transaction record
        yield transaction_model_1.Transaction.create([
            {
                walletId: agent.wallet._id,
                amount: commission,
                type: transaction_interface_1.TransactionType.COMMISSION,
                status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
                referenceId: (0, uuid_1.v4)(),
                description: `Commission for ${transactionType} of ${transactionAmount}`,
                receiver: agent._id,
            },
        ], { session });
    }
});
const sendMoney = (senderId, receiverEmail, amount, description) => __awaiter(void 0, void 0, void 0, function* () {
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Amount must be positive.");
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const sender = yield user_model_1.User.findById(senderId)
            .populate("wallet")
            .session(session);
        const receiver = yield user_model_1.User.findOne({ email: receiverEmail })
            .populate("wallet")
            .session(session);
        if (!sender) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Sender not found");
        }
        if (!receiver) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Receiver not found");
        }
        if (sender.email === receiver.email) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You cannot send money to yourself");
        }
        if (!sender.wallet || !receiver.wallet) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Sender or receiver wallet not found");
        }
        if (sender.wallet.status !== wallet_interface_1.WalletStatus.ACTIVE) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your wallet is not active");
        }
        if (receiver.wallet.status !== wallet_interface_1.WalletStatus.ACTIVE) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Receiver's wallet is not active");
        }
        yield checkDailyTransactionLimit(sender._id, amount, session);
        const settings = yield system_settings_service_1.SystemSettingsServices.getSystemSettings();
        const transactionFeeRate = settings.transactionFee;
        const fee = amount * transactionFeeRate;
        const totalDeduction = amount + fee;
        // Atomically check balance and decrement
        const senderWalletUpdate = yield wallet_model_1.Wallet.findOneAndUpdate({
            _id: sender.wallet._id,
            balance: { $gte: totalDeduction },
        }, { $inc: { balance: -totalDeduction } }, { session });
        if (!senderWalletUpdate) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Insufficient funds.");
        }
        // Increment receiver's balance
        yield wallet_model_1.Wallet.findByIdAndUpdate(receiver.wallet._id, { $inc: { balance: amount } }, { session });
        // Add fee to system wallet
        if (fee > 0) {
            // NOTE: Real system wallet ID should be in settings. Using placeholder.
            const SYSTEM_WALLET_ID = "60d5f5f5f5f5f5f5f5f5f5f5";
            yield wallet_model_1.Wallet.findByIdAndUpdate(SYSTEM_WALLET_ID, { $inc: { balance: fee } }, { session });
        }
        // Create transaction record
        yield transaction_model_1.Transaction.create([
            {
                walletId: sender.wallet._id,
                sender: sender._id,
                receiver: receiver._id,
                amount,
                fee,
                type: transaction_interface_1.TransactionType.SEND_MONEY,
                status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
                referenceId: (0, uuid_1.v4)(),
                description,
            },
        ], { session });
        yield session.commitTransaction();
        return { message: "Money sent successfully" };
    }
    catch (error) {
        yield session.abortTransaction();
        if (error instanceof AppError_1.default) {
            throw error;
        }
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Transaction failed. Please try again later.");
    }
    finally {
        session.endSession();
    }
});
const addMoney = (actorId, amount, receiverId) => __awaiter(void 0, void 0, void 0, function* () {
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Amount must be positive.");
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const actor = yield user_model_1.User.findById(actorId)
            .populate("wallet")
            .session(session);
        if (!actor) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
        }
        let receiverWallet;
        let receiverUser;
        if (actor.role === user_interface_1.Role.USER) {
            // For self-top-up, the actor is the receiver, use the populated wallet
            receiverUser = actor;
            receiverWallet = actor.wallet;
        }
        else if (actor.role === user_interface_1.Role.AGENT) {
            if (!receiverId) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Receiver ID is required for agents");
            }
            receiverUser = yield user_model_1.User.findById(receiverId).session(session);
            if (!receiverUser) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Receiver not found");
            }
            receiverWallet = yield wallet_model_1.Wallet.findOne({ owner: receiverId }).session(session);
        }
        else {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Admins cannot add money");
        }
        if (!receiverWallet) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Receiver wallet not found");
        }
        if (receiverWallet.status !== wallet_interface_1.WalletStatus.ACTIVE) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Receiver's wallet is not active");
        }
        yield wallet_model_1.Wallet.findByIdAndUpdate(receiverWallet._id, { $inc: { balance: amount } }, { session });
        yield transaction_model_1.Transaction.create([
            {
                walletId: receiverWallet._id,
                sender: actor.role === user_interface_1.Role.AGENT ? actor._id : undefined,
                receiver: receiverUser === null || receiverUser === void 0 ? void 0 : receiverUser._id,
                amount,
                fee: 0,
                type: transaction_interface_1.TransactionType.CASH_IN,
                status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
                referenceId: (0, uuid_1.v4)(),
                description: "Cash in",
            },
        ], { session });
        yield _handleAgentCommission(session, actor, amount, "cash-in");
        yield session.commitTransaction();
        const updatedWallet = yield wallet_model_1.Wallet.findById(receiverWallet._id).session(session);
        return {
            message: "Money added successfully",
            wallet: updatedWallet,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        if (error instanceof AppError_1.default) {
            throw error;
        }
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Transaction failed. Please try again later.");
    }
    finally {
        session.endSession();
    }
});
const withdrawMoney = (actorId, amount, fromId) => __awaiter(void 0, void 0, void 0, function* () {
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Amount must be positive.");
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const actor = yield user_model_1.User.findById(actorId)
            .populate("wallet")
            .session(session);
        if (!actor) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
        }
        let fromWallet;
        let fromUser;
        let transactionType;
        if (actor.role === user_interface_1.Role.USER) {
            fromUser = actor;
            fromWallet = actor.wallet; // Use populated wallet
            transactionType = transaction_interface_1.TransactionType.WITHDRAW;
            yield checkDailyTransactionLimit(actor._id, amount, session);
        }
        else if (actor.role === user_interface_1.Role.AGENT) {
            if (!fromId) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "'fromId' is required for agents");
            }
            fromUser = yield user_model_1.User.findById(fromId).session(session);
            if (!fromUser) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User to withdraw from not found");
            }
            fromWallet = yield wallet_model_1.Wallet.findOne({ owner: fromId }).session(session);
            transactionType = transaction_interface_1.TransactionType.CASH_OUT;
            yield checkDailyTransactionLimit(fromUser._id, amount, session);
        }
        else {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Admins cannot withdraw money");
        }
        if (!fromWallet) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet to withdraw from not found");
        }
        if (fromWallet.status !== wallet_interface_1.WalletStatus.ACTIVE) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Wallet to withdraw from is not active");
        }
        // Atomically check balance and decrement
        const fromWalletUpdate = yield wallet_model_1.Wallet.findOneAndUpdate({
            _id: fromWallet._id,
            balance: { $gte: amount },
        }, { $inc: { balance: -amount } }, { session });
        if (!fromWalletUpdate) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Insufficient funds.");
        }
        yield transaction_model_1.Transaction.create([
            {
                walletId: fromWallet._id,
                sender: actor._id,
                receiver: fromUser._id, // Clarification: `receiver` is the owner of the debited wallet.
                amount,
                fee: 0,
                type: transactionType,
                status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
                referenceId: (0, uuid_1.v4)(),
                description: `Withdrawal by ${actor.role}`,
            },
        ], { session });
        yield _handleAgentCommission(session, actor, amount, "cash-out");
        yield session.commitTransaction();
        return { message: "Money withdrawn successfully" };
    }
    catch (error) {
        yield session.abortTransaction();
        if (error instanceof AppError_1.default) {
            throw error;
        }
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Transaction failed. Please try again later.");
    }
    finally {
        session.endSession();
    }
});
const viewHistory = (actorId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const actor = yield user_model_1.User.findById(actorId);
    if (!actor) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(MAX_PAGINATION_LIMIT, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const filter = {};
    if (actor.role === user_interface_1.Role.ADMIN) {
        if (typeof query.userId === "string") {
            filter.$or = [{ sender: query.userId }, { receiver: query.userId }];
        }
    }
    else {
        filter.$or = [{ sender: actor._id }, { receiver: actor._id }];
    }
    if (typeof query.type === "string") {
        filter.type = query.type;
    }
    if (typeof query.startDate === "string" &&
        typeof query.endDate === "string") {
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            filter.createdAt = { $gte: startDate, $lte: endDate };
        }
    }
    const transactions = yield transaction_model_1.Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = yield transaction_model_1.Transaction.countDocuments(filter);
    return {
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        data: transactions,
    };
});
const getCommissionHistory = (actorId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const actor = yield user_model_1.User.findById(actorId);
    if (!actor) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (actor.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only agents can view commission history");
    }
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(MAX_PAGINATION_LIMIT, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const filter = {
        receiver: actor._id,
        type: transaction_interface_1.TransactionType.COMMISSION,
    };
    const transactions = yield transaction_model_1.Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = yield transaction_model_1.Transaction.countDocuments(filter);
    return {
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        data: transactions,
    };
});
exports.TransactionServices = {
    sendMoney,
    addMoney,
    withdrawMoney,
    viewHistory,
    getCommissionHistory,
};
