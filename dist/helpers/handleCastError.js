"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const handleCastError = (err) => {
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: `Invalid MongoDB objectID for field '${err.path}'. Please provide a valid id, Please.`,
    };
};
exports.default = handleCastError;
