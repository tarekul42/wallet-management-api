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
exports.User = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
const env_1 = require("../../config/env");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true, // allows unique but optional
    },
    address: {
        type: String,
    },
    nid: {
        type: String,
        required: function () {
            return this.role === user_interface_1.Role.USER || this.role === user_interface_1.Role.AGENT;
        }, // so that, admins will be able to add without nid requirement
    },
    role: {
        type: String,
        enum: Object.values(user_interface_1.Role),
        default: user_interface_1.Role.USER,
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: String,
        enum: Object.values(user_interface_1.IsActive),
        default: user_interface_1.IsActive.ACTIVE,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    wallet: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Wallet",
    },
    commissionRate: {
        type: Number,
        default: null,
    },
    approvalStatus: {
        type: String,
        enum: Object.values(user_interface_1.ApprovalStatus),
        default: null,
        required: function () {
            return this.role === user_interface_1.Role.AGENT;
        },
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Hash password before saving
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("password")) {
            this.password = yield bcryptjs_1.default.hash(this.password, Number(env_1.envVars.BCRYPT_SALT_ROUND));
        }
        next();
    });
});
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};
exports.User = (0, mongoose_1.model)("User", userSchema);
