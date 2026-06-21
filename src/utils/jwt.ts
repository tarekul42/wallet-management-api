import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { User } from "../modules/user/user.model";
import AppError from "../errorHelpers/AppError";
import httpStatus from "http-status-codes";

const generateToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string,
) => {
  const token = jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
  return token;
};

const verifyToken = async (token: string, secret: string) => {
  try {
    const decodedToken = jwt.verify(token, secret) as JwtPayload;

    const { userId, tokenVersion } = decodedToken;

    if (tokenVersion === undefined) {
      return decodedToken;
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not found");
    }

    if (tokenVersion !== user.tokenVersion) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Token has been invalidated");
    }

    return decodedToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(httpStatus.UNAUTHORIZED, `Invalid token: ${(error as Error).message}`);
  }
};

export { generateToken, verifyToken };
