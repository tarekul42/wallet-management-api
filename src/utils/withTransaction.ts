import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError.js";

type TransactionCallback<T> = (session: mongoose.ClientSession) => Promise<T>;

export const withTransaction = async <T>(
  fn: TransactionCallback<T>,
  errorContext = "Operation",
): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${errorContext} failed. Please try again later.`,
    );
  } finally {
    session.endSession();
  }
};
