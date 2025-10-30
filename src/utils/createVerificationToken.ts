import { Types } from "mongoose";
import crypto from "crypto";
import dayjs from "dayjs";
import VerificationToken from "../modules/verificationToken/verificationToken.model";

const createVerificationToken = async (userId: Types.ObjectId) => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = dayjs().add(1, "hour").toDate();

  await VerificationToken.create({
    userId,
    token: hashedToken,
    expiresAt,
  });

  return rawToken;
};

export default createVerificationToken;
