# Wallet Management API

[![CI](https://github.com/username/wallet-management-api/actions/workflows/ci.yml/badge.svg)](https://github.com/username/wallet-management-api/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![License](https://img.shields.io/badge/License-ISC-yellow)

A robust, production-ready REST API for managing digital wallets, user authentication, and financial transactions. Built with Node.js, Express, and MongoDB.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [CI/CD](#cicd)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | JWT-based auth with access/refresh tokens, Google OAuth, email verification, password reset |
| **Authorization** | Role-based access control (USER, AGENT, ADMIN, SUPER_ADMIN) |
| **Wallet Management** | Create wallets, balance tracking, block/unblock operations |
| **Transactions** | Send money, cash-in, withdrawals, transaction history, agent commission tracking |
| **User Management** | Profile management, admin creation, agent approval/suspension, block/unblock users |
| **System Configuration** | Configurable fees (send, cash-in, withdraw), daily limits |
| **Security** | Rate limiting, Helmet, bcrypt hashing, httpOnly cookies |
| **Validation** | Request validation with Zod |
| **Error Handling** | Centralized error handling with meaningful HTTP status codes |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| Database | MongoDB (Mongoose) |
| Authentication | JWT, Passport.js (Local & Google OAuth) |
| Validation | Zod |
| Security | Helmet, express-rate-limit, bcryptjs |

---

## Prerequisites

- **Node.js** 18.x or later
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **npm** 9+ or **yarn**

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd wallet-management-api
npm install
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
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime | `7d` |
| `BCRYPT_SALT_ROUND` | Bcrypt salt rounds | `10` |
| `SUPER_ADMIN_EMAIL` | Super admin email | `admin@example.com` |
| `SUPER_ADMIN_PASSWORD` | Super admin password | *Strong password* |
| `EXPRESS_SESSION_SECRET` | Express session secret | *Generate below* |

**Generate secure secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Run the Application

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

The API is available at `http://localhost:5000` (or your configured `PORT`).

**Quick health check:**

```bash
curl http://localhost:5000/
# {"message":"Welcome to the Wallet Management API!"}
```

---

## API Documentation

All endpoints are prefixed with **`/api/v1`**.

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/auth` | Register, login, logout, refresh token, verify email, forgot/reset password |
| Users | `/users` | Profile, admin creation, block/unblock, agent approval |
| Wallets | `/wallets` | Wallet management, balance, block/unblock |
| Transactions | `/transactions` | Send money, cash-in, withdraw, history, commissions |
| System Config | `/system-config` | System-wide configuration (fees, limits) |

**Authentication:** JWT tokens are delivered via **httpOnly cookies** (`accessToken`, `refreshToken`). Include credentials in requests when calling secured endpoints.

For detailed request/response schemas and examples, see **[API_DOCS.md](./API_DOCS.md)**.

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
│   ├── auth/
│   ├── user/
│   ├── wallet/
│   ├── transaction/
│   ├── systemConfig/
│   └── system-settings/
├── routes/                # Route aggregation
└── utils/                 # Shared utilities (JWT, catchAsync, etc.)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm test` | Run tests |

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main` and on pull requests:

- Install dependencies (`npm ci`)
- TypeScript type check (`tsc --noEmit`)
- ESLint
- Tests
- Production build

---

## License

ISC
