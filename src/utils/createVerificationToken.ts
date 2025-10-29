import { Types } from "mongoose";
import cryptoJs from "crypto-js";
import dayjs from "dayjs";
import VerificationToken from "../modules/verificationToken/verificationToken.model";

const createVerificationToken = async (userId: Types.ObjectId) => {
  const rawToken = cryptoJs.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

  const hashedToken = cryptoJs.SHA256(rawToken).toString(CryptoJS.enc.Hex);

  const expiresAt = dayjs().add(1, "hour").toDate();

  await VerificationToken.create({
    userId,
    token: hashedToken,
    expiresAt,
  });

  return userId;
};

export default createVerificationToken;
