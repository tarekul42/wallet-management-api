import { describe, expect, test, mock, beforeEach } from "bun:test";
import mongoose from "mongoose";
import { z, ZodError } from "zod";
import httpStatus from "http-status-codes";

const envMock: Record<string, string> = {
  NODE_ENV: "development",
  JWT_ACCESS_SECRET: "test-secret",
  CORS_ORIGIN: "http://localhost:3000",
  PORT: "5000",
  DB_URL: "mongodb://localhost:27017/test",
  COOKIE_DOMAIN: "localhost",
  JWT_ACCESS_EXPIRES: "15m",
  JWT_REFRESH_SECRET: "test-refresh-secret",
  JWT_REFRESH_EXPIRES: "30d",
  BCRYPT_SALT_ROUND: "10",
  SUPER_ADMIN_EMAIL: "admin@test.com",
  SUPER_ADMIN_PASSWORD: "Admin123!",
  CLIENT_URL: "http://localhost:3000",
  EXPRESS_SESSION_SECRET: "test-session-secret",
};
const mockVerifyToken = mock<(...args: unknown[]) => unknown>();
const mockUserFindById = mock<(...args: unknown[]) => unknown>();

mock.module("../config/env", () => ({ envVars: envMock }));
mock.module("../utils/logger", () => ({
  default: { log: mock(), info: mock(), error: mock(), warn: mock() },
}));
mock.module("../utils/jwt", () => ({ verifyToken: mockVerifyToken }));
mock.module("../modules/user/user.model", () => ({
  User: { findById: mockUserFindById },
}));

import globalErrorHandler from "../middlewares/globalErrorHandler";
import notFound from "../middlewares/notFound";
import { validateRequest } from "../middlewares/validateRequest";
import checkAuth from "../middlewares/checkAuth";
import AppError from "../errorHelpers/AppError";

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mockReqRes() {
  const req = {} as any;
  const res = { status: mock(() => res), json: mock() } as any;
  const next = mock();
  return { req, res, next };
}

const validUser = {
  _id: "user123",
  isDeleted: false,
  isActive: "ACTIVE",
  isVerified: true,
  role: "USER",
};

// ─── globalErrorHandler ─────────────────────────────────────────────────────

describe("globalErrorHandler", () => {
  beforeEach(() => {
    envMock.NODE_ENV = "development";
  });

  test("catches AppError and sends correct status/message", () => {
    const { req, res, next } = mockReqRes();
    globalErrorHandler(new AppError(403, "Forbidden"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Forbidden" }),
    );
  });

  test("catches mongoose ValidationError", () => {
    const { req, res, next } = mockReqRes();
    const err = new mongoose.Error.ValidationError();
    err.errors = { email: { path: "email", message: "Invalid email" } as any };
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Validation Error" }),
    );
  });

  test("includes errorSources for ValidationError", () => {
    const { req, res, next } = mockReqRes();
    const err = new mongoose.Error.ValidationError();
    err.errors = { name: { path: "name", message: "Path `name` is required." } as any };
    globalErrorHandler(err, req, res, next);
    const body = (res.json as ReturnType<typeof mock>).mock.calls[0][0];
    expect(body.errorSources).toBeDefined();
    expect(body.errorSources).toHaveLength(1);
    expect(body.errorSources[0]).toEqual({
      path: "name",
      message: "Path `name` is required.",
    });
  });

  test("catches duplicate key error (code 11000)", () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "test@test.com" }');
    (err as any).code = 11000;
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("already exists") }),
    );
  });

  test("catches mongoose CastError", () => {
    const { req, res, next } = mockReqRes();
    globalErrorHandler(
      new mongoose.Error.CastError("ObjectId", "invalid-id", "_id"),
      req,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Invalid") }),
    );
  });

  test("catches ZodError", () => {
    const { req, res, next } = mockReqRes();
    let zodErr: unknown;
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
    } catch (e) {
      zodErr = e;
    }
    globalErrorHandler(zodErr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Zod Error" }),
    );
  });

  test("includes errorSources array for ZodError", () => {
    const { req, res, next } = mockReqRes();
    let zodErr: unknown;
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
    } catch (e) {
      zodErr = e;
    }
    globalErrorHandler(zodErr, req, res, next);
    const body = (res.json as ReturnType<typeof mock>).mock.calls[0][0];
    expect(body.errorSources).toBeDefined();
    expect(body.errorSources[0].path).toBe("name");
  });

  test("catches generic Error with 500 status and error message in development", () => {
    const { req, res, next } = mockReqRes();
    globalErrorHandler(new Error("Something broke"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Something broke" }),
    );
  });

  test("shows err and stack in development mode", () => {
    const { req, res, next } = mockReqRes();
    globalErrorHandler(new Error("visible error"), req, res, next);
    const body = (res.json as ReturnType<typeof mock>).mock.calls[0][0];
    expect(body.err).toBeTruthy();
    expect(body.stack).toBeTruthy();
    expect(body.message).toBe("visible error");
  });

  test("hides err and stack in production mode", () => {
    envMock.NODE_ENV = "production";
    const { req, res, next } = mockReqRes();
    globalErrorHandler(new Error("secret details"), req, res, next);
    const body = (res.json as ReturnType<typeof mock>).mock.calls[0][0];
    expect(body.err).toBeNull();
    expect(body.stack).toBeNull();
    expect(body.message).toBe("Something went wrong");
    envMock.NODE_ENV = "development";
  });
});

