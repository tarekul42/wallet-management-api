import { StatusCodes } from "http-status-codes";
import { TGenericErrorResponse } from "../interfaces/error.types";

export const handleDuplicateError = (err: unknown): TGenericErrorResponse => {
  if (err instanceof Error && typeof err.message === "string") {
    const matchedArray = err.message.match(/"([^"]*)"/);
    const field = matchedArray?.[1] || "Field";
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      message: `${field} already exists!!`,
    };
  }

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Duplicate value already exists",
  };
};
