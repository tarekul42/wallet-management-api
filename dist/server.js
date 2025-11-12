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
let server;
const gracefulShutdown = (signal, error) => __awaiter(void 0, void 0, void 0, function* () {
    if (error) {
        console.error(`Shutting down due to ${signal}.`, error);
    }
    else {
        console.info(`${signal} signal received. Server shutting down...`);
    }
    // Allow time for cleanup, then force exit
    setTimeout(() => {
        console.warn("Shutdown timed out. Forcing exit.");
        process.exit(1);
    }, 10000).unref(); // .unref() allows the process to exit if it finishes before the timeout
    try {
        // 1. Stop the server from accepting new connections
        if (server) {
            yield new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        return reject(err);
                    }
                    console.info("HTTP server closed.");
                    resolve();
                });
            });
        }
        // 2. Close the database connection
        if (mongoose_1.default.connection.readyState === 1) {
            yield mongoose_1.default.connection.close();
            console.info("Database connection closed.");
        }
    }
    catch (shutdownError) {
        console.error("Error during graceful shutdown:", shutdownError);
        process.exit(1);
    }
    process.exit(error ? 1 : 0);
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(env_1.envVars.DB_URL);
        console.info("Connected to database!!");
        server = app_1.default.listen(env_1.envVars.PORT, () => {
            console.info(`Server is listening to port ${env_1.envVars.PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        // Ensure DB connection is closed if startup fails
        if (mongoose_1.default.connection.readyState === 1) {
            yield mongoose_1.default.connection.close();
        }
        process.exit(1);
    }
});
startServer();
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
    gracefulShutdown("unhandledRejection", reason);
});
process.on("uncaughtException", (error) => {
    gracefulShutdown("uncaughtException", error);
});
