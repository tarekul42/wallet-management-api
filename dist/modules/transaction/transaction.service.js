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
const dayjs_1 = __importDefault(require("dayjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_codes_1 = require("http-status-codes");
const uuid_1 = require("uuid");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const wallet_model_1 = require("../wallet/wallet.model");
const wallet_interface_1 = require("../wallet/wallet.interface");
const transaction_model_1 = require("./transaction.model");
const transaction_interface_1 = require("./transaction.interface");
const system_settings_model_1 = require("../system-settings/system-settings.model");
const user_interface_1 = require("../user/user.interface");
const DAILY_TRANSACTION_LIMIT = 50000;
// Private helper to handle agent commission
const _handleAgentCommission = (session, agent, transactionAmount, transactionType) => __awaiter(void 0, void 0, void 0, function* () {
    if (agent.role === user_interface_1.Role.AGENT && agent.commissionRate && agent.wallet) {
        const commission = transactionAmount * agent.commissionRate;
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
const checkDailyTransactionLimit = (userId, amount, session) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const startOfDay = (0, dayjs_1.default)().startOf("day").toDate();
    const result = yield transaction_model_1.Transaction.aggregate([
        {
            $match: {
                sender: userId,
                createdAt: { $gte: startOfDay },
                type: { $in: [transaction_interface_1.TransactionType.SEND_MONEY, transaction_interface_1.TransactionType.WITHDRAW] },
                status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" },
            },
        },
    ]).session(session);
    const totalToday = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.totalAmount) || 0;
    if (totalToday + amount > DAILY_TRANSACTION_LIMIT) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, `You have exceeded your daily transaction limit of ${DAILY_TRANSACTION_LIMIT}. You have already spent ${totalToday} today.`);
    }
});
const sendMoney = (senderId, receiverEmail, amount, description) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const settings = yield system_settings_model_1.SystemSettings.findOne().session(session);
        const transactionFeeRate = settings ? settings.transactionFee : 0.015; // Fallback to 1.5%
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
        const fee = amount * transactionFeeRate;
        const totalDeduction = amount + fee;
        if (sender.wallet.balance < totalDeduction) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Insufficient funds");
        }
        yield wallet_model_1.Wallet.findByIdAndUpdate(sender.wallet._id, { $inc: { balance: -totalDeduction } }, { session });
        yield wallet_model_1.Wallet.findByIdAndUpdate(receiver.wallet._id, { $inc: { balance: amount } }, { session });
        const referenceId = (0, uuid_1.v4)();
        yield transaction_model_1.Transaction.create([
            {
                walletId: sender.wallet._id,
                sender: sender._id,
                receiver: receiver._id,
                amount,
                fee,
                type: transaction_interface_1.TransactionType.SEND_MONEY,
                status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
                referenceId,
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
            receiverWallet = yield wallet_model_1.Wallet.findOne({ owner: actor._id }).session(session);
            receiverUser = actor;
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
        const referenceId = (0, uuid_1.v4)();
        yield transaction_model_1.Transaction.create([
            {
                walletId: receiverWallet._id,
                sender: actor.role === user_interface_1.Role.AGENT ? actor._id : undefined,
                receiver: receiverUser._id,
                amount,
                fee: 0,
                type: transaction_interface_1.TransactionType.CASH_IN,
                status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
                referenceId,
                description: "Cash in",
            },
        ], { session });
        yield _handleAgentCommission(session, actor, amount, "cash-in");
        yield session.commitTransaction();
        return { message: "Money added successfully" };
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
            fromWallet = yield wallet_model_1.Wallet.findOne({ owner: fromUser._id }).session(session);
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
        if (fromWallet.balance < amount) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Insufficient funds");
        }
        yield wallet_model_1.Wallet.findByIdAndUpdate(fromWallet._id, { $inc: { balance: -amount } }, { session });
        const referenceId = (0, uuid_1.v4)();
        yield transaction_model_1.Transaction.create([
            {
                walletId: fromWallet._id,
                sender: actor._id,
                receiver: fromUser._id, // In this context, receiver is the one whose money is withdrawn
                amount,
                fee: 0,
                type: transactionType,
                status: transaction_interface_1.TransactionStatus.SUCCESSFUL,
                referenceId,
                description: "Withdrawal",
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (actor.role === user_interface_1.Role.ADMIN) {
        // Admins can see all transactions, but can filter by userId if provided
        if (typeof query.userId === "string") {
            filter.$or = [{ sender: query.userId }, { receiver: query.userId }];
        }
    }
    else {
        // Users and Agents can only see their own transactions
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
            filter.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };
        }
    }
    const transactions = yield transaction_model_1.Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = yield transaction_model_1.Transaction.countDocuments(filter);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: transactions,
    };
});
const getCommissionHistory = (actorId) => __awaiter(void 0, void 0, void 0, function* () {
    const actor = yield user_model_1.User.findById(actorId);
    if (!actor) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (actor.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only agents can view commission history");
    }
    const wallet = yield wallet_model_1.Wallet.findOne({ owner: actorId });
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found");
    }
    const transactions = yield transaction_model_1.Transaction.find({
        walletId: wallet._id,
        type: transaction_interface_1.TransactionType.COMMISSION,
    });
    return transactions;
});
exports.TransactionServices = {
    sendMoney,
    addMoney,
    withdrawMoney,
    viewHistory,
    getCommissionHistory,
};
