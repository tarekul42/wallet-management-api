import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenError";
  }
}

const generateToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string
) => {
  const token = jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
  return token;
};

const verifyToken = (token: string, secret: string) => {
  try {
    const decodedToken = jwt.verify(token, secret) as JwtPayload;
    return decodedToken;
  } catch (error) {
    throw new TokenError(`Invalid token: ${(error as Error).message}`);
  }
};

export { generateToken, verifyToken };
