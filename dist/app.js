"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const passport_1 = __importDefault(require("passport"));
require("./config/passport");
const notFound_1 = __importDefault(require("./middlewares/notFound"));
const globalErrorHandler_1 = require("./middlewares/globalErrorHandler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
// Middlewares
app.use(passport_1.default.initialize());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: `http://localhost:${process.env.PORT || 5000}`,
    credentials: true,
}));
// Main router
app.use("/api/v1", routes_1.default);
// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to Wallet management api",
    });
});
// Error handlers
app.use(notFound_1.default);
app.use(globalErrorHandler_1.globalErrorHandler);
exports.default = app;
