"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const handleDuplicateError = (err) => {
    if (err instanceof Error && typeof err.message === "string") {
        const matchedArray = err.message.match(/"([^"]*)"/);
        const field = (matchedArray === null || matchedArray === void 0 ? void 0 : matchedArray[1]) || "Field";
        return {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            message: `${field} already exists!!`,
        };
    }
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: "Duplicate value already exists",
    };
};
exports.default = handleDuplicateError;
