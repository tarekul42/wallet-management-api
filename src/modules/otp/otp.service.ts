import crypto from "crypto";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";

const generateOTP = (length = 6) => {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString;
  return otp;
};

// TODO: I will complete this after a while. lets finish the rest part.

const sendOTP = async (email: string, name: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.isVerified) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User is already verified");
  }

  const otp = generateOTP();

  return { name, otp };
};

const verityOTP = (email: string, name: string) => {
  return { email, name };
};

export const OTPService = {
  sendOTP,
  verityOTP,
};
