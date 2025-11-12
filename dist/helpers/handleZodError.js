"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const handleZodError = (err) => {
    const errorSources = [];
    err.issues.forEach((issue) => {
        errorSources.push({
            path: issue.path.join("."),
            message: issue.message,
        });
    });
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: "Zod Error",
    };
};
exports.default = handleZodError;
