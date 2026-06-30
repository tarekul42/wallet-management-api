import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError.js";
import { IsActive, IUser } from "../modules/user/user.interface.js";

export const assertUserActive = (user: Pick<IUser, "isActive" | "isDeleted" | "isVerified">) => {
  if (user.isDeleted) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "This account has been deleted.");
  }
  if (user.isActive === IsActive.BLOCKED || user.isActive === IsActive.INACTIVE) {
    throw new AppError(
      user.isActive === IsActive.BLOCKED ? StatusCodes.FORBIDDEN : StatusCodes.UNAUTHORIZED,
      `This account has been ${user.isActive.toLowerCase()}.`,
    );
  }
};

export const assertUserVerified = (user: Pick<IUser, "isVerified">) => {
  if (!user.isVerified) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Your account is not verified.");
  }
};
