import { describe, expect, test, beforeAll, mock } from "bun:test";

// ===== MOCK DATA =====
const mockUserId = "507f1f77bcf86cd799439011";
const mockServiceId = "507f1f77bcf86cd799439012";
const mockWalletId = "507f1f77bcf86cd799439013";
const mockConfigId = "507f1f77bcf86cd799439016";

const mockUser = {
  _id: mockUserId,
  name: "Test User",
  email: "test@example.com",
  role: "USER",
  isActive: "ACTIVE",
  isVerified: true,
  isDeleted: false,
  tokenVersion: 0,
  password: "$2a$10$hashedpassword",
};

const mockWallet = {
  _id: mockWalletId,
  owner: mockUserId,
  balance: 1000,
  status: "ACTIVE",
};

const mockTransaction = {
  _id: "507f1f77bcf86cd799439014",
  walletId: mockWalletId,
  sender: mockUserId,
  amount: 100,
  fee: 5,
  type: "SEND_MONEY",
  status: "COMPLETED",
  referenceId: "TXN-001",
};

const mockService = {
  _id: mockServiceId,
  title: "Test Service",
  description: "A service for testing",
  image: "test.jpg",
  category: "Test Category",
  rating: 4.5,
  location: "Test Location",
  price: "100",
  date: "2024-01-01",
  reviews: [],
};

const mockCard = {
  _id: "507f1f77bcf86cd799439015",
  user: mockUserId,
  lastFourDigits: "1234",
  cardholderName: "Test User",
  expiryDate: "12/28",
  type: "VIRTUAL",
  status: "ACTIVE",
};

const mockSystemConfig = {
  _id: mockConfigId,
  sendMoneyFee: 5,
  cashInFee: 0,
  withdrawFee: 1.5,
  cashOutFee: 1.5,
  agentCommissionRate: 2,
  dailyLimit: 25000,
  monthlyLimit: 100000,
  minBalance: 0,
  systemWalletId: "6773dccc94154fa7218683e3",
};

const mockSystemSettings = {
  _id: "507f1f77bcf86cd799439017",
  transactionFee: 0.015,
};

// ===== QUERY MOCK HELPER =====
function createMockQuery<T>(data: T) {
  const query: any = {
    sort: () => query,
    select: () => query,
    populate: () => query,
    lean: () => query,
    limit: () => query,
    skip: () => query,
    collation: () => query,
    exec: () => Promise.resolve(data),
    then: (resolve: (value: T) => unknown) => Promise.resolve(data).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(data).catch(reject),
    finally: (cb: () => void) => Promise.resolve(data).finally(cb),
  };
  return query;
}

// ===== MOCK ALL MODELS (BEFORE any app imports) =====
mock.module("../modules/user/user.model", () => ({
  User: {
    find: () => createMockQuery([mockUser]),
    findById: () => createMockQuery(mockUser),
    findOne: () => createMockQuery(mockUser),
    create: () => Promise.resolve(mockUser),
    countDocuments: () => Promise.resolve(5),
    distinct: () => Promise.resolve(["USER", "AGENT", "ADMIN"]),
    aggregate: () => Promise.resolve([{ total: 100 }]),
  },
}));

mock.module("../modules/wallet/wallet.model", () => ({
  Wallet: {
    find: () => createMockQuery([mockWallet]),
    findById: () => createMockQuery(mockWallet),
    findOne: () => createMockQuery(mockWallet),
    create: () => Promise.resolve(mockWallet),
    countDocuments: () => Promise.resolve(5),
    aggregate: () => Promise.resolve([{ totalBalance: 5000 }]),
  },
}));

mock.module("../modules/transaction/transaction.model", () => ({
  Transaction: {
    find: () => createMockQuery([mockTransaction]),
    findById: () => createMockQuery(mockTransaction),
    create: () => Promise.resolve(mockTransaction),
    countDocuments: () => Promise.resolve(10),
    aggregate: () => Promise.resolve([{ total: 5000 }]),
  },
}));

mock.module("../modules/service/service.model", () => ({
  Service: {
    find: () => createMockQuery([mockService]),
    findById: () => createMockQuery(mockService),
    findOne: () => createMockQuery(mockService),
    create: () => Promise.resolve(mockService),
    countDocuments: () => Promise.resolve(8),
    distinct: () => Promise.resolve(["Mobile Recharge", "Internet", "Utilities"]),
    aggregate: () => Promise.resolve([mockService]),
  },
}));

