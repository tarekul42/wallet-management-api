"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimiter_1 = require("./config/rateLimiter");
const routes_1 = __importDefault(require("./routes"));
const notFound_1 = __importDefault(require("./middlewares/notFound"));
const globalErrorHandler_1 = __importDefault(require("./middlewares/globalErrorHandler"));
const passport_1 = __importDefault(require("passport"));
require("./config/passport");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(rateLimiter_1.generalApiRateLimiter);
app.use(passport_1.default.initialize());
app.use("/api/v1", routes_1.default);
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Wallet Management API!" });
});
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