// ─── notFound ───────────────────────────────────────────────────────────────

describe("notFound", () => {
  test("returns 404 with route not found message", () => {
    const req = { originalUrl: "/api/unknown/route" } as any;
    const res = { status: mock(() => res), json: mock() } as any;
    notFound(req, res);
    expect(res.status).toHaveBeenCalledWith(httpStatus.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Route Not Found: /api/unknown/route",
    });
  });

  test("response has correct format", () => {
    const req = { originalUrl: "/test" } as any;
    const res = { status: mock(() => res), json: mock() } as any;
    notFound(req, res);
    const body = (res.json as ReturnType<typeof mock>).mock.calls[0][0];
    expect(body).toHaveProperty("success", false);
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });
});

// ─── validateRequest ────────────────────────────────────────────────────────

describe("validateRequest", () => {
  const schema = z.object({ name: z.string(), age: z.number().optional() });

  test("calls next() when validation passes", async () => {
    const req = { body: { name: "Alice", age: 30 } } as any;
    const next = mock();
    await validateRequest(schema)(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: "Alice", age: 30 });
  });

  test("parses req.body.data string then validates", async () => {
    const req = { body: { data: JSON.stringify({ name: "Bob", age: 25 }) } } as any;
    const next = mock();
    await validateRequest(schema)(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: "Bob", age: 25 });
  });

  test("calls next(error) when validation fails with ZodError", async () => {
    const req = { body: { name: 123, age: "invalid" } } as any;
    const next = mock();
    await validateRequest(schema)(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
  });

  test("calls next(error) when parsed body.data fails validation", async () => {
    const req = { body: { data: JSON.stringify({ name: 999 }) } } as any;
    const next = mock();
    await validateRequest(schema)(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
  });

  test("replaces req.body with parsed data when body.data is a string", async () => {
    const req = { body: { data: JSON.stringify({ name: "Carol" }) } } as any;
    const next = mock();
    await validateRequest(schema)(req, {} as any, next);
    expect(req.body.name).toBe("Carol");
    expect(req.body).not.toHaveProperty("data");
  });

  test("handles empty body gracefully", async () => {
    const req = { body: {} } as any;
    const next = mock();
    await validateRequest(schema)(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
  });
});

// ─── checkAuth ──────────────────────────────────────────────────────────────

describe("checkAuth", () => {
  beforeEach(() => {
    mockVerifyToken.mockReset();
    mockUserFindById.mockReset();
  });

  test("passes with valid token and sets req.user", async () => {
    const tokenPayload = { userId: "user123", role: "USER", iat: 1, exp: 999 };
    mockVerifyToken.mockResolvedValue(tokenPayload);
    mockUserFindById.mockResolvedValue(validUser);

    const req = { headers: { authorization: "Bearer valid-token" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(tokenPayload);
  });

  test("throws 401 when authorization header is missing", async () => {
    const req = { headers: {}, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect((next.mock.calls[0][0] as AppError).message).toMatch(/missing/i);
  });

  test("throws 401 when authorization header does not start with Bearer", async () => {
    const req = { headers: { authorization: "Basic dGVzdDp0ZXN0" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.UNAUTHORIZED);
  });

  test("throws 401 when token part is empty after Bearer", async () => {
    const req = { headers: { authorization: "Bearer " }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect((next.mock.calls[0][0] as AppError).message).toMatch(/not found/i);
  });

  test("throws 401 when verifyToken returns null (no userId)", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const req = { headers: { authorization: "Bearer invalid-token" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect((next.mock.calls[0][0] as AppError).message).toMatch(/invalid/i);
  });

  test("throws 401 when verifyToken returns object without userId", async () => {
    mockVerifyToken.mockResolvedValue({ some: "data" });
    const req = { headers: { authorization: "Bearer weird-token" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.UNAUTHORIZED);
  });

  test("throws 401 when user is not found in database", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "nonexistent" });
    mockUserFindById.mockResolvedValue(null);
    const req = { headers: { authorization: "Bearer token" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect((next.mock.calls[0][0] as AppError).message).toMatch(/not found/i);
  });

  test("throws 401 when user account is deleted", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "user123" });
    mockUserFindById.mockResolvedValue({ ...validUser, isDeleted: true });
    const req = { headers: { authorization: "Bearer token" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect((next.mock.calls[0][0] as AppError).message).toMatch(/deleted/i);
  });

  test("throws 403 when user account is blocked", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "user123" });
    mockUserFindById.mockResolvedValue({ ...validUser, isActive: "BLOCKED" });
    const req = { headers: { authorization: "Bearer token" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.FORBIDDEN);
    expect((next.mock.calls[0][0] as AppError).message).toMatch(/blocked/i);
  });

  test("throws 401 when user account is not verified", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "user123" });
    mockUserFindById.mockResolvedValue({ ...validUser, isVerified: false });
    const req = { headers: { authorization: "Bearer token" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect((next.mock.calls[0][0] as AppError).message).toMatch(/verified/i);
  });

  test("throws 403 when user role is insufficient for required roles", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "user123" });
    mockUserFindById.mockResolvedValue(validUser);
    const req = { headers: { authorization: "Bearer token" }, user: {} } as any;
    const next = mock();
    checkAuth("ADMIN")(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(httpStatus.FORBIDDEN);
    expect((next.mock.calls[0][0] as AppError).message).toMatch(/not allowed/i);
  });

  test("passes when user has sufficient role", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "admin123" });
    mockUserFindById.mockResolvedValue({ ...validUser, role: "ADMIN" });
    const req = { headers: { authorization: "Bearer admin-token" }, user: {} } as any;
    const next = mock();
    checkAuth("ADMIN")(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  test("passes with no role restrictions (empty authRoles)", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "user123" });
    mockUserFindById.mockResolvedValue(validUser);
    const req = { headers: { authorization: "Bearer any-role" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(next).toHaveBeenCalledWith();
  });

  test("calls User.findById with the userId from token", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "user123" });
    mockUserFindById.mockResolvedValue(validUser);
    const req = { headers: { authorization: "Bearer token" }, user: {} } as any;
    const next = mock();
    checkAuth()(req, {} as any, next);
    await flush();

    expect(mockUserFindById).toHaveBeenCalledWith("user123");
  });
});
