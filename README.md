# Wallet Management System — API

> A robust, production-ready REST API for a digital wallet platform. Built with **Bun**, **Express 5**, **MongoDB**, and **TypeScript**. Features MongoDB ACID transactions for financial operations, granular RBAC (USER / AGENT / ADMIN / SUPER_ADMIN), JWT access/refresh token rotation, and a deliberate decision to remove OAuth for financial-app security.

[![Frontend Repo](https://img.shields.io/badge/Frontend_Repo-GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/tarekul42/wallet-management-client)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](https://opensource.org/licenses/ISC)

---

## 📋 Overview

This is the backend API for the **Wallet Management System** — a digital wallet platform handling user authentication, wallet management, financial transactions (send money, cash-in, cash-out, withdrawals), a service marketplace with 1.5% transaction fees, agent commission tracking, and virtual/physical card management.

The API is built on **Bun + Express 5** with **MongoDB (Mongoose)** and follows a modular architecture across 12 modules: `auth`, `user`, `wallet`, `transaction`, `service`, `card`, `agent`, `admin`, `dashboard`, `public`, `systemConfig`, `system-settings`. Financial operations use **MongoDB ACID transactions** to ensure atomicity across multi-document updates (e.g., a send-money operation debits the sender, credits the receiver, and logs the transaction — all atomically).

**Why no OAuth?** This is a financial app handling real money. OAuth introduces dependency on external providers (outages = locked-out users), complicates account recovery (which provider owns this account?), expands the attack surface (token leaks, callback hijacking), and creates a fuzzier threat model. For wallets, the simpler password + JWT rotation + email verification flow is the safer choice.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Bun |
| Framework | Express.js 5 |
| Language | TypeScript 5.9 |
| Database | MongoDB (Mongoose 8) |
| Auth | JWT + Passport.js (Local Strategy only — OAuth deliberately removed) |
| Validation | Zod 4 |
| Security | Helmet, express-rate-limit, bcryptjs, cookie-parser, express-session |
| Password Hashing | bcryptjs (salt rounds configurable) |
| HTTP Status | http-status-codes |
| CI/CD | GitHub Actions |

---

## ✨ Main Features

- **MongoDB ACID transactions** — financial operations (send money, cash-in, cash-out, withdrawals) are atomic across multi-document updates. If any step fails, the entire transaction rolls back. No partial debits, no lost credits.
- **Granular RBAC** — USER / AGENT / ADMIN / SUPER_ADMIN with distinct permissions. Agents can cash-in/cash-out and earn commissions; admins manage users, agents, and system config; super admins configure fees and limits.
- **JWT access + refresh token rotation** — every refresh issues a new refresh token and invalidates the old one. Reduces the impact of token theft (a stolen refresh token is only valid until the next legitimate refresh).
- **Deliberately no OAuth** — for a financial app, password + JWT rotation + email verification is safer than OAuth. Less external-provider dependency, simpler account recovery, smaller attack surface. Documented engineering decision, not an oversight.
- **Configurable system economics** — fees (send, cash-in, withdraw, cash-out), agent commission rate, and daily/monthly limits are all configurable at runtime via admin endpoints. No code changes needed to tune the business model.
- **Service marketplace with 1.5% fee** — purchase services from the marketplace; the fee auto-routes to the system wallet. Purchase history with populated service details.
- **Agent commission tracking** — accurate commission calculation across cash-in/out operations using transactional increments (no double-counting, no lost updates).
- **Virtual & physical card management** — create, copy details, freeze/unfreeze cards.
- **Seeded demo data** — 4 demo accounts (User with $7,177.50 balance, Agent with $9,630, Admin, Super Admin) so reviewers can explore immediately.
- **Rate limiting** — Helmet + express-rate-limit protect against brute-force and API abuse.
- **Zod validation** — every request body is validated before reaching controllers.

---

## 📦 Main Dependencies

### Runtime Dependencies
| Package | Purpose |
|---------|---------|
| `express@^5.2.1` | Web framework |
| `mongoose@^8.24.0` | MongoDB ODM (with ACID transactions) |
| `jsonwebtoken@^9.0.3` | JWT auth (access + refresh rotation) |
| `passport@^0.7.0` + `passport-local@^1.0.0` | Authentication (Local Strategy only) |
| `bcryptjs@^3.0.3` | Password hashing |
| `zod@^4.4.3` | Schema validation |
| `helmet@^8.2.0` | Security headers |
| `express-rate-limit@^8.5.2` | Rate limiting |
| `cookie-parser@^1.4.7` | Cookie parsing |
| `express-session@^1.19.0` | Session management |
| `cors@^2.8.6` | Cross-origin resource sharing |
| `dotenv@^17.4.2` | Environment variable loading |
| `http-status-codes@^2.3.0` | HTTP status constants |

### Dev Dependencies (key ones)
| Package | Purpose |
|---------|---------|
| `typescript@^5.9.3` | Type safety |
| `eslint@^9.39.4` + `typescript-eslint@^8.61.1` | Linting |
| `supertest@^7.2.2` | HTTP assertion testing |
| `bun-types@^1.3.14` | Bun type definitions |
| `@vercel/node@^5.1.14` | Vercel serverless deployment |

---

## 🚀 Run Locally

### Prerequisites
- [Bun](https://bun.sh/) 1.x+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (free tier works)

### Installation

```bash
# 1. Clone
git clone https://github.com/tarekul42/wallet-management-api.git
cd wallet-management-api

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Edit .env — see required variables below

# 4. Seed the database (creates super admin + 4 demo users)
bun run seed

# 5. Run dev server (with hot reload)
bun run dev
```

Server starts at http://localhost:5000

### Environment Variables (required)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DB_URL` | MongoDB connection string | `mongodb://localhost:27017/wallet` or Atlas URI |
| `BCRYPT_SALT_ROUND` | Bcrypt salt rounds | `10` |
| `JWT_ACCESS_SECRET` | Access token secret | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `JWT_ACCESS_EXPIRES` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | (generate like above) |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime | `7d` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:5173` |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` |
| `COOKIE_DOMAIN` | Cookie domain | `localhost` |
| `SUPER_ADMIN_EMAIL` | Super admin email | `admin@example.com` |
| `SUPER_ADMIN_PASSWORD` | Super admin password | `super-secret-password` |
| `EXPRESS_SESSION_SECRET` | Session secret | (generate like above) |
| `DEMO_USER_EMAIL` | Demo user email | `demo.user@example.com` |
| `DEMO_USER_PASSWORD` | Demo user password | `DemoUser123!` |
| `DEMO_AGENT_EMAIL` | Demo agent email | `demo.agent@example.com` |
| `DEMO_AGENT_PASSWORD` | Demo agent password | `DemoAgent123!` |
| `DEMO_ADMIN_EMAIL` | Demo admin email | `demo.admin@example.com` |
| `DEMO_ADMIN_PASSWORD` | Demo admin password | `DemoAdmin123!` |

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run build` | Build for production (`bun build`) |
| `bun run start` | Start production server from `dist/` |
| `bun run seed` | Seed database with super admin + demo users |
| `bun run test` | Run tests with Bun test runner |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Run ESLint with auto-fix |

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| 🖥️ **Frontend Repo** | https://github.com/tarekul42/wallet-management-client |
| 🌐 **Live Frontend** | https://wallet-management-client.vercel.app |
| 📧 **Contact** | tarekulrifat142@gmail.com |

---

## 📄 License

ISC © Tarekul Islam Rifat

---

<div align="center">

**⭐ If this project helped you, give it a star!**

Built with ❤️ by [Tarekul Islam Rifat](https://github.com/tarekul42)

</div>
