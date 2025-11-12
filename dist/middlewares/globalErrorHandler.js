"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const env_1 = require("../config/env");
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const handleDuplicacteError_1 = __importDefault(require("../helpers/handleDuplicacteError"));
const handleCastError_1 = __importDefault(require("../helpers/handleCastError"));
const handleZodError_1 = __importDefault(require("../helpers/handleZodError"));
const handleValidationError_1 = __importDefault(require("../helpers/handleValidationError"));
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
const globalErrorHandler = (err, req, res, next) => {
    if (env_1.envVars.NODE_ENV === "development") {
        logger_1.default.error(err);
    }
    let statusCode = 500;
    let message = "Something Went Wrong!!";
    let errorSources = [];
    // type guard
    const hasCodeProperty = (err) => {
        return (typeof err === "object" &&
            err !== null &&
            "code" in err &&
            typeof err.code === "number");
    };
    //Duplicate error
    if (hasCodeProperty(err) && err.code === 11000) {
        const simplifiedError = (0, handleDuplicacteError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
    }
    // Object ID error / Cast Error
    else if (err.name === "CastError" &&
        err instanceof mongoose_1.default.Error.CastError) {
        const simplifiedError = (0, handleCastError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
    }
    //   Zod validation Error
    else if (err.name === "ZodError" && err instanceof zod_1.ZodError) {
        const simplifiedError = (0, handleZodError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = simplifiedError.errorSources;
    }
    //Mongoose Validation Error
    else if (err.name === "ValidationError" &&
        err instanceof mongoose_1.default.Error.ValidationError) {
        const simplifiedError = (0, handleValidationError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        errorSources = simplifiedError.errorSources;
        message = simplifiedError.message;
    }
    else if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err instanceof Error) {
        statusCode = 500;
        message = err.message;
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err: env_1.envVars.NODE_ENV === "development" ? err : null,
        stack: env_1.envVars.NODE_ENV === "development" ? err.stack : null,
    });
};
exports.globalErrorHandler = globalErrorHandler;
