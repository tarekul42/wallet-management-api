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
exports.WalletServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const wallet_model_1 = require("./wallet.model");
const wallet_interface_1 = require("./wallet.interface");
const getMyWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found.");
    }
    const wallet = yield wallet_model_1.Wallet.findById(user.wallet);
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found for this user.");
    }
    return wallet;
});
const getAllWallets = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (query.status) {
        filter.status = query.status;
    }
    const wallets = yield wallet_model_1.Wallet.find(filter);
    return wallets;
});
const getSingleWallet = (walletId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findById(walletId);
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found.");
    }
    return wallet;
});
const updateWalletStatus = (walletId, status) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findById(walletId);
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found.");
    }
    wallet.status = status;
    yield wallet.save();
    return wallet;
});
const blockWallet = (walletId) => __awaiter(void 0, void 0, void 0, function* () {
    return updateWalletStatus(walletId, wallet_interface_1.WalletStatus.BLOCKED);
});
const unblockWallet = (walletId) => __awaiter(void 0, void 0, void 0, function* () {
    return updateWalletStatus(walletId, wallet_interface_1.WalletStatus.ACTIVE);
});
exports.WalletServices = {
    getMyWallet,
    getAllWallets,
    getSingleWallet,
    blockWallet,
    unblockWallet,
};
