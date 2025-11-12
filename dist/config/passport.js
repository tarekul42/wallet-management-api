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
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const user_model_1 = require("../modules/user/user.model");
const user_interface_1 = require("../modules/user/user.interface");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: "email",
    passwordField: "password",
}, (email, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.User.findOne({ email }).select("+password");
        if (!user) {
            return done(null, false, { message: "User does not exists" });
        }
        if (!user.isVerified) {
            return done(null, false, { message: "Please verify your email" });
        }
        if (user.isActive === user_interface_1.IsActive.BLOCKED ||
            user.isActive === user_interface_1.IsActive.INACTIVE) {
            return done(null, false, {
                message: `Your account is ${user.isActive}`,
            });
        }
        if (user.isDeleted) {
            return done(null, false, { message: "Your account is deleted" });
        }
        if (!user.password) {
            return done(null, false, {
                message: "Password not set, please reset your password",
            });
        }
        const isPasswordMatched = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordMatched) {
            return done(null, false, { message: "Password does not match" });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error);
    }
})));
