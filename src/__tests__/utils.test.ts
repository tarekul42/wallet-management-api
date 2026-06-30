import { describe, expect, test, mock, spyOn, beforeEach } from "bun:test";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

// =========================================================================
// MOCKS - must be registered before dynamic imports of modules under test
// =========================================================================

// ----- jsonwebtoken (used by utils/jwt.ts) -----
const mockSign = mock(() => "mocked-token");
const mockVerify = mock(() => ({
  userId: "user123",
  email: "test@example.com",
  role: "USER",
  tokenVersion: 1,
}));

mock.module("jsonwebtoken", () => ({
  default: { sign: mockSign, verify: mockVerify },
}));

// ----- User model (used by jwt.ts, userTokens.ts, user.helpers.ts) -----
const mockUserFindById = mock(() => Promise.resolve(null));
const mockUserFindOne = mock(() => Promise.resolve(null));
const mockUserCreate = mock(() => Promise.resolve([]));

mock.module("../modules/user/user.model", () => ({
  User: {
    findById: mockUserFindById,
    findOne: mockUserFindOne,
    create: mockUserCreate,
  },
}));

// ----- Wallet model (used by user.helpers.ts) -----
const mockWalletCreate = mock(() => Promise.resolve([]));

mock.module("../modules/wallet/wallet.model", () => ({
  Wallet: {
    create: mockWalletCreate,
  },
}));

// ----- env config (used by setCookie.ts, userTokens.ts, etc.) -----
mock.module("../config/env", () => ({
  envVars: {
    NODE_ENV: "development",
    PORT: "5000",
    DB_URL: "mongodb://localhost:27017/test",
    CORS_ORIGIN: "http://localhost:3000",
    COOKIE_DOMAIN: "localhost",
    JWT_ACCESS_SECRET: "test-access-secret",
    JWT_ACCESS_EXPIRES: "15m",
    JWT_REFRESH_SECRET: "test-refresh-secret",
    JWT_REFRESH_EXPIRES: "7d",
    BCRYPT_SALT_ROUND: "10",
    SUPER_ADMIN_EMAIL: "admin@test.com",
    SUPER_ADMIN_PASSWORD: "Admin123!",
    CLIENT_URL: "http://localhost:3000",
    EXPRESS_SESSION_SECRET: "test-session-secret",
  },
}));

// ----- logger is NOT mocked so we can spy on console.* in tests -----

// =========================================================================
// DYNAMIC IMPORTS - modules under test
// =========================================================================

const { default: AppError } = await import("../errorHelpers/AppError");
const { default: handleCastError } = await import("../helpers/handleCastError");
const { default: handleDuplicateError } = await import("../helpers/handleDuplicateError");
const { default: handleValidationError } = await import("../helpers/handleValidationError");
const { default: handleZodError } = await import("../helpers/handleZodError");
const { default: catchAsync } = await import("../utils/catchAsync");
const { default: sendResponse } = await import("../utils/sendResponse");
const { default: setAuthCookie } = await import("../utils/setCookie");
const jwtModule = await import("../utils/jwt");
const userTokensModule = await import("../utils/userTokens");
const { default: logger } = await import("../utils/logger");
const notificationUtils = await import("../utils/notification.utils");
const { createUserAndWallet } = await import("../modules/user/user.helpers");
const authUtils = await import("../modules/auth/auth.utils");

const { generateToken, verifyToken } = jwtModule;
const { createUserTokens, createNewAccessToken } = userTokensModule;

// =========================================================================
// HELPERS
// =========================================================================

interface MockRes {
  status: (code: number) => MockRes;
  json: (body: unknown) => MockRes;
  cookie: (name: string, val: string, opts?: unknown) => MockRes;
}

function mockResponse() {
  const res = {} as MockRes;
  res.status = mock(() => res);
  res.json = mock(() => res);
  res.cookie = mock(() => res);
  return res;
}

