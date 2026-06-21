import { describe, expect, test, mock, beforeEach } from "bun:test";
import { StatusCodes } from "http-status-codes";

// =========================================================================
// MOCKS - must be registered before dynamic imports
// =========================================================================

const mockUserFindById = mock(() => Promise.resolve(null));
const mockWalletFindById = mock(() => Promise.resolve(null));
const mockWalletFind = mock(() => Promise.resolve([]));
const mockNotifyWalletBlocked = mock(() => {});
const mockNotifyWalletUnblocked = mock(() => {});

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

mock.module("../utils/notification.utils", () => ({
  notifyWalletBlocked: mockNotifyWalletBlocked,
  notifyWalletUnblocked: mockNotifyWalletUnblocked,
}));

mock.module("../modules/user/user.model", () => ({
  User: { findById: mockUserFindById },
}));

mock.module("../modules/wallet/wallet.model", () => ({
  Wallet: { findById: mockWalletFindById, find: mockWalletFind },
}));

// =========================================================================
// DYNAMIC IMPORTS
// =========================================================================

const { WalletServices } = await import("../modules/wallet/wallet.service");
const { default: AppError } = await import("../errorHelpers/AppError");
const { WalletStatus } = await import("../modules/wallet/wallet.interface");

// =========================================================================
// HELPERS
// =========================================================================

function createMockWallet(overrides: Record<string, unknown> = {}) {
  return {
    _id: "wallet-id",
    owner: "user-id",
    balance: 100,
    status: WalletStatus.ACTIVE,
    save: mock(() => Promise.resolve()),
    ...overrides,
  };
}

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: "user-id",
    email: "user@test.com",
    name: "Test User",
    ...overrides,
  };
}

// =========================================================================
// TESTS
// =========================================================================

