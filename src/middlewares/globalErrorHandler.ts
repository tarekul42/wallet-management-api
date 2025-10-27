/* eslint-disable no-console */
import { Request, Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { TErrorSources } from "../interfaces/error.types";
import handleDuplicateError from "../helpers/handleDuplicacteError";
import handleCastError from "../helpers/handleCastError";
import handleZodError from "../helpers/handleZodError";
import handleValidationError from "../helpers/handleValidationError";
import mongoose from "mongoose";
import { ZodError } from "zod";

export const globalErrorHandler = async (
  err: Error,
  req: Request,
  res: Response
) => {
  if (envVars.NODE_ENV === "development") {
    console.log(err);
  }

  let statusCode = 500;
  let message = "Something Went Wrong!!";
  let errorSources: TErrorSources[] = [];

  // type guard
  const hasCodeProperty = (err: unknown): err is { code: number } => {
    return (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code?: unknown }).code === "number"
    );
  };

  //Duplicate error
  if (hasCodeProperty(err) && err.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // Object ID error / Cast Error
  else if (
    err.name === "CastError" &&
    err instanceof mongoose.Error.CastError
  ) {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  //   Zod validation Error
  else if (err.name === "ZodError" && err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as TErrorSources[];
  }
  //Mongoose Validation Error
  else if (
    err.name === "ValidationError" &&
    err instanceof mongoose.Error.ValidationError
  ) {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    errorSources = simplifiedError.errorSources as TErrorSources[];
    message = simplifiedError.message;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err: envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};