mock.module("../modules/card/card.model", () => ({
  Card: {
    find: () => createMockQuery([mockCard]),
    findById: () => createMockQuery(mockCard),
    create: () => Promise.resolve(mockCard),
    countDocuments: () => Promise.resolve(2),
  },
}));

mock.module("../modules/systemConfig/systemConfig.model", () => ({
  SystemConfig: {
    find: () => createMockQuery([mockSystemConfig]),
    findOne: () => createMockQuery(mockSystemConfig),
    findById: () => createMockQuery(mockSystemConfig),
    create: () => Promise.resolve(mockSystemConfig),
  },
}));

mock.module("../modules/system-settings/system-settings.model", () => ({
  SystemSettings: {
    find: () => createMockQuery([mockSystemSettings]),
    findOne: () => createMockQuery(mockSystemSettings),
    create: () => Promise.resolve(mockSystemSettings),
  },
}));

mock.module("../utils/jwt", () => ({
  generateToken: mock(() => "mock-access-token"),
  verifyToken: mock(() =>
    Promise.resolve({ userId: mockUserId, role: "USER", iat: Date.now(), exp: Date.now() + 900 }),
  ),
}));

mock.module("../config/env", () => ({
  envVars: {
    NODE_ENV: "development",
    PORT: 5000,
    DB_URL: "mongodb://localhost:27017/test",
    CORS_ORIGIN: "http://localhost:3000",
    COOKIE_DOMAIN: "localhost",
    JWT_ACCESS_SECRET: "test-access-secret",
    JWT_ACCESS_EXPIRES: "15m",
    JWT_REFRESH_SECRET: "test-refresh-secret",
    JWT_REFRESH_EXPIRES: "7d",
    BCRYPT_SALT_ROUND: 10,
    SUPER_ADMIN_EMAIL: "admin@test.com",
    SUPER_ADMIN_PASSWORD: "Admin123!",
    CLIENT_URL: "http://localhost:3000",
    EXPRESS_SESSION_SECRET: "test-session-secret",
    DEMO_USER_EMAIL: "demo.user@example.com",
    DEMO_USER_PASSWORD: "DemoUser123!",
    DEMO_AGENT_EMAIL: "demo.agent@example.com",
    DEMO_AGENT_PASSWORD: "DemoAgent123!",
    DEMO_ADMIN_EMAIL: "demo.admin@example.com",
    DEMO_ADMIN_PASSWORD: "DemoAdmin123!",
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
    GOOGLE_CALLBACK_URL: undefined,
    FACEBOOK_APP_ID: undefined,
    FACEBOOK_APP_SECRET: undefined,
    FACEBOOK_CALLBACK_URL: undefined,
  },
}));

// ===== DYNAMIC IMPORT =====
import request from "supertest";

let app: any;

beforeAll(async () => {
  app = (await import("../app")).default;
});