describe("WalletServices", () => {
  beforeEach(() => {
    mockUserFindById.mockReset();
    mockUserFindById.mockImplementation(() => Promise.resolve(null));
    mockWalletFindById.mockReset();
    mockWalletFindById.mockImplementation(() => Promise.resolve(null));
    mockWalletFind.mockReset();
    mockWalletFind.mockImplementation(() => Promise.resolve([]));
    mockNotifyWalletBlocked.mockReset();
    mockNotifyWalletUnblocked.mockReset();
  });

  // =========================================================================
  // getMyWallet
  // =========================================================================
  describe("getMyWallet", () => {
    test("returns populated wallet when user exists with wallet", async () => {
      const mockWallet = createMockWallet();
      mockUserFindById.mockImplementation(() => ({
        populate: mock(() => Promise.resolve({ wallet: mockWallet })),
      }));

      const result = await WalletServices.getMyWallet("user-id");

      expect(result).toEqual(mockWallet);
      expect(mockUserFindById).toHaveBeenCalledWith("user-id");
    });

    test("throws AppError 404 when user is not found", async () => {
      mockUserFindById.mockImplementation(() => ({
        populate: mock(() => Promise.resolve(null)),
      }));

      await expect(WalletServices.getMyWallet("unknown")).rejects.toThrow(AppError);
      await expect(WalletServices.getMyWallet("unknown")).rejects.toHaveProperty(
        "statusCode",
        StatusCodes.NOT_FOUND,
      );
      await expect(WalletServices.getMyWallet("unknown")).rejects.toHaveProperty(
        "message",
        "User not found.",
      );
    });

    test("throws AppError 404 when user exists but has no wallet", async () => {
      mockUserFindById.mockImplementation(() => ({
        populate: mock(() => Promise.resolve({ _id: "user-id", wallet: null })),
      }));

      await expect(WalletServices.getMyWallet("user-id")).rejects.toThrow(AppError);
      await expect(WalletServices.getMyWallet("user-id")).rejects.toHaveProperty(
        "statusCode",
        StatusCodes.NOT_FOUND,
      );
      await expect(WalletServices.getMyWallet("user-id")).rejects.toHaveProperty(
        "message",
        "Wallet not found for this user.",
      );
    });
  });

  // =========================================================================
  // getAllWallets
  // =========================================================================
  describe("getAllWallets", () => {
    test("returns all wallets when no status filter is provided", async () => {
      const wallets = [
        createMockWallet(),
        createMockWallet({ _id: "wallet-2", balance: 200 }),
      ];
      mockWalletFind.mockImplementation(() => Promise.resolve(wallets));

      const result = await WalletServices.getAllWallets({});

      expect(result).toEqual(wallets);
      expect(mockWalletFind).toHaveBeenCalledWith({});
    });

    test("filters wallets by a valid ACTIVE status", async () => {
      const wallets = [createMockWallet({ status: WalletStatus.ACTIVE })];
      mockWalletFind.mockImplementation(() => Promise.resolve(wallets));

      const result = await WalletServices.getAllWallets({ status: "ACTIVE" });

      expect(result).toEqual(wallets);
      expect(mockWalletFind).toHaveBeenCalledWith({
        status: WalletStatus.ACTIVE,
      });
    });

    test("filters wallets by a valid BLOCKED status", async () => {
      const blockedWallet = createMockWallet({
        status: WalletStatus.BLOCKED,
      });
      mockWalletFind.mockImplementation(() => Promise.resolve([blockedWallet]));

      const result = await WalletServices.getAllWallets({ status: "BLOCKED" });

      expect(result).toEqual([blockedWallet]);
      expect(mockWalletFind).toHaveBeenCalledWith({
        status: WalletStatus.BLOCKED,
      });
    });

    test("throws AppError 400 when status is not a string", async () => {
      await expect(
        WalletServices.getAllWallets({ status: 123 }),
      ).rejects.toThrow(AppError);
      await expect(
        WalletServices.getAllWallets({ status: 123 }),
      ).rejects.toHaveProperty("statusCode", StatusCodes.BAD_REQUEST);
      await expect(
        WalletServices.getAllWallets({ status: 123 }),
      ).rejects.toHaveProperty("message", "Invalid wallet status.");
    });

    test("throws AppError 400 when status is not a valid WalletStatus enum value", async () => {
      await expect(
        WalletServices.getAllWallets({ status: "INVALID" }),
      ).rejects.toThrow(AppError);
      await expect(
        WalletServices.getAllWallets({ status: "INVALID" }),
      ).rejects.toHaveProperty("statusCode", StatusCodes.BAD_REQUEST);
      await expect(
        WalletServices.getAllWallets({ status: "INVALID" }),
      ).rejects.toHaveProperty("message", "Invalid wallet status.");
    });

    test("returns empty array when no wallets match the filter", async () => {
      mockWalletFind.mockImplementation(() => Promise.resolve([]));

      const result = await WalletServices.getAllWallets({
        status: "BLOCKED",
      });

      expect(result).toEqual([]);
      expect(mockWalletFind).toHaveBeenCalledWith({
        status: WalletStatus.BLOCKED,
      });
    });
  });

  // =========================================================================
  // getSingleWallet
  // =========================================================================
  describe("getSingleWallet", () => {
    test("returns the wallet when found", async () => {
      const mockWallet = createMockWallet();
      mockWalletFindById.mockImplementation(() => Promise.resolve(mockWallet));

      const result = await WalletServices.getSingleWallet("wallet-id");

      expect(result).toEqual(mockWallet);
      expect(mockWalletFindById).toHaveBeenCalledWith("wallet-id");
    });

    test("throws AppError 404 when wallet is not found", async () => {
      mockWalletFindById.mockImplementation(() => Promise.resolve(null));

      await expect(
        WalletServices.getSingleWallet("unknown"),
      ).rejects.toThrow(AppError);
      await expect(
        WalletServices.getSingleWallet("unknown"),
      ).rejects.toHaveProperty("statusCode", StatusCodes.NOT_FOUND);
      await expect(
        WalletServices.getSingleWallet("unknown"),
      ).rejects.toHaveProperty("message", "Wallet not found.");
    });
  });

  // =========================================================================
  // blockWallet
  // =========================================================================
  describe("blockWallet", () => {
    test("blocks wallet and sends notification when user is found", async () => {
      const mockWallet = createMockWallet();
      mockWalletFindById.mockImplementation(() => Promise.resolve(mockWallet));
      mockUserFindById.mockImplementation(() =>
        Promise.resolve(createMockUser()),
      );

      const result = await WalletServices.blockWallet("wallet-id");

      expect(mockWalletFindById).toHaveBeenCalledWith("wallet-id");
      expect(mockWallet.status).toBe(WalletStatus.BLOCKED);
      expect(mockWallet.save).toHaveBeenCalled();
      expect(mockUserFindById).toHaveBeenCalledWith("user-id");
      expect(mockNotifyWalletBlocked).toHaveBeenCalledWith({
        userId: "user-id",
        email: "user@test.com",
        name: "Test User",
      });
      expect(mockNotifyWalletUnblocked).not.toHaveBeenCalled();
      expect(result).toBe(mockWallet);
    });

    test("blocks wallet and skips notification when user is not found", async () => {
      const mockWallet = createMockWallet();
      mockWalletFindById.mockImplementation(() => Promise.resolve(mockWallet));
      mockUserFindById.mockImplementation(() => Promise.resolve(null));

      const result = await WalletServices.blockWallet("wallet-id");

      expect(mockWallet.status).toBe(WalletStatus.BLOCKED);
      expect(mockWallet.save).toHaveBeenCalled();
      expect(mockNotifyWalletBlocked).not.toHaveBeenCalled();
      expect(mockNotifyWalletUnblocked).not.toHaveBeenCalled();
      expect(result).toBe(mockWallet);
    });

    test("throws AppError 404 when wallet is not found", async () => {
      mockWalletFindById.mockImplementation(() => Promise.resolve(null));

      await expect(
        WalletServices.blockWallet("unknown"),
      ).rejects.toThrow(AppError);
      await expect(
        WalletServices.blockWallet("unknown"),
      ).rejects.toHaveProperty("statusCode", StatusCodes.NOT_FOUND);
      await expect(
        WalletServices.blockWallet("unknown"),
      ).rejects.toHaveProperty("message", "Wallet not found.");
    });
  });

  // =========================================================================
  // unblockWallet
  // =========================================================================
  describe("unblockWallet", () => {
    test("unblocks wallet and sends notification when user is found", async () => {
      const mockWallet = createMockWallet({ status: WalletStatus.BLOCKED });
      mockWalletFindById.mockImplementation(() => Promise.resolve(mockWallet));
      mockUserFindById.mockImplementation(() =>
        Promise.resolve(createMockUser()),
      );

      const result = await WalletServices.unblockWallet("wallet-id");

      expect(mockWalletFindById).toHaveBeenCalledWith("wallet-id");
      expect(mockWallet.status).toBe(WalletStatus.ACTIVE);
      expect(mockWallet.save).toHaveBeenCalled();
      expect(mockUserFindById).toHaveBeenCalledWith("user-id");
      expect(mockNotifyWalletUnblocked).toHaveBeenCalledWith({
        userId: "user-id",
        email: "user@test.com",
        name: "Test User",
      });
      expect(mockNotifyWalletBlocked).not.toHaveBeenCalled();
      expect(result).toBe(mockWallet);
    });

    test("unblocks wallet and skips notification when user is not found", async () => {
      const mockWallet = createMockWallet({ status: WalletStatus.BLOCKED });
      mockWalletFindById.mockImplementation(() => Promise.resolve(mockWallet));
      mockUserFindById.mockImplementation(() => Promise.resolve(null));

      const result = await WalletServices.unblockWallet("wallet-id");

      expect(mockWallet.status).toBe(WalletStatus.ACTIVE);
      expect(mockWallet.save).toHaveBeenCalled();
      expect(mockNotifyWalletUnblocked).not.toHaveBeenCalled();
      expect(mockNotifyWalletBlocked).not.toHaveBeenCalled();
      expect(result).toBe(mockWallet);
    });

    test("throws AppError 404 when wallet is not found", async () => {
      mockWalletFindById.mockImplementation(() => Promise.resolve(null));

      await expect(
        WalletServices.unblockWallet("unknown"),
      ).rejects.toThrow(AppError);
      await expect(
        WalletServices.unblockWallet("unknown"),
      ).rejects.toHaveProperty("statusCode", StatusCodes.NOT_FOUND);
      await expect(
        WalletServices.unblockWallet("unknown"),
      ).rejects.toHaveProperty("message", "Wallet not found.");
    });
  });
});