function mockRequest(overrides: Record<string, unknown> = {}) {
  return { body: {}, params: {}, query: {}, ...overrides } as unknown;
}

// =========================================================================
// TESTS
// =========================================================================

// ─────────────────────────────────────────────────────────────────────────
// 1. AppError
// ─────────────────────────────────────────────────────────────────────────
describe("AppError", () => {
  test("creates an error with statusCode and message", () => {
    const err = new AppError(404, "Not found");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.stack).toBeDefined();
  });

  test("accepts a custom stack", () => {
    const err = new AppError(500, "Server error", "custom stack trace");
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("Server error");
    expect(err.stack).toBe("custom stack trace");
  });

  test("captures stack trace when no custom stack provided", () => {
    const err = new AppError(400, "Bad request");
    expect(err.stack).toBeDefined();
    expect(err.stack).not.toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. handleCastError
// ─────────────────────────────────────────────────────────────────────────
describe("handleCastError", () => {
  test("returns BAD_REQUEST with path from CastError", () => {
    const castError = new mongoose.Error.CastError("ObjectId", "abc", "userId");
    const result = handleCastError(castError);

    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(result.message).toContain("userId");
    expect(result.message).toContain("Invalid MongoDB objectID");
  });

  test("handles different path values", () => {
    const castError = new mongoose.Error.CastError("Number", "NaN", "amount");
    const result = handleCastError(castError);

    expect(result.message).toContain("amount");
    expect(result.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. handleDuplicateError
// ─────────────────────────────────────────────────────────────────────────
describe("handleDuplicateError", () => {
  test("extracts duplicate field from error message", () => {
    const err = new Error(
      'E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "test@test.com" }'
    );
    const result = handleDuplicateError(err);

    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(result.message).toBe("test@test.com already exists!!");
  });

  test("falls back for non-Error input", () => {
    const result = handleDuplicateError({ some: "object" });

    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(result.message).toBe("Duplicate value already exists");
  });

  test("falls back for error without quoted string", () => {
    const err = new Error("Duplicate key error");
    const result = handleDuplicateError(err);

    expect(result.message).toBe("Field already exists!!");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. handleValidationError
// ─────────────────────────────────────────────────────────────────────────
describe("handleValidationError", () => {
  test("returns validation error with error sources", () => {
    const validationError = new mongoose.Error.ValidationError();
    validationError.errors = {
      name: { path: "name", message: "Name is required", name: "ValidatorError" } as unknown as mongoose.Error.ValidatorError,
      email: { path: "email", message: "Invalid email", name: "ValidatorError" } as unknown as mongoose.Error.ValidatorError,
    };

    const result = handleValidationError(validationError);

    expect(result.statusCode).toBe(400);
    expect(result.message).toBe("Validation Error");
    expect(result.errorSources).toHaveLength(2);
    expect(result.errorSources).toEqual(
      expect.arrayContaining([
        { path: "name", message: "Name is required" },
        { path: "email", message: "Invalid email" },
      ])
    );
  });

  test("handles empty errors object", () => {
    const validationError = new mongoose.Error.ValidationError();
    validationError.errors = {};

    const result = handleValidationError(validationError);

    expect(result.statusCode).toBe(400);
    expect(result.errorSources).toHaveLength(0);
  });

  test("handles CastError entries within validation errors", () => {
    const validationError = new mongoose.Error.ValidationError();
    validationError.errors = {
      age: { path: "age", message: "Cast to Number failed", name: "CastError" } as unknown as mongoose.Error.ValidatorError,
    };

    const result = handleValidationError(validationError);

    expect(result.errorSources).toHaveLength(1);
    expect(result.errorSources[0]).toEqual({
      path: "age",
      message: "Cast to Number failed",
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. handleZodError
// ─────────────────────────────────────────────────────────────────────────
describe("handleZodError", () => {
  test("returns BAD_REQUEST with message 'Zod Error'", () => {
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
    });

    let zodError: z.ZodError;
    try {
      schema.parse({ name: "", email: "not-an-email" });
    } catch (e) {
      zodError = e as z.ZodError;
    }

    const result = handleZodError(zodError as z.ZodError);

    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(result.message).toBe("Zod Error");
  });

  test("does not throw for any ZodError", () => {
    const schema = z.object({ a: z.string() });
    let zodError: z.ZodError;
    try {
      schema.parse({ a: 123 });
    } catch (e) {
      zodError = e as z.ZodError;
    }

    expect(() => handleZodError(zodError as z.ZodError)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. catchAsync
// ─────────────────────────────────────────────────────────────────────────
describe("catchAsync", () => {
  test("calls the wrapped async function with req, res, next", async () => {
    const fn = mock(() => Promise.resolve());
    const wrapped = catchAsync(fn);
    const req = mockRequest();
    const res = mockResponse();
    const next = mock(() => undefined);

    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  test("forwards thrown error to next", async () => {
    const error = new Error("Something went wrong");
    const fn = mock(() => Promise.reject(error));
    const wrapped = catchAsync(fn);
    const next = mock(() => undefined);

    await wrapped(mockRequest(), mockResponse(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("forwards AppError to next", async () => {
    const appError = new AppError(403, "Forbidden");
    const fn = mock(() => Promise.reject(appError));
    const wrapped = catchAsync(fn);
    const next = mock(() => undefined);

    await wrapped(mockRequest(), mockResponse(), next);

    expect(next).toHaveBeenCalledWith(appError);
  });

  test("works with a resolved promise", async () => {
    const result: string[] = [];
    const fn = async () => {
      result.push("done");
    };
    const wrapped = catchAsync(fn);
    const next = mock(() => undefined);

    await wrapped(mockRequest(), mockResponse(), next);

    expect(result).toEqual(["done"]);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. sendResponse
// ─────────────────────────────────────────────────────────────────────────
describe("sendResponse", () => {
  test("sends status and json with correct data (no meta)", () => {
    const res = mockResponse();

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Created",
      data: { id: 1, name: "Test" },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 201,
      success: true,
      message: "Created",
      meta: undefined,
      data: { id: 1, name: "Test" },
    });
  });

  test("includes meta when provided", () => {
    const res = mockResponse();
    const meta = { page: 1, limit: 10, totalPage: 5, total: 50 };

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "List",
      data: [],
      meta,
    });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ meta })
    );
  });

  test("works with different status codes", () => {
    const res = mockResponse();

    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Bad Request",
      data: null,
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, success: false })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. setCookie
// ─────────────────────────────────────────────────────────────────────────
describe("setAuthCookie", () => {
  test("sets accessToken and refreshToken cookies", () => {
    const res = mockResponse();

    setAuthCookie(res, {
      accessToken: "access-token-value",
      refreshToken: "refresh-token-value",
    });

    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.cookie).toHaveBeenCalledWith(
      "accessToken",
      "access-token-value",
      expect.objectContaining({ httpOnly: true, path: "/" })
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token-value",
      expect.objectContaining({ httpOnly: true, path: "/" })
    );
  });

  test("refreshToken has longer maxAge than accessToken", () => {
    const res = mockResponse();

    setAuthCookie(res, {
      accessToken: "at",
      refreshToken: "rt",
    });

    const accessCall = res.cookie.mock.calls.find(
      ([name]: string[]) => name === "accessToken"
    );
    const refreshCall = res.cookie.mock.calls.find(
      ([name]: string[]) => name === "refreshToken"
    );

    expect(accessCall[2].maxAge).toBe(1000 * 60 * 60 * 24);       // 1 day
    expect(refreshCall[2].maxAge).toBe(1000 * 60 * 60 * 24 * 7);  // 7 days
  });

  test("skips setting cookie when token is undefined", () => {
    const res = mockResponse();

    setAuthCookie(res, {});

    expect(res.cookie).not.toHaveBeenCalled();
  });

  test("sets only accessToken when refreshToken is undefined", () => {
    const res = mockResponse();

    setAuthCookie(res, { accessToken: "at-only" });

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith("accessToken", "at-only", expect.any(Object));
  });

  test("sets only refreshToken when accessToken is undefined", () => {
    const res = mockResponse();

    setAuthCookie(res, { refreshToken: "rt-only" });

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith("refreshToken", "rt-only", expect.any(Object));
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 9. jwt (generateToken / verifyToken)
// ─────────────────────────────────────────────────────────────────────────
describe("jwt", () => {
  beforeEach(() => {
    mockSign.mockImplementation(() => "signed-jwt");
  });

  // --- generateToken ---
  describe("generateToken", () => {
    test("calls jwt.sign with payload, secret, and expiresIn", () => {
      const payload = { userId: "u1", role: "USER" };
      const token = generateToken(payload, "my-secret", "1h");

      expect(mockSign).toHaveBeenCalledWith(payload, "my-secret", { expiresIn: "1h" });
      expect(token).toBe("signed-jwt");
    });

    test("returns different token for different payloads", () => {
      mockSign.mockImplementationOnce(() => "token-a");
      mockSign.mockImplementationOnce(() => "token-b");

      const t1 = generateToken({ userId: "1" }, "secret", "1h");
      const t2 = generateToken({ userId: "2" }, "secret", "1h");

      expect(t1).toBe("token-a");
      expect(t2).toBe("token-b");
    });
  });

  // --- verifyToken ---
  describe("verifyToken", () => {
    beforeEach(() => {
      mockUserFindById.mockReset();
      mockUserFindById.mockImplementation(() => Promise.resolve(null));
      mockVerify.mockReset();
    });

    test("returns decoded token when tokenVersion is undefined", async () => {
      mockVerify.mockImplementation(() => ({
        userId: "u1",
        email: "a@b.com",
      }));

      const result = await verifyToken("some-token", "secret");

      expect(mockVerify).toHaveBeenCalledWith("some-token", "secret");
      expect(result).toEqual({ userId: "u1", email: "a@b.com" });
      expect(mockUserFindById).not.toHaveBeenCalled();
    });

    test("returns decoded token when user exists and tokenVersion matches", async () => {
      mockVerify.mockImplementation(() => ({
        userId: "u1",
        tokenVersion: 2,
      }));
      mockUserFindById.mockImplementation(() =>
        Promise.resolve({ tokenVersion: 2 })
      );

      const result = await verifyToken("valid-token", "secret");

      expect(result).toEqual({ userId: "u1", tokenVersion: 2 });
      expect(mockUserFindById).toHaveBeenCalledWith("u1");
    });

    test("throws AppError when user not found", async () => {
      mockVerify.mockImplementation(() => ({
        userId: "nonexistent",
        tokenVersion: 1,
      }));
      mockUserFindById.mockImplementation(() => Promise.resolve(null));

      expect(verifyToken("t", "s")).rejects.toThrow(AppError);
      expect(verifyToken("t", "s")).rejects.toHaveProperty("statusCode", 401);
      expect(verifyToken("t", "s")).rejects.toHaveProperty(
        "message",
        "User not found"
      );
    });

    test("throws AppError when tokenVersion mismatches", async () => {
      mockVerify.mockImplementation(() => ({
        userId: "u1",
        tokenVersion: 1,
      }));
      mockUserFindById.mockImplementation(() =>
        Promise.resolve({ tokenVersion: 2 })
      );

      expect(verifyToken("stale-token", "secret")).rejects.toThrow(AppError);
      expect(verifyToken("stale-token", "secret")).rejects.toHaveProperty(
        "statusCode",
        401
      );
      expect(verifyToken("stale-token", "secret")).rejects.toHaveProperty(
        "message",
        "Token has been invalidated"
      );
    });

    test("throws AppError when jwt.verify throws", async () => {
      mockVerify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      expect(verifyToken("expired", "secret")).rejects.toThrow(AppError);
      expect(verifyToken("expired", "secret")).rejects.toHaveProperty(
        "statusCode",
        401
      );
    });

    test("re-throws AppError from jwt.verify", async () => {
      const appError = new AppError(403, "Custom AppError");
      mockVerify.mockImplementation(() => {
        throw appError;
      });

      expect(verifyToken("bad", "secret")).rejects.toThrow(appError);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 10. userTokens (createUserTokens / createNewAccessToken)
// ─────────────────────────────────────────────────────────────────────────
describe("userTokens", () => {
  beforeEach(() => {
    mockSign.mockReset();
    mockSign.mockImplementation(() => "mocked-jwt");
    mockVerify.mockReset();
    mockUserFindById.mockReset();
    mockUserFindOne.mockReset();
  });

  // --- createUserTokens ---
  describe("createUserTokens", () => {
    test("generates access and refresh tokens from user data", () => {
      const user = {
        _id: "u1",
        email: "user@test.com",
        role: "USER",
        tokenVersion: 3,
      };

      const tokens = createUserTokens(user);

      expect(tokens).toHaveProperty("accessToken", "mocked-jwt");
      expect(tokens).toHaveProperty("refreshToken", "mocked-jwt");
      expect(mockSign).toHaveBeenCalledTimes(2);
    });

    test("calls generateToken with correct payload for both tokens", () => {
      const user = {
        _id: "u1",
        email: "a@b.com",
        role: "ADMIN",
        tokenVersion: 1,
      };

      createUserTokens(user);

      const expectedPayload = {
        userId: "u1",
        email: "a@b.com",
        role: "ADMIN",
        tokenVersion: 1,
      };

      // access token call
      expect(mockSign.mock.calls[0][0]).toEqual(expectedPayload);
      // refresh token call
      expect(mockSign.mock.calls[1][0]).toEqual(expectedPayload);
    });

    test("works with minimal user data", () => {
      const user = { _id: "u1", email: "x@y.z", role: "AGENT" };

      const tokens = createUserTokens(user);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });
  });

  // --- createNewAccessToken ---
  describe("createNewAccessToken", () => {
    const activeUser = {
      _id: "u1",
      email: "user@test.com",
      role: "USER",
      isActive: "ACTIVE",
      isDeleted: false,
      tokenVersion: 0,
    };

    beforeEach(() => {
      mockVerify.mockImplementation(() => ({
        userId: "u1",
        email: "user@test.com",
        tokenVersion: 1,
      }));
      mockUserFindById.mockImplementation(() =>
        Promise.resolve({ tokenVersion: 1 })
      );
      mockUserFindOne.mockImplementation(() => Promise.resolve(activeUser));
    });

    test("returns a new access token for valid refresh token", async () => {
      const token = await createNewAccessToken("valid-refresh-token");

      expect(token).toBe("mocked-jwt");
      expect(mockVerify).toHaveBeenCalledWith(
        "valid-refresh-token",
        expect.any(String)
      );
    });

    test("throws AppError when verifyToken fails", async () => {
      mockVerify.mockImplementation(() => {
        throw new Error("bad token");
      });

      expect(createNewAccessToken("bad-token")).rejects.toThrow(AppError);
      expect(createNewAccessToken("bad-token")).rejects.toHaveProperty(
        "statusCode",
        401
      );
    });

    test("throws AppError when decoded token has no email", async () => {
      mockVerify.mockImplementation(() => ({
        userId: "u1",
        tokenVersion: 1,
      }));

      expect(createNewAccessToken("no-email-token")).rejects.toThrow(AppError);
      expect(createNewAccessToken("no-email-token")).rejects.toHaveProperty(
        "statusCode",
        401
      );
    });

    test("throws AppError when user does not exist", async () => {
      mockUserFindOne.mockImplementation(() => Promise.resolve(null));

      expect(createNewAccessToken("t")).rejects.toThrow(AppError);
      expect(createNewAccessToken("t")).rejects.toHaveProperty(
        "statusCode",
        400
      );
    });

    test("throws AppError when user is BLOCKED", async () => {
      mockUserFindOne.mockImplementation(() =>
        Promise.resolve({ ...activeUser, isActive: "BLOCKED" })
      );

      expect(createNewAccessToken("t")).rejects.toThrow(AppError);
      expect(createNewAccessToken("t")).rejects.toHaveProperty(
        "message",
        "This account has been blocked."
      );
    });

    test("throws AppError when user is INACTIVE", async () => {
      mockUserFindOne.mockImplementation(() =>
        Promise.resolve({ ...activeUser, isActive: "INACTIVE" })
      );

      expect(createNewAccessToken("t")).rejects.toThrow(AppError);
      expect(createNewAccessToken("t")).rejects.toHaveProperty(
        "message",
        "This account has been inactive."
      );
    });

    test("throws AppError when user is deleted", async () => {
      mockUserFindOne.mockImplementation(() =>
        Promise.resolve({ ...activeUser, isDeleted: true })
      );

      expect(createNewAccessToken("t")).rejects.toThrow(AppError);
      expect(createNewAccessToken("t")).rejects.toHaveProperty(
        "message",
        "This account has been deleted."
      );
    });

    test("generates token with userId, email, role, tokenVersion", async () => {
      await createNewAccessToken("t");

      const lastPayload = mockSign.mock.calls[0][0];
      expect(lastPayload).toHaveProperty("userId", "u1");
      expect(lastPayload).toHaveProperty("email", "user@test.com");
      expect(lastPayload).toHaveProperty("role", "USER");
      expect(lastPayload).toHaveProperty("tokenVersion", 0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 11. logger
// ─────────────────────────────────────────────────────────────────────────
describe("logger", () => {
  test("info calls console.info when NODE_ENV is development", () => {
    const spy = spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("test info");
    expect(spy).toHaveBeenCalledWith("test info");
    spy.mockRestore();
  });

  test("error always calls console.error", () => {
    const spy = spyOn(console, "error").mockImplementation(() => undefined);
    logger.error("test error");
    expect(spy).toHaveBeenCalledWith("test error");
    spy.mockRestore();
  });

  test("warn always calls console.warn", () => {
    const spy = spyOn(console, "warn").mockImplementation(() => undefined);
    logger.warn("test warn");
    expect(spy).toHaveBeenCalledWith("test warn");
    spy.mockRestore();
  });

  test("log calls console.log when NODE_ENV is development", () => {
    const spy = spyOn(console, "log").mockImplementation(() => undefined);
    logger.log("test log");
    expect(spy).toHaveBeenCalledWith("test log");
    spy.mockRestore();
  });

  test("does not throw with multiple arguments", () => {
    const spy = spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => logger.info("a", "b", 123)).not.toThrow();
    expect(() => logger.error("err", new Error("e"))).not.toThrow();
    expect(() => logger.warn("warn")).not.toThrow();
    expect(() => logger.log("log", { key: "val" })).not.toThrow();
    spy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 12. notification.utils
// ─────────────────────────────────────────────────────────────────────────
describe("notification.utils", () => {
  const userData = {
    userId: "u1",
    email: "user@test.com",
    name: "John",
  };

  function testLogsContent(fn: () => void, ...contentChecks: string[]) {
    const spy = spyOn(console, "log").mockImplementation(() => undefined);
    fn();
    expect(spy).toHaveBeenCalled();
    for (const content of contentChecks) {
      const found = spy.mock.calls.some((args: unknown[]) =>
        args.some((a: string) => typeof a === "string" && a.includes(content))
      );
      expect(found).toBe(true);
    }
    spy.mockRestore();
  }

  test("notifyRegistration logs registration message", () => {
    testLogsContent(
      () => notificationUtils.notifyRegistration(userData),
      "REGISTRATION",
      "Welcome John"
    );
  });

  test("notifyTransaction logs transaction details", () => {
    testLogsContent(
      () =>
        notificationUtils.notifyTransaction({
          userId: "u1",
          email: "user@test.com",
          type: "SEND_MONEY",
          amount: 500,
          balance: 1500,
        }),
      "TRANSACTION",
      "SEND_MONEY",
      "৳500"
    );
  });

  test("notifyWalletBlocked logs blocked message", () => {
    testLogsContent(
      () => notificationUtils.notifyWalletBlocked(userData),
      "WALLET_BLOCKED"
    );
  });

  test("notifyWalletUnblocked logs unblocked message", () => {
    testLogsContent(
      () => notificationUtils.notifyWalletUnblocked(userData),
      "WALLET_UNBLOCKED"
    );
  });

  test("notifyAgentApproved logs approval with commission rate", () => {
    testLogsContent(
      () =>
        notificationUtils.notifyAgentApproved({
          ...userData,
          commissionRate: 0.05,
        }),
      "AGENT_APPROVED",
      "5%"
    );
  });

  test("notifyAgentSuspended logs suspension", () => {
    testLogsContent(
      () =>
        notificationUtils.notifyAgentSuspended({
          ...userData,
          commissionRate: 0.05,
        }),
      "AGENT_SUSPENDED"
    );
  });

  test("notifyPasswordReset logs reset message", () => {
    testLogsContent(
      () => notificationUtils.notifyPasswordReset(userData),
      "PASSWORD_RESET"
    );
  });

  test("all notification functions handle extra properties", () => {
    expect(() =>
      notificationUtils.notifyRegistration({ ...userData, extraField: "extra" })
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 13. user.helpers (createUserAndWallet)
// ─────────────────────────────────────────────────────────────────────────
describe("createUserAndWallet", () => {
  const mockSession = { id: "session-1" } as unknown;

  beforeEach(() => {
    mockUserCreate.mockReset();
    mockWalletCreate.mockReset();
  });

  test("creates user and wallet, links wallet to user", async () => {
    const createdUser = {
      _id: "new-user-id",
      wallet: undefined,
      save: mock(() => Promise.resolve()),
    };
    mockUserCreate.mockImplementation(() => Promise.resolve([createdUser]));
    mockWalletCreate.mockImplementation(() =>
      Promise.resolve([{ _id: "new-wallet-id" }])
    );

    const result = await createUserAndWallet(
      { name: "Test", email: "t@t.com", role: "USER" },
      mockSession
    );

    expect(mockUserCreate).toHaveBeenCalledWith(
      [{ name: "Test", email: "t@t.com", role: "USER" }],
      { session: mockSession }
    );
    expect(mockWalletCreate).toHaveBeenCalledWith(
      [{ owner: "new-user-id", balance: 50 }],
      { session: mockSession }
    );
    expect(createdUser.wallet).toBe("new-wallet-id");
    expect(createdUser.save).toHaveBeenCalledWith({ session: mockSession });
    expect(result).toBe(createdUser);
  });

  test("gives initial balance 50 for USER role", async () => {
    const createdUser = { _id: "u1", wallet: undefined, save: mock(() => undefined) };
    mockUserCreate.mockImplementation(() => Promise.resolve([createdUser]));
    mockWalletCreate.mockImplementation(() => Promise.resolve([{ _id: "w1" }]));

    await createUserAndWallet({ name: "A", email: "a@a.com", role: "USER" }, mockSession);

    expect(mockWalletCreate.mock.calls[0][0][0].balance).toBe(50);
  });

  test("gives initial balance 50 for AGENT role", async () => {
    const createdUser = { _id: "u2", wallet: undefined, save: mock(() => undefined) };
    mockUserCreate.mockImplementation(() => Promise.resolve([createdUser]));
    mockWalletCreate.mockImplementation(() => Promise.resolve([{ _id: "w1" }]));

    await createUserAndWallet({ name: "B", email: "b@b.com", role: "AGENT" }, mockSession);

    expect(mockWalletCreate.mock.calls[0][0][0].balance).toBe(50);
  });

  test("gives initial balance 0 for ADMIN role", async () => {
    const createdUser = { _id: "u3", wallet: undefined, save: mock(() => undefined) };
    mockUserCreate.mockImplementation(() => Promise.resolve([createdUser]));
    mockWalletCreate.mockImplementation(() => Promise.resolve([{ _id: "w1" }]));

    await createUserAndWallet({ name: "C", email: "c@c.com", role: "ADMIN" }, mockSession);

    expect(mockWalletCreate.mock.calls[0][0][0].balance).toBe(0);
  });

  test("gives initial balance 0 for SUPER_ADMIN role", async () => {
    const createdUser = { _id: "u4", wallet: undefined, save: mock(() => undefined) };
    mockUserCreate.mockImplementation(() => Promise.resolve([createdUser]));
    mockWalletCreate.mockImplementation(() => Promise.resolve([{ _id: "w1" }]));

    await createUserAndWallet({ name: "D", email: "d@d.com", role: "SUPER_ADMIN" }, mockSession);

    expect(mockWalletCreate.mock.calls[0][0][0].balance).toBe(0);
  });

  test("throws AppError when user creation returns empty array", async () => {
    mockUserCreate.mockImplementation(() => Promise.resolve([]));

    expect(
      createUserAndWallet({ name: "X", email: "x@x.com", role: "USER" }, mockSession)
    ).rejects.toThrow(AppError);
    expect(
      createUserAndWallet({ name: "X", email: "x@x.com", role: "USER" }, mockSession)
    ).rejects.toHaveProperty("statusCode", 500);
  });

  test("throws AppError when wallet creation returns empty array", async () => {
    const createdUser = { _id: "u1", wallet: undefined, save: mock(() => undefined) };
    mockUserCreate.mockImplementation(() => Promise.resolve([createdUser]));
    mockWalletCreate.mockImplementation(() => Promise.resolve([]));

    expect(
      createUserAndWallet({ name: "Y", email: "y@y.com", role: "USER" }, mockSession)
    ).rejects.toThrow(AppError);
    expect(
      createUserAndWallet({ name: "Y", email: "y@y.com", role: "USER" }, mockSession)
    ).rejects.toHaveProperty("statusCode", 500);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 14. auth.utils
// ─────────────────────────────────────────────────────────────────────────
describe("auth.utils", () => {
  describe("generateToken (crypto)", () => {
    test("returns a 64-character hex string", () => {
      const token = authUtils.generateToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    test("generates unique tokens on each call", () => {
      const t1 = authUtils.generateToken();
      const t2 = authUtils.generateToken();
      expect(t1).not.toBe(t2);
    });
  });

  describe("sendMockEmail", () => {
    test("logs email details", () => {
      const spy = spyOn(console, "log").mockImplementation(() => undefined);
      authUtils.sendMockEmail("user@test.com", "Welcome", "Hello!");

      expect(spy).toHaveBeenCalled();
      const allArgs = spy.mock.calls.flat().map(String);
      expect(allArgs.some((a) => a.includes("MOCK EMAIL"))).toBe(true);
      expect(allArgs.some((a) => a.includes("user@test.com"))).toBe(true);
      expect(allArgs.some((a) => a.includes("Welcome"))).toBe(true);
      expect(allArgs.some((a) => a.includes("Hello!"))).toBe(true);
      spy.mockRestore();
    });

    test("does not throw", () => {
      expect(() =>
        authUtils.sendMockEmail("a@b.com", "Sub", "Body text")
      ).not.toThrow();
    });
  });
});
