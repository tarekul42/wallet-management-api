import { describe, expect, test, mock, spyOn, beforeEach, afterEach } from "bun:test";
import mongoose from "mongoose";
import crypto from "crypto";

// =========================================================================
// MOCKS - must be registered before dynamic imports of modules under test
// =========================================================================

// ----- jwt utils (used by userTokens.ts and auth.service.ts directly) -----
const mockGenerateToken = mock(() => "mocked-jwt-token");
const mockVerifyToken = mock(() =>
  Promise.resolve({
    userId: "user123",
    email: "test@example.com",
    role: "USER",
    tokenVersion: 1,
  })
);

mock.module("../utils/jwt", () => ({
  generateToken: mockGenerateToken,
  verifyToken: mockVerifyToken,
}));

// ----- userTokens (used by auth.service.ts) -----
const mockCreateUserTokens = mock(() => ({
  accessToken: "mocked-access-from-mock",
  refreshToken: "mocked-refresh-from-mock",
}));
const mockCreateNewAccessToken = mock(() => Promise.resolve("mocked-new-access-token"));

mock.module("../utils/userTokens", () => ({
  createUserTokens: mockCreateUserTokens,
  createNewAccessToken: mockCreateNewAccessToken,
}));

// ----- User model -----
const mockUserFindById = mock(() => Promise.resolve(null));
const mockUserFindOne = mock(() => Promise.resolve(null));
const mockUserFindByIdAndUpdate = mock(() => Promise.resolve(null));
const mockUserCreate = mock(() => Promise.resolve([]));

mock.module("../modules/user/user.model", () => ({
  User: {
    findById: mockUserFindById,
    findOne: mockUserFindOne,
    findByIdAndUpdate: mockUserFindByIdAndUpdate,
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

// ----- env config -----
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
    DEMO_USER_EMAIL: "demo@test.com",
    DEMO_USER_PASSWORD: "Demo123!",
    DEMO_AGENT_EMAIL: "agent@test.com",
    DEMO_AGENT_PASSWORD: "Agent123!",
    DEMO_ADMIN_EMAIL: "admin@test.com",
    DEMO_ADMIN_PASSWORD: "Admin123!",
  },
}));

// ----- notification utils -----
const mockNotifyRegistration = mock(() => undefined);
mock.module("../utils/notification.utils", () => ({
  notifyRegistration: mockNotifyRegistration,
  notifyTransaction: mock(() => undefined),
  notifyWalletBlocked: mock(() => undefined),
  notifyWalletUnblocked: mock(() => undefined),
  notifyAgentApproved: mock(() => undefined),
  notifyAgentSuspended: mock(() => undefined),
  notifyPasswordReset: mock(() => undefined),
}));

// ----- auth utils (generateToken / sendMockEmail) -----
const mockSendEmail = mock(() => undefined);
mock.module("../modules/auth/auth.utils", () => ({
  generateToken: () => crypto.randomBytes(32).toString("hex"),
  sendMockEmail: mockSendEmail,
}));

// =========================================================================
// DYNAMIC IMPORTS - modules under test
// =========================================================================

const { default: AppError } = await import("../errorHelpers/AppError");
const { AuthServices } = await import("../modules/auth/auth.service");
const authService = AuthServices;

// =========================================================================
// HELPERS
// =========================================================================

/** Build a fake user document shaped like what createUserAndWallet returns.
 *  `toObject()` skips password just like mongoose does with `select: false`.
 */
function fakeUserDoc(overrides: Record<string, unknown> = {}) {
  const doc: Record<string, unknown> = {
    _id: "user-abc-123",
    name: "John Doe",
    email: "john@example.com",
    password: "hashed-password",
    phone: "+8801712345678",
    address: "Dhaka, Bangladesh",
    nid: "1234567890",
    role: "USER",
    isDeleted: false,
    isActive: "ACTIVE",
    isVerified: false,
    wallet: "wallet-abc-123",
    commissionRate: null,
    approvalStatus: null,
    tokenVersion: 0,
    verificationToken: "some-verification-token",
    resetPasswordToken: undefined,
    dailyTransactionTotal: 0,
    monthlyTransactionTotal: 0,
    lastDailyReset: new Date(),
    lastMonthlyReset: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    save: mock(() => Promise.resolve()),
    ...overrides,
  };

  doc.toObject = function () {
    const { password, ...noPassword } = doc;
    void password;
    return noPassword;
  };

  return doc;
}

