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
exports.createUserAndWallet = void 0;
const user_model_1 = require("./user.model");
const wallet_model_1 = require("../wallet/wallet.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const createUserAndWallet = (userData, session) => __awaiter(void 0, void 0, void 0, function* () {
    // Create the new user
    const newUserArr = yield user_model_1.User.create([userData], { session });
    const newUser = newUserArr[0];
    if (!newUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "User creation failed during registration.");
    }
    // Create a wallet for the new user
    const newWalletArr = yield wallet_model_1.Wallet.create([
        {
            owner: newUser._id,
            balance: userData.role === "USER" || userData.role === "AGENT" ? 50 : 0, // Give initial balance to users and agents
        },
    ], { session });
    if (!newWalletArr.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Wallet creation failed during registration.");
    }
    // Link the wallet to the user
    newUser.wallet = newWalletArr[0]._id;
    yield newUser.save({ session });
    return newUser;
});
exports.createUserAndWallet = createUserAndWallet;
