import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { envVars } from "../config/env";
import { TErrorSources } from "../interfaces/error.types";
import handleDuplicateError from "../helpers/handleDuplicateError";
import handleCastError from "../helpers/handleCastError";
import handleZodError from "../helpers/handleZodError";
import handleValidationError from "../helpers/handleValidationError";
import AppError from "../errorHelpers/AppError";
import logger from "../utils/logger";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error(err);

  let errorSources: TErrorSources[] = [];
  let statusCode = 500;
  let message = "Something went wrong";

  const error = err as Record<string, unknown>;

  if (error.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  } else if (err instanceof mongoose.Error.CastError) {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  } else if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as TErrorSources[];
  } else if (err instanceof mongoose.Error.ValidationError) {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as TErrorSources[];
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = envVars.NODE_ENV === "development" ? err.message : "Something went wrong";
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err: envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? (err as Error).stack : null,
  });
};

export default globalErrorHandler;