interface MockSession {
  startTransaction: ReturnType<typeof mock>;
  commitTransaction: ReturnType<typeof mock>;
  abortTransaction: ReturnType<typeof mock>;
  endSession: ReturnType<typeof mock>;
}

const mockSession: MockSession = {
  startTransaction: mock(() => undefined),
  commitTransaction: mock(() => Promise.resolve()),
  abortTransaction: mock(() => Promise.resolve()),
  endSession: mock(() => undefined),
};

// =========================================================================
// TESTS
// =========================================================================

// ─────────────────────────────────────────────────────────────────────────
// 1. getNewAccessToken
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices.getNewAccessToken", () => {
  beforeEach(() => {
    mockCreateNewAccessToken.mockReset();
    mockVerifyToken.mockReset();
    mockVerifyToken.mockImplementation(() =>
      Promise.resolve({ userId: "user123", email: "test@example.com", role: "USER", tokenVersion: 1 })
    );
  });

  test("returns a new access token for a valid refresh token", async () => {
    mockCreateNewAccessToken.mockImplementation(() => Promise.resolve("new-access-token"));

    const result = await authService.getNewAccessToken("valid-refresh-token");

    expect(result).toEqual({ accessToken: "new-access-token" });
    expect(mockCreateNewAccessToken).toHaveBeenCalledWith("valid-refresh-token");
  });

  test("propagates error when createNewAccessToken throws", async () => {
    mockCreateNewAccessToken.mockImplementation(() =>
      Promise.reject(new AppError(401, "Invalid or expired refresh token"))
    );

    expect(authService.getNewAccessToken("bad-token")).rejects.toThrow(AppError);
    expect(authService.getNewAccessToken("bad-token")).rejects.toHaveProperty("statusCode", 401);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. registerUser
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices.registerUser", () => {
  const validPayload = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "SecurePass123!",
    phone: "+8801987654321",
    address: "Chittagong, Bangladesh",
    nid: "9876543210",
    role: "USER",
  };

  let createdUser: Record<string, unknown>;
  let sessionSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    createdUser = fakeUserDoc({
      _id: "new-user-id",
      email: "jane@example.com",
      name: "Jane Doe",
      role: "USER",
    });
    mockUserFindOne.mockReset();
    mockUserFindOne.mockImplementation(() => Promise.resolve(null));
    mockUserCreate.mockReset();
    mockUserCreate.mockImplementation(() => Promise.resolve([createdUser]));
    mockWalletCreate.mockReset();
    mockWalletCreate.mockImplementation(() => Promise.resolve([{ _id: "wallet-id" }]));
    mockSendEmail.mockReset();
    mockNotifyRegistration.mockReset();

    sessionSpy = spyOn(mongoose, "startSession").mockImplementation(() =>
      Promise.resolve(mockSession as unknown as mongoose.ClientSession)
    );
  });

  afterEach(() => {
    sessionSpy?.mockRestore();
  });

  test("throws AppError(400) when email is an empty string", async () => {
    const payload = { ...validPayload, email: "" };

    expect(authService.registerUser(payload)).rejects.toThrow(AppError);
    expect(authService.registerUser(payload)).rejects.toHaveProperty("statusCode", 400);
    expect(authService.registerUser(payload)).rejects.toHaveProperty(
      "message",
      "A valid email address must be provided."
    );
  });

  test("throws AppError(400) when email is not a string", async () => {
    const payload = { ...validPayload, email: 123 as unknown as string };

    expect(authService.registerUser(payload)).rejects.toThrow(AppError);
    expect(authService.registerUser(payload)).rejects.toHaveProperty("statusCode", 400);
  });

  test("throws AppError(400) when user already exists", async () => {
    mockUserFindOne.mockImplementation(() => Promise.resolve(fakeUserDoc()));

    expect(authService.registerUser(validPayload)).rejects.toThrow(AppError);
    expect(authService.registerUser(validPayload)).rejects.toHaveProperty("statusCode", 400);
    expect(authService.registerUser(validPayload)).rejects.toHaveProperty(
      "message",
      "User already exists with this email."
    );
  });

  test("throws AppError(400) when role is SUPER_ADMIN", async () => {
    const payload = { ...validPayload, role: "SUPER_ADMIN" };

    expect(authService.registerUser(payload)).rejects.toThrow(AppError);
    expect(authService.registerUser(payload)).rejects.toHaveProperty("statusCode", 400);
    expect(authService.registerUser(payload)).rejects.toHaveProperty(
      "message",
      "Registration is only available for users and agents."
    );
  });

  test("throws AppError(400) when role is ADMIN", async () => {
    const payload = { ...validPayload, role: "ADMIN" };

    expect(authService.registerUser(payload)).rejects.toThrow(AppError);
    expect(authService.registerUser(payload)).rejects.toHaveProperty(
      "message",
      "Registration is only available for users and agents."
    );
  });

  test("creates a USER successfully and returns user data (without password)", async () => {
    const result = await authService.registerUser(validPayload);

    expect(result).toBeDefined();
    expect(result.email).toBe("jane@example.com");
    expect(result.name).toBe("Jane Doe");
    expect(result.role).toBe("USER");
    expect(result).not.toHaveProperty("password");

    expect(mockUserCreate).toHaveBeenCalled();
    expect(mockWalletCreate).toHaveBeenCalled();
    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  test("creates an AGENT with PENDING approval and null commissionRate", async () => {
    const agentPayload = { ...validPayload, role: "AGENT" };
    const agentUserDoc = fakeUserDoc({
      _id: "agent-id",
      email: "agent@example.com",
      role: "AGENT",
      approvalStatus: "PENDING",
      commissionRate: null,
    });
    mockUserCreate.mockImplementation(() => Promise.resolve([agentUserDoc]));

    await authService.registerUser(agentPayload);

    const passedData = mockUserCreate.mock.calls[0][0][0];
    expect(passedData.role).toBe("AGENT");
    expect(passedData.approvalStatus).toBe("PENDING");
    expect(passedData.commissionRate).toBeNull();
  });

  test("calls sendMockEmail on successful registration", async () => {
    await authService.registerUser(validPayload);

    expect(mockSendEmail).toHaveBeenCalledWith(
      "jane@example.com",
      "Verify Your Email",
      expect.stringContaining("verification token")
    );
  });

  test("calls notifyRegistration on successful registration", async () => {
    await authService.registerUser(validPayload);

    expect(mockNotifyRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "new-user-id",
        email: "jane@example.com",
        name: "Jane Doe",
      })
    );
  });

  test("aborts transaction and throws AppError(500) when createUserAndWallet fails", async () => {
    mockUserCreate.mockImplementation(() => Promise.resolve([]));

    expect(authService.registerUser(validPayload)).rejects.toThrow(AppError);
    expect(authService.registerUser(validPayload)).rejects.toHaveProperty("statusCode", 500);
    expect(authService.registerUser(validPayload)).rejects.toHaveProperty(
      "message",
      expect.stringContaining("User creation failed")
    );
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  test("aborts transaction when wallet creation fails", async () => {
    const user = { _id: "id", wallet: undefined, save: mock(() => undefined) };
    mockUserCreate.mockImplementation(() => Promise.resolve([user]));
    mockWalletCreate.mockImplementation(() => Promise.resolve([]));

    expect(authService.registerUser(validPayload)).rejects.toThrow(AppError);
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  test("sanitizes payload to prevent mass assignment", async () => {
    const payloadWithExtra = {
      ...validPayload,
      isAdmin: true,
      someRandomField: "injected",
    };

    await authService.registerUser(payloadWithExtra);

    const passedData = mockUserCreate.mock.calls[0][0][0];
    const allowedFields = [
      "name", "email", "password", "phone", "address", "nid", "role", "verificationToken",
    ];
    for (const field of allowedFields) {
      expect(passedData).toHaveProperty(field);
    }
    expect(passedData).not.toHaveProperty("isAdmin");
    expect(passedData).not.toHaveProperty("someRandomField");
    expect(passedData).not.toHaveProperty("isDeleted");
    expect(passedData).not.toHaveProperty("isVerified");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. credentialsLogin
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices.credentialsLogin", () => {
  beforeEach(() => {
    mockCreateUserTokens.mockReset();
    mockCreateUserTokens.mockImplementation(() => ({
      accessToken: "test-access",
      refreshToken: "test-refresh",
    }));
  });

  const buildUserDoc = () => {
    const user = {
      _id: "user-id-456",
      name: "John Smith",
      email: "john@example.com",
      password: "supersecret",
      phone: "+8801700000000",
      role: "USER",
      isActive: "ACTIVE",
      isVerified: true,
      tokenVersion: 2,
      wallet: "wallet-456",
      toObject: function () {
        const { password, ...rest } = this;
        void password;
        return rest;
      },
    };
    return user as unknown as Record<string, unknown>;
  };

  test("returns sanitized user without password plus tokens", async () => {
    const user = buildUserDoc();
    const result = await authService.credentialsLogin(user);

    expect(result.user).toBeDefined();
    expect(result.user).not.toHaveProperty("password");
    expect(result.user.email).toBe("john@example.com");
    expect(result.user.role).toBe("USER");
    expect(result).toHaveProperty("accessToken", "test-access");
    expect(result).toHaveProperty("refreshToken", "test-refresh");
  });

  test("calls createUserTokens with the provided user", async () => {
    const user = buildUserDoc();
    await authService.credentialsLogin(user);

    expect(mockCreateUserTokens).toHaveBeenCalledWith(user);
  });

  test("user object preserves all fields except password", async () => {
    const user = buildUserDoc();
    const result = await authService.credentialsLogin(user);

    expect(result.user.name).toBe("John Smith");
    expect(result.user.email).toBe("john@example.com");
    expect(result.user.phone).toBe("+8801700000000");
    expect(result.user.role).toBe("USER");
    expect(result.user.isActive).toBe("ACTIVE");
    expect(result.user.isVerified).toBe(true);
    expect(result.user.tokenVersion).toBe(2);
    expect(result.user.wallet).toBe("wallet-456");
  });

  test("tokens from createUserTokens are spread into result", async () => {
    const user = buildUserDoc();
    const result = await authService.credentialsLogin(user);

    expect(result.accessToken).toBe("test-access");
    expect(result.refreshToken).toBe("test-refresh");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. logoutUser
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices.logoutUser", () => {
  beforeEach(() => {
    mockVerifyToken.mockReset();
    mockUserFindByIdAndUpdate.mockReset();
    mockUserFindById.mockReset();
  });

  test("increments tokenVersion on valid token and returns success", async () => {
    mockVerifyToken.mockImplementation(() =>
      Promise.resolve({ userId: "user-123", tokenVersion: 1 })
    );
    mockUserFindByIdAndUpdate.mockImplementation(() =>
      Promise.resolve({ tokenVersion: 2 })
    );

    const result = await authService.logoutUser("valid-refresh-token");

    expect(result).toEqual({ message: "Logged out successfully." });
    expect(mockVerifyToken).toHaveBeenCalledWith("valid-refresh-token", expect.any(String));
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith("user-123", {
      $inc: { tokenVersion: 1 },
    });
  });

  test("returns success even when verifyToken throws (swallows error)", async () => {
    mockVerifyToken.mockImplementation(() =>
      Promise.reject(new Error("invalid token"))
    );

    const result = await authService.logoutUser("bad-token");

    expect(result).toEqual({ message: "Logged out successfully." });
    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("returns success when token is malformed", async () => {
    mockVerifyToken.mockImplementation(() =>
      Promise.reject(new TypeError("Cannot read properties of undefined"))
    );

    const result = await authService.logoutUser("gibberish");

    expect(result).toEqual({ message: "Logged out successfully." });
  });

  test("returns success when findByIdAndUpdate throws (swallows error)", async () => {
    mockVerifyToken.mockImplementation(() =>
      Promise.resolve({ userId: "user-123", tokenVersion: 1 })
    );
    mockUserFindByIdAndUpdate.mockImplementation(() =>
      Promise.reject(new Error("DB error"))
    );

    const result = await authService.logoutUser("token");

    expect(result).toEqual({ message: "Logged out successfully." });
  });

  test("does not throw any error under any circumstance", async () => {
    mockVerifyToken.mockImplementation(() =>
      Promise.reject(new Error("any error"))
    );

    await expect(authService.logoutUser("anything")).resolves.toEqual({
      message: "Logged out successfully.",
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. verifyEmail
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices.verifyEmail", () => {
  const validToken = "valid-verification-token-hex";

  beforeEach(() => {
    mockUserFindOne.mockReset();
  });

  test("throws AppError(400) when token is not a string", async () => {
    expect(authService.verifyEmail(123 as unknown as string)).rejects.toThrow(AppError);
    expect(authService.verifyEmail(123 as unknown as string)).rejects.toHaveProperty("statusCode", 400);
    expect(authService.verifyEmail(123 as unknown as string)).rejects.toHaveProperty(
      "message",
      "Invalid verification token"
    );
  });

  test("throws AppError(400) when token is an object", async () => {
    expect(authService.verifyEmail({} as unknown as string)).rejects.toThrow(AppError);
    expect(authService.verifyEmail({} as unknown as string)).rejects.toHaveProperty("statusCode", 400);
  });

  test("throws AppError(400) when user is not found with that token", async () => {
    mockUserFindOne.mockImplementation(() => Promise.resolve(null));

    expect(authService.verifyEmail(validToken)).rejects.toThrow(AppError);
    expect(authService.verifyEmail(validToken)).rejects.toHaveProperty("statusCode", 400);
    expect(authService.verifyEmail(validToken)).rejects.toHaveProperty(
      "message",
      "Invalid verification token"
    );
  });

  test("sets isVerified to true and clears verificationToken on success", async () => {
    const user = fakeUserDoc({ isVerified: false, verificationToken: validToken });
    mockUserFindOne.mockImplementation(() => Promise.resolve(user));

    const result = await authService.verifyEmail(validToken);

    expect(result).toEqual({ message: "Email verified successfully" });
    expect(user.isVerified).toBe(true);
    expect(user.verificationToken).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
  });

  test("uses $eq operator to prevent NoSQL injection", async () => {
    mockUserFindOne.mockImplementation(() => Promise.resolve(null));

    await authService.verifyEmail(validToken).catch(() => undefined);

    expect(mockUserFindOne).toHaveBeenCalledWith({
      verificationToken: { $eq: validToken },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. forgotPassword
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices.forgotPassword", () => {
  const validEmail = "user@example.com";

  beforeEach(() => {
    mockUserFindOne.mockReset();
    mockSendEmail.mockReset();
  });

  test("throws AppError(400) when email is not a string", async () => {
    expect(authService.forgotPassword(123 as unknown as string)).rejects.toThrow(AppError);
    expect(authService.forgotPassword(123 as unknown as string)).rejects.toHaveProperty("statusCode", 400);
    expect(authService.forgotPassword(123 as unknown as string)).rejects.toHaveProperty("message", "Invalid email");
  });

  test("throws AppError(400) when email is an object", async () => {
    expect(authService.forgotPassword({} as unknown as string)).rejects.toThrow(AppError);
    expect(authService.forgotPassword({} as unknown as string)).rejects.toHaveProperty("statusCode", 400);
  });

  test("throws AppError(404) when user not found", async () => {
    mockUserFindOne.mockImplementation(() => Promise.resolve(null));

    expect(authService.forgotPassword(validEmail)).rejects.toThrow(AppError);
    expect(authService.forgotPassword(validEmail)).rejects.toHaveProperty("statusCode", 404);
    expect(authService.forgotPassword(validEmail)).rejects.toHaveProperty(
      "message",
      "User not found"
    );
  });

  test("generates reset token, saves to user, sends email on success", async () => {
    const user = fakeUserDoc({ resetPasswordToken: undefined });
    mockUserFindOne.mockImplementation(() => Promise.resolve(user));

    const result = await authService.forgotPassword(validEmail);

    expect(result).toEqual({ message: "Password reset email sent" });
    expect(user.resetPasswordToken).toBeDefined();
    expect(typeof user.resetPasswordToken).toBe("string");
    expect(user.resetPasswordToken).toHaveLength(64);
    expect(user.save).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      "john@example.com",
      "Reset Your Password",
      expect.stringContaining("password reset token")
    );
  });

  test("uses $eq operator to prevent NoSQL injection", async () => {
    mockUserFindOne.mockImplementation(() => Promise.resolve(null));

    await authService.forgotPassword(validEmail).catch(() => undefined);

    expect(mockUserFindOne).toHaveBeenCalledWith({
      email: { $eq: validEmail },
    });
  });

  test("generates a unique reset token each time", async () => {
    const user1 = fakeUserDoc({ _id: "u1", resetPasswordToken: undefined });
    const user2 = fakeUserDoc({ _id: "u2", resetPasswordToken: undefined });
    mockUserFindOne.mockImplementationOnce(() => Promise.resolve(user1));
    mockUserFindOne.mockImplementationOnce(() => Promise.resolve(user2));

    await authService.forgotPassword("a@a.com");
    await authService.forgotPassword("b@b.com");

    expect(user1.resetPasswordToken).not.toBe(user2.resetPasswordToken);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. resetPassword
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices.resetPassword", () => {
  const validToken = "valid-reset-token-hex";
  const newPassword = "NewSecurePass456!";

  /**
   * Helper: returns a chainable mock for User.findOne().select("+password")
   * that resolves to the given user document (or null).
   */
  function mockFindOneChain(user: Record<string, unknown> | null) {
    const select = mock(() => Promise.resolve(user));
    const findOneResult = { select };
    mockUserFindOne.mockImplementation(() => findOneResult);
    return { select };
  }

  beforeEach(() => {
    mockUserFindOne.mockReset();
  });

  test("throws AppError(400) when user is not found with the given token", async () => {
    mockFindOneChain(null);

    expect(authService.resetPassword(validToken, newPassword)).rejects.toThrow(AppError);
    expect(authService.resetPassword(validToken, newPassword)).rejects.toHaveProperty(
      "statusCode",
      400
    );
    expect(authService.resetPassword(validToken, newPassword)).rejects.toHaveProperty(
      "message",
      "Invalid reset token"
    );
  });

  test("updates password and clears resetPasswordToken on success", async () => {
    const user = fakeUserDoc({
      password: "old-hashed-password",
      resetPasswordToken: validToken,
    });
    // Re-add password to this instance (fakeUserDoc toObject strips it but the doc itself has it)
    user.password = "old-hashed-password";
    mockFindOneChain(user);

    const result = await authService.resetPassword(validToken, newPassword);

    expect(result).toEqual({ message: "Password reset successfully" });
    expect(user.password).toBe(newPassword);
    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
  });

  test("uses $eq operator on resetPasswordToken", async () => {
    mockFindOneChain(null);

    await authService.resetPassword(validToken, newPassword).catch(() => undefined);

    expect(mockUserFindOne).toHaveBeenCalledWith({
      resetPasswordToken: { $eq: validToken },
    });
  });

  test("calls .select('+password') on the query", async () => {
    const { select } = mockFindOneChain(null);

    await authService.resetPassword(validToken, newPassword).catch(() => undefined);

    expect(select).toHaveBeenCalledWith("+password");
  });

  test("throws AppError(400) when token is empty string and user not found", async () => {
    mockFindOneChain(null);

    expect(authService.resetPassword("", newPassword)).rejects.toThrow(AppError);
    expect(authService.resetPassword("", newPassword)).rejects.toHaveProperty(
      "message",
      "Invalid reset token"
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. Integration: verification flow
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices - verification flow", () => {
  beforeEach(() => {
    mockUserFindOne.mockReset();
  });

  test("user becomes verified after verifyEmail with a generated token", async () => {
    const { generateToken } = await import("../modules/auth/auth.utils");
    const token = generateToken();
    const user = fakeUserDoc({ isVerified: false, verificationToken: token });
    mockUserFindOne.mockImplementation(() => Promise.resolve(user));

    const result = await authService.verifyEmail(token);

    expect(result.message).toBe("Email verified successfully");
    expect(user.isVerified).toBe(true);
    expect(user.verificationToken).toBeUndefined();
  });

  test("verifyEmail with already-used or nonexistent token fails", async () => {
    mockUserFindOne.mockImplementation(() => Promise.resolve(null));

    expect(authService.verifyEmail("used-or-nonexistent-token")).rejects.toThrow(AppError);
    expect(
      authService.verifyEmail("used-or-nonexistent-token")
    ).rejects.toHaveProperty("message", "Invalid verification token");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 9. Edge cases
// ─────────────────────────────────────────────────────────────────────────
describe("AuthServices - edge cases", () => {
  beforeEach(() => {
    mockUserFindOne.mockReset();
    mockUserFindById.mockReset();
    mockVerifyToken.mockReset();
    mockGenerateToken.mockReset();
  });

  test("registerUser with whitespace-only email throws", async () => {
    const payload = {
      name: "Test",
      email: "   ",
      password: "Pass123!",
      role: "USER",
    };

    expect(authService.registerUser(payload)).rejects.toThrow(AppError);
    expect(authService.registerUser(payload)).rejects.toHaveProperty(
      "message",
      "A valid email address must be provided."
    );
  });

  test("verifyEmail with empty string throws", async () => {
    expect(authService.verifyEmail("")).rejects.toThrow(AppError);
    expect(authService.verifyEmail("")).rejects.toHaveProperty(
      "message",
      "Invalid verification token"
    );
  });

  test("forgotPassword with empty string returns 404 (user not found)", async () => {
    mockUserFindOne.mockImplementation(() => Promise.resolve(null));

    expect(authService.forgotPassword("")).rejects.toThrow(AppError);
    expect(authService.forgotPassword("")).rejects.toHaveProperty("statusCode", 404);
    expect(authService.forgotPassword("")).rejects.toHaveProperty("message", "User not found");
  });

  test("resetPassword with empty token returns AppError when user not found", async () => {
    const select = mock(() => Promise.resolve(null));
    mockUserFindOne.mockImplementation(() => ({ select }));

    expect(authService.resetPassword("", "newpass")).rejects.toThrow(AppError);
    expect(authService.resetPassword("", "newpass")).rejects.toHaveProperty(
      "message",
      "Invalid reset token"
    );
  });

  test("getNewAccessToken with empty string propagates error", async () => {
    mockCreateNewAccessToken.mockImplementation(() =>
      Promise.reject(new AppError(401, "Invalid or expired refresh token"))
    );

    expect(authService.getNewAccessToken("")).rejects.toThrow(AppError);
  });

  test("credentialsLogin handles user with minimal fields", async () => {
    const minimalUser: {
      _id: string;
      email: string;
      role: string;
      password: string;
      toObject(): Record<string, unknown>;
    } = {
      _id: "min-id",
      email: "min@test.com",
      role: "AGENT",
      password: "secret",
      toObject: function () {
        const { password, ...rest } = this;
        void password;
        return rest;
      },
    };

    const result = await authService.credentialsLogin(minimalUser);

    expect(result.user.email).toBe("min@test.com");
    expect(result.user.role).toBe("AGENT");
    expect(result.user).not.toHaveProperty("password");
    expect(result.accessToken).toBe("test-access");
    expect(result.refreshToken).toBe("test-refresh");
  });
});