// ============================================================
// AUTH ROUTES (/api/v1/auth)
// ============================================================
describe("Auth Routes (/api/v1/auth)", () => {
  describe("POST /register", () => {
    test("returns 400 when body is empty (validation error)", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /login", () => {
    test("returns 400 when body is empty (validation error)", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /forgot-password", () => {
    test("returns 400 when body is empty (validation error)", async () => {
      const res = await request(app).post("/api/v1/auth/forgot-password").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /reset-password", () => {
    test("returns 400 when body is empty (validation error)", async () => {
      const res = await request(app).post("/api/v1/auth/reset-password").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /verify-email", () => {
    test("returns 400 when body is empty (validation error)", async () => {
      const res = await request(app).post("/api/v1/auth/verify-email").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /refresh-token", () => {
    test("returns 400 when no refresh token cookie is sent", async () => {
      const res = await request(app).post("/api/v1/auth/refresh-token").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /logout", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).post("/api/v1/auth/logout");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /demo-users", () => {
    test("returns 200 (public endpoint)", async () => {
      const res = await request(app).get("/api/v1/auth/demo-users");
      expect(res.status).toBe(200);
    });
  });
});

// ============================================================
// USER ROUTES (/api/v1/users)
// ============================================================
describe("User Routes (/api/v1/users)", () => {
  describe("GET /", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/users");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /me", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/users/me");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /me", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch("/api/v1/users/me");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /me/update-password", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch("/api/v1/users/me/update-password");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /create-admin", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).post("/api/v1/users/create-admin");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /:id/block", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch(`/api/v1/users/${mockUserId}/block`);
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /:id/unblock", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch(`/api/v1/users/${mockUserId}/unblock`);
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /:id/approval", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch(`/api/v1/users/${mockUserId}/approval`);
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /:id/suspend", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch(`/api/v1/users/${mockUserId}/suspend`);
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// WALLET ROUTES (/api/v1/wallets)
// ============================================================
describe("Wallet Routes (/api/v1/wallets)", () => {
  describe("GET /me", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/wallets/me");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/wallets");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /:id", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get(`/api/v1/wallets/${mockWalletId}`);
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /:id/block", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch(`/api/v1/wallets/${mockWalletId}/block`);
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /:id/unblock", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch(`/api/v1/wallets/${mockWalletId}/unblock`);
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// TRANSACTION ROUTES (/api/v1/transactions)
// ============================================================
describe("Transaction Routes (/api/v1/transactions)", () => {
  describe("POST /send-money", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).post("/api/v1/transactions/send-money");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /add-money", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).post("/api/v1/transactions/add-money");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /withdraw-money", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).post("/api/v1/transactions/withdraw-money");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /history", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/transactions/history");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /get-commission-history", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/transactions/get-commission-history");
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// SERVICE ROUTES (/api/v1/services)
// ============================================================
describe("Service Routes (/api/v1/services)", () => {
  describe("GET /", () => {
    test("returns 200 (public endpoint)", async () => {
      const res = await request(app).get("/api/v1/services");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /categories", () => {
    test("returns 200 (public endpoint)", async () => {
      const res = await request(app).get("/api/v1/services/categories");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /my-purchases", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/services/my-purchases");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /:id", () => {
    test("returns 200 for a valid service id (public endpoint)", async () => {
      const res = await request(app).get(`/api/v1/services/${mockServiceId}`);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id/related", () => {
    test("returns 200 (public endpoint)", async () => {
      const res = await request(app).get(`/api/v1/services/${mockServiceId}/related`);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /:id/purchase", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).post(`/api/v1/services/${mockServiceId}/purchase`);
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// ADMIN ROUTES (/api/v1/admin)
// ============================================================
describe("Admin Routes (/api/v1/admin)", () => {
  describe("GET /summary", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/admin/summary");
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// AGENT ROUTES (/api/v1/agent)
// ============================================================
describe("Agent Routes (/api/v1/agent)", () => {
  describe("GET /summary", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/agent/summary");
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// CARD ROUTES (/api/v1/cards)
// ============================================================
describe("Card Routes (/api/v1/cards)", () => {
  describe("GET /", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/cards");
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// SYSTEM CONFIG ROUTES (/api/v1/system-config)
// ============================================================
describe("System Config Routes (/api/v1/system-config)", () => {
  describe("GET /", () => {
    test("returns 200 (public endpoint)", async () => {
      const res = await request(app).get("/api/v1/system-config");
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).patch("/api/v1/system-config");
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// DASHBOARD ROUTES (/api/v1/dashboard)
// ============================================================
describe("Dashboard Routes (/api/v1/dashboard)", () => {
  describe("GET /spending-overview", () => {
    test("returns 401 without authorization token", async () => {
      const res = await request(app).get("/api/v1/dashboard/spending-overview");
      expect(res.status).toBe(401);
    });
  });
});

// ============================================================
// PUBLIC ROUTES (/api/v1/public)
// ============================================================
describe("Public Routes (/api/v1/public)", () => {
  describe("GET /stats", () => {
    test("returns 200 (public endpoint)", async () => {
      const res = await request(app).get("/api/v1/public/stats");
      expect(res.status).toBe(200);
    });
  });
});

// ============================================================
// ROOT ROUTE
// ============================================================
describe("Root Route (/)", () => {
  test("returns 200 with welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });
});
