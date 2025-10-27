import { ZodError, ZodIssue } from "zod";
import {
  TErrorSources,
  TGenericErrorResponse,
} from "../interfaces/error.types";
import { StatusCodes } from "http-status-codes";

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSources[] = [];

  err.issues.forEach((issue: ZodIssue) => {
    errorSources.push({
      path: issue.path.join("."),
      message: issue.message,
    });
  });

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Zod Error",
  };
};

export default handleZodError;
