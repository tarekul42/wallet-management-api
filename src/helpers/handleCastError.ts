import mongoose from "mongoose";
import { TGenericErrorResponse } from "../interfaces/error.types";
import { StatusCodes } from "http-status-codes";

const handleCastError = (
  err: mongoose.Error.CastError
): TGenericErrorResponse => {
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: `Invalid MongoDB objectID for field '${err.path}'. Please provide a valid id, Please.`,
  };
};

export default handleCastError;
