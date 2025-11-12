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
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = __importDefault(require("./utils/logger"));
let server;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(env_1.envVars.DB_URL);
        logger_1.default.info("Connected to database!!");
        server = app_1.default.listen(env_1.envVars.PORT, () => {
            logger_1.default.info(`Server is listening to port ${env_1.envVars.PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error(error);
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield startServer();
}))();
process.on("SIGTERM", () => {
    logger_1.default.info("SIGTERM signal received. Server shutting down...");
    if (server) {
        server.close(() => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.default.info("HTTP server closed.");
            yield mongoose_1.default.connection.close();
            logger_1.default.info("Database connection closed.");
            process.exit(0);
        }));
    }
    else {
        process.exit(0);
    }
});
process.on("SIGINT", () => {
    logger_1.default.info("SIGINT signal received. Server shutting down.");
    if (server) {
        server.close(() => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.default.info("HTTP server closed.");
            yield mongoose_1.default.connection.close();
            logger_1.default.info("Database connection closed.");
            process.exit(0);
        }));
    }
    else {
        process.exit(0);
    }
});
process.on("unhandledRejection", (err) => {
    logger_1.default.error("Unhandled rejection detected. Server shutting down.", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("uncaughtException", (err) => {
    logger_1.default.error("Uncaught exception detected. Server shutting down.", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
