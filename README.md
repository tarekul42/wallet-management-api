# Wallet Management API

[![CI](https://github.com/tarekul42/wallet-management-api/actions/workflows/ci.yml/badge.svg)](https://github.com/tarekul42/wallet-management-api/actions/workflows/ci.yml)
![Bun](https://img.shields.io/badge/Bun-1.x-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![License](https://img.shields.io/badge/License-ISC-yellow)

A robust, production-ready REST API for managing digital wallets, user authentication, financial transactions, and service purchases. Built with Express, MongoDB, and Bun.

---

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | JWT-based auth with access/refresh tokens, Google OAuth, email verification, password reset, refresh token rotation |
| **Authorization** | Role-based access control (USER, AGENT, ADMIN, SUPER_ADMIN) |
| **Wallet Management** | Create wallets, balance tracking, block/unblock operations, agent cash-in/cash-out |
| **Transactions** | Send money, cash-in, cash-out, withdrawals, transaction history, agent commission tracking with MongoDB transactions |
| **Service Purchases** | Purchase services from the marketplace with 1.5% transaction fee, purchase history with populated service details |
| **Service Management** | Full CRUD for services, categories, search, filtering, rating sorting, pagination, related services |
| **Agent Management** | Agent dashboard with balance, total commission, active customers count, success rate, commission history |
| **User Management** | Profile management, admin creation, agent approval/suspension, block/unblock users |
| **System Configuration** | Configurable fees (send, cash-in, withdraw, cash-out), agent commission rate, daily/monthly limits |
| **Security** | Rate limiting, Helmet, bcrypt hashing, httpOnly cookies, NoSQL injection protection |
| **Validation** | Request validation with Zod |
| **Error Handling** | Centralized error handling with meaningful HTTP status codes |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Bun |
| Framework | Express |
| Language | TypeScript |
| Database | MongoDB (Mongoose) |
| Authentication | JWT, Passport.js (Local & Google OAuth) |
| Validation | Zod |
| Security | Helmet, express-rate-limit, bcryptjs |

---

## Prerequisites

- **Bun** 1.x or later
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/tarekul42/wallet-management-api
cd wallet-management-api
bun install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and configure the required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `NODE_ENV` | Environment | `development` or `production` |
| `JWT_ACCESS_SECRET` | Access token signing secret | *Generate below* |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | *Generate below* |
| `JWT_ACCESS_EXPIRES` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime | `30d` |
| `BCRYPT_SALT_ROUND` | Bcrypt salt rounds | `10` |
| `SUPER_ADMIN_EMAIL` | Super admin email | `admin@example.com` |
| `SUPER_ADMIN_PASSWORD` | Super admin password | *Strong password* |
| `DEMO_USER_EMAIL` | Demo user email for portfolio review | `demo.user@example.com` |
| `DEMO_USER_PASSWORD` | Demo user password | `DemoUser123!` |
| `DEMO_AGENT_EMAIL` | Demo agent email | `demo.agent@example.com` |
| `DEMO_AGENT_PASSWORD` | Demo agent password | `DemoAgent123!` |
| `DEMO_ADMIN_EMAIL` | Demo admin email | `demo.admin@example.com` |
| `DEMO_ADMIN_PASSWORD` | Demo admin password | `DemoAdmin123!` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173,http://localhost:3000` |
| `CLIENT_URL` | Frontend URL for redirects | `http://localhost:5173` |

### 3. Seed Demo Data

```bash
# Full seed (users, wallets, transactions, services, cards)
bun run seed

# Agent-specific seed (rich agent transaction history)
bun run scripts/seed-agent.ts
```

### 4. Run the Application

```bash
# Development (hot reload)
bun run dev

# Production
bun run build
bun start
```

The API is available at `http://localhost:5000` (or your configured `PORT`).

---

## API Documentation

All endpoints are prefixed with **`/api/v1`**.

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/auth` | Register, login, logout, refresh token, verify email, forgot/reset password |
| Users | `/users` | Profile, admin creation, block/unblock, agent approval |
| Wallets | `/wallets` | Wallet management, balance, block/unblock |
| Transactions | `/transactions` | Send money, cash-in, cash-out, withdraw, history, commission history |
| Services | `/services` | List, search, filter, categories, service details, related services, **purchase**, **my purchases** |
| Agent | `/agent` | Agent dashboard summary (balance, commission, customers, success rate) |
| Admin | `/admin` | Dashboard summary, manage users, agents, wallets, system config |
| Cards | `/cards` | Virtual/physical card management |
| System Config | `/system-config` | System-wide configuration (fees, limits, commission rate) |
| System Settings | `/system-settings` | Transaction fee percentage |

### Authentication

JWT access tokens are returned in the login response and should be sent as `Authorization: Bearer <token>`. Refresh tokens are stored in httpOnly cookies. The API also supports token refresh via `POST /auth/refresh-token`.

### Service Purchase Flow

```
POST /api/v1/services/:id/purchase
Authorization: Bearer <token>
Content-Type: application/json

{ "amount": 29.99 }
```

- Deducts `amount + fee` (1.5% of amount) from user's wallet
- Credits the fee to the system wallet
- Returns `{ balance: number }` for instant UI update
- Requires `USER` role

### Purchase History

```
GET /api/v1/services/my-purchases
Authorization: Bearer <token>
```

Returns SERVICE_PURCHASE transactions with populated service details (title, image, price, category).

For detailed request/response schemas, see **[API_DOCS.md](./API_DOCS.md)**.

---

## Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── config/                # Environment, Passport, rate limiter
├── errorHelpers/          # Error transformation utilities
├── helpers/               # Validation & error handlers
├── interfaces/            # TypeScript type definitions
├── middlewares/           # Auth, validation, global error handler
├── modules/               # Feature modules
│   ├── auth/              # Login, register, OAuth, password reset
│   ├── user/              # Profile, admin/agent management
│   ├── wallet/            # Balance, status, CRUD
│   ├── transaction/       # Send money, cash-in/out, withdraw, history
│   ├── service/           # Services CRUD, purchase, purchase history
│   ├── agent/             # Agent dashboard summary
│   ├── admin/             # Admin dashboard, user/agent/wallet management
│   ├── card/              # Virtual and physical card management
│   ├── dashboard/         # Aggregated dashboard data
│   ├── public/            # Public endpoints
│   ├── systemConfig/      # Dynamic system configuration
│   └── system-settings/   # System settings
├── routes/                # Route aggregation
└── utils/                 # Shared utilities (JWT, catchAsync, sendResponse)
scripts/
├── seed.ts                # Main seed (all users, wallets, transactions, services, cards)
├── seed-agent.ts          # Agent-specific seed data
└── seed-services.ts       # Standalone services seed
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Compile TypeScript to JavaScript |
| `bun start` | Run production server |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Run ESLint with auto-fix |
| `bun test` | Run tests |
| `bun run seed` | Seed demo data (users, wallets, transactions, services, cards) |

---

## Demo Credentials

After running the seed script, the following demo accounts are available:

| Role | Email | Password | Wallet |
|------|-------|----------|--------|
| **User** | `demo.user@example.com` | `DemoUser123!` | $7,177.50 |
| **Agent** | `demo.agent@example.com` | `DemoAgent123!` | $9,630.00 |
| **Admin** | `demo.admin@example.com` | `DemoAdmin123!` | $0.00 |
| **Super Admin** | `admin.wallet@gmail.com` | `SuperAdmin123` | $0.00 |

Additional test users: Alice, Bob, Carol, Dave, Eva, FastCash Agent, PayPoint Agent.

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main` and on pull requests:

- Install dependencies (`bun install`)
- ESLint
- Tests (`bun test`)
- Production build (`bun run build`)

---

## License

ISC
