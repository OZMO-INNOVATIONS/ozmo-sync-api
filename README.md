# Ozmo Sync API

> Backend authentication & user management API built with NestJS — featuring JWT auth, role-based access control, rate limiting, and comprehensive API testing via Postman/Newman.

[![Node](https://img.shields.io/badge/Node-22.12-green?logo=node.js)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-red?logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org)
[![Postman](https://img.shields.io/badge/Tested%20with-Newman-orange?logo=postman)](https://learning.postman.com/docs/running-collections/using-newman-cli/)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
  - [Health](#-health)
  - [Authentication](#-authentication)
  - [User Profile](#-user-profile)
  - [Admin](#-admin)
- [Authentication Flow](#authentication-flow)
- [Seed Users](#seed-users)
- [Testing](#testing)
  - [Manual Testing with Postman](#manual-testing-with-postman)
  - [Automated Testing with Newman](#automated-testing-with-newman)
- [Error Handling](#error-handling)
- [Security](#security)
- [Rate Limiting](#rate-limiting)

---

## Tech Stack

| Category          | Technology                                             |
| ----------------- | ------------------------------------------------------ |
| **Framework**     | [NestJS 11](https://nestjs.com)                        |
| **Language**      | [TypeScript 5.7](https://www.typescriptlang.org)       |
| **Auth**          | [Passport](http://www.passportjs.org) + JWT            |
| **Validation**    | [class-validator](https://github.com/typestack/class-validator) |
| **Password Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js)    |
| **Rate Limiting** | [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| **Security**      | [Helmet](https://helmetjs.github.io)                   |
| **Testing**       | [Newman](https://github.com/postmanlabs/newman) (Postman CLI) |

---

## Prerequisites

- **Node.js** ≥ 22.12
- **npm** ≥ 10
- **Postman** (optional — for manual API testing)
- A code editor (VS Code recommended)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and configure
cp .env.example .env

# 3. Build the project
npm run build

# 4. Start in development mode
npm run dev
```

The server starts on **`http://localhost:4000`**. You'll see seed users loaded into memory:

```
[Nest] INFO - Mock users loaded into memory
[Nest] INFO -   alice@ozmo.io / Password@123 (admin)
[Nest] INFO -   bob@ozmo.io / Password@123    (user)
```

---

## Environment Variables

| Variable                    | Default                                    | Description                          |
| --------------------------- | ------------------------------------------ | ------------------------------------ |
| `PORT`                      | `4000`                                     | Server port                          |
| `NODE_ENV`                  | `development`                              | Environment mode                     |
| `JWT_SECRET`                | *(auto-generated in .env.example)*         | JWT signing secret                   |
| `JWT_EXPIRES_IN`            | `15m`                                      | Access token expiry                  |
| `JWT_REFRESH_SECRET`        | *(auto-generated in .env.example)*         | Refresh token signing secret         |
| `JWT_REFRESH_EXPIRES`       | `7d`                                       | Refresh token expiry                 |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | `900000` (15 min)                         | Rate limit window (ms)               |
| `LOGIN_RATE_LIMIT_MAX`      | `5`                                        | Max login attempts per window        |

> **Note:** The `.env` file is gitignored. Use `.env.example` as a template. Generate strong JWT secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Available Scripts

```bash
# Development
npm run dev              # Start with hot-reload
npm run dev:debug        # Start with debugger + hot-reload

# Building
npm run build            # Compile TypeScript → JavaScript
npm run start            # Start production build
npm run start:prod       # Start production build (alias)

# Code Quality
npm run typecheck        # TypeScript type checking (no emit)
npm run lint             # ESLint across source files

# Testing
npm run test             # Unit tests (Vitest)
npm run test:watch       # Unit tests in watch mode
npm run test:coverage    # Unit tests with coverage report

# API Integration Tests (via Newman)
npm run test:api         # Run full API test suite
npm run test:api:quick   # Run API tests (faster, CLI only)
npm run test:api:ci      # Run API tests for CI (bail on failure, JUnit output)
npm run test:api:full    # Start server → run tests → stop (all-in-one)

# Utilities
npm run clean            # Remove dist/ directory
```

---

## Project Structure

```
ozmo-sync-api/
├── postman/                          # Postman collections & environments
│   ├── ozmo-sync-api-tests.postman_collection.json  # 70-test automated suite
│   └── ozmo-sync-api.environment.json               # Shared variables
├── reports/                          # Generated test reports (gitignored)
├── src/
│   ├── main.ts                       # Application entry point
│   ├── app.module.ts                 # Root module
│   ├── config/
│   │   └── configuration.ts          # Environment config loader
│   ├── common/                       # Shared infrastructure
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   │   │   ├── public.decorator.ts         # @Public() route marker
│   │   │   └── roles.decorator.ts          # @Roles('admin') access control
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts    # Global exception formatter
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts           # JWT authentication guard
│   │   │   └── roles.guard.ts              # Role-based authorization guard
│   │   └── interceptors/
│   │       └── response-transform.interceptor.ts  # Standard response wrapper
│   └── modules/
│       ├── auth/                      # Authentication module
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── dto/                   # Request validation schemas
│       │   │   ├── login.dto.ts
│       │   │   ├── register.dto.ts
│       │   │   ├── refresh-token.dto.ts
│       │   │   └── update-role.dto.ts
│       │   └── strategies/
│       │       └── jwt.strategy.ts    # Passport JWT strategy
│       ├── user/                      # User profile module
│       │   ├── user.controller.ts
│       │   └── user.module.ts
│       ├── users/                     # User data & repository
│       │   ├── users.service.ts
│       │   ├── users.module.ts
│       │   ├── interfaces/
│       │   │   ├── user.interface.ts
│       │   │   └── users-repository.interface.ts
│       │   └── repositories/
│       │       └── mock-users.repository.ts
│       ├── admin/                     # Admin operations module
│       │   ├── admin.controller.ts
│       │   ├── admin.service.ts
│       │   └── admin.module.ts
│       ├── health/                    # Health check module
│       │   ├── health.controller.ts
│       │   └── health.module.ts
│       └── common/                    # Shared module (fallback routes)
│           ├── common.module.ts
│           └── fallback.controller.ts
├── .env.example                      # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## API Reference

All responses follow a standard envelope format:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { "...": "..." },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

### 🩺 Health

#### `GET /health`

Check server status. *(No authentication required)*

**Response `200`:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "app": "ozmo-auth-api",
    "env": "development"
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

### 🔐 Authentication

Base path: `/api/v1/auth`

#### `POST /api/v1/auth/register`

Create a new user account. *(No authentication required)*

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secure@789"
}
```

| Field      | Rules                                              |
| ---------- | -------------------------------------------------- |
| `name`     | Required, 2–50 characters                          |
| `email`    | Required, valid email format                       |
| `password` | Required, min 8 chars, 1 uppercase, 1 number       |

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 3,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "createdAt": "2026-05-31T10:00:00.000Z"
    }
  }
}
```

**Error `409` — Duplicate email:**
```json
{
  "success": false,
  "message": "Email already in use",
  "timestamp": "..."
}
```

**Error `422` — Validation failed:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "password", "message": "Password must be at least 8 characters long and contain at least 1 uppercase letter and 1 number" }
  ],
  "timestamp": "..."
}
```

---

#### `POST /api/v1/auth/login`

Authenticate with email and password. *(No authentication required)*

**Request:**
```json
{
  "email": "alice@ozmo.io",
  "password": "Password@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "Alice Admin",
      "email": "alice@ozmo.io",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**Error `401` — Invalid credentials:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "timestamp": "..."
}
```

**Error `429` — Rate limited:**
```json
{
  "success": false,
  "message": "Too many authentication attempts — please try again in 15 minutes",
  "timestamp": "..."
}
```

---

#### `POST /api/v1/auth/refresh`

Obtain a new access token using a refresh token. *(No authentication required)*

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...(new)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...(new)",
    "user": { "...": "..." }
  }
}
```

**Error `401` — Invalid/expired refresh token:**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token",
  "timestamp": "..."
}
```

---

#### `POST /api/v1/auth/logout`

Invalidate the current session. *(Bearer token required)*

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {},
  "timestamp": "..."
}
```

---

### 👤 User Profile

#### `GET /api/v1/user/profile`

Get the authenticated user's profile. *(Bearer token required)*

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Alice Admin",
      "email": "alice@ozmo.io",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

> The `password` and `isBlocked` fields are always excluded from user responses.

---

### 🛡️ Admin

Base path: `/api/v1/admin` · *Admin role required*

#### `GET /api/v1/admin/users`

List all registered users.

**Response `200`:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      { "id": 1, "name": "Alice Admin", "email": "alice@ozmo.io", "role": "admin", "createdAt": "..." },
      { "id": 2, "name": "Bob User", "email": "bob@ozmo.io", "role": "user", "createdAt": "..." }
    ],
    "total": 2
  }
}
```

**Error `403` — Non-admin user:**
```json
{
  "success": false,
  "message": "Admin access required",
  "timestamp": "..."
}
```

---

#### `PATCH /api/v1/admin/users/:id/block`

Block a user account.

**Response `200`:**
```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": { "user": { "...": "..." } }
}
```

---

#### `PATCH /api/v1/admin/users/:id/unblock`

Unblock a user account.

**Response `200`:**
```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": { "user": { "...": "..." } }
}
```

---

#### `PATCH /api/v1/admin/users/:id/role`

Change a user's role.

**Request:**
```json
{
  "role": "admin"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": { "user": { "...": "..." } }
}
```

---

### ⚠️ Error Responses (All Endpoints)

| Status | Scenario                          | Message Pattern                                   |
| ------ | --------------------------------- | ------------------------------------------------- |
| `401`  | No token provided                 | `No token provided — Bearer <token> required`     |
| `401`  | Expired access token              | `Access token expired — please refresh`           |
| `401`  | Invalid credentials               | `Invalid email or password`                       |
| `403`  | Insufficient role                 | `Admin access required`                           |
| `404`  | Route not found                   | `Route GET /api/v1/auth/unknown not found`        |
| `409`  | Duplicate email on register       | `Email already in use`                            |
| `422`  | Request validation failed         | `Validation failed` + `errors: [{field, message}]`|
| `429`  | Rate limit exceeded               | `Too many authentication attempts...`             |

---

## Authentication Flow

```
┌──────┐          ┌──────────┐          ┌──────────┐
│Client│          │  Server  │          │  JWT     │
└──┬───┘          └────┬─────┘          └────┬─────┘
   │                    │                     │
   │  POST /auth/login  │                     │
   │───────────────────>│                     │
   │                    │  Verify credentials │
   │                    │────────────────────>│
   │                    │<────────────────────│
   │   200 {accessToken,│                     │
   │        refreshToken,│                    │
   │        user}       │                     │
   │<───────────────────│                     │
   │                    │                     │
   │  GET /user/profile │                     │
   │  Authorization:    │                     │
   │  Bearer <token>    │                     │
   │───────────────────>│                     │
   │                    │  Verify JWT         │
   │                    │────────────────────>│
   │                    │<────────────────────│
   │   200 {user}       │                     │
   │<───────────────────│                     │
   │                    │                     │
   │  POST /auth/refresh│                     │
   │  {refreshToken}    │                     │
   │───────────────────>│                     │
   │                    │  Verify refresh JWT │
   │                    │────────────────────>│
   │                    │<────────────────────│
   │   200 {newTokens}  │                     │
   │<───────────────────│                     │
```

- **Access tokens** expire in 15 minutes (configurable)
- **Refresh tokens** expire in 7 days (configurable)
- Tokens are **stateless** — stored client-side, verified via JWT signature
- Include the access token in the `Authorization: Bearer <token>` header for protected routes

---

## Seed Users

| Name          | Email                 | Password      | Role        | Notes             |
| ------------- | --------------------- | ------------- | ----------- | ----------------- |
| Alice Admin   | alice@ozmo.io         | Password@123  | `admin`     | Full admin access |
| Bob User      | bob@ozmo.io           | Password@123  | `user`      | Standard user     |

These users are loaded into memory when the server starts. Use them for development and testing.

---

## Testing

### Manual Testing with Postman

1. **Import the collection:** Postman → File → Import → `postman/ozmo-sync-api-tests.postman_collection.json`
2. **Import the environment:** Postman → Settings → Import → `postman/ozmo-sync-api.environment.json`
3. **Select environment:** Pick `ozmo-sync-api` from the environment dropdown (top-right)
4. **Run requests in order:**
   - Start with `🩺 Health` → `GET /health`
   - Then `🔐 Auth` → `Login — Alice (admin)` — tokens auto-saved
   - Then any protected request — token is passed automatically

The collection includes **Postman test scripts** that:
- Automatically save `accessToken` and `refreshToken` after login/register/refresh
- Validate every response shape (status code, body structure, field types)
- Test edge cases (validation, duplicate email, expired tokens)

---

### Automated Testing with Newman (CLI)

Run the entire 70-assertion test suite from the terminal:

```bash
# Start the server first (in another terminal)
npm run dev

# Then run the full API test suite
npm run test:api
```

Or run everything in one command:

```bash
npm run test:api:full
```

**What gets tested:**

| Category                  | Tests                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| **Health**                | Server up, response shape                                             |
| **Authentication**        | Register, login (admin + user), refresh, logout                       |
| **Profile**               | Get profile with valid token, no `isBlocked` leak                     |
| **Admin Operations**      | List users, block, unblock, change role                               |
| **Validation**            | Weak password, duplicate email, missing fields                        |
| **Error Handling**        | Wrong credentials, expired tokens, no auth, forbidden access          |
| **Security**              | SQL injection attempts, XSS attempts, 404 routes                      |

The test suite generates an **HTML report** at `reports/api-test-report.html` with a detailed breakdown:
```bash
npm run test:api         # generates HTML report
# Open reports/api-test-report.html in your browser
```

**CI integration:**
```bash
npm run test:api:ci       # JUnit XML output for CI pipelines
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [],
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

- **Validation errors** (422) include an `errors` array with `{field, message}` objects
- **Auth errors** (401) never reveal whether the email exists — just "Invalid email or password"
- **Blocked users** receive a 403 Forbidden on login
- A **global exception filter** catches unhandled errors and returns a safe 500 response

---

## Security

| Measure                 | Implementation                     |
| ----------------------- | ---------------------------------- |
| **HTTP Headers**        | Helmet.js (CSP, XSS, clickjacking) |
| **Password Hashing**    | bcryptjs with 12 salt rounds       |
| **JWT Authentication**  | Passport + JWT strategy            |
| **Rate Limiting**       | express-rate-limit (login endpoint)|
| **Role-Based Access**   | Custom `@Roles()` decorator + guard|
| **Input Validation**    | class-validator on all DTOs        |
| **Exception Safety**    | Global exception filter            |

---

## Rate Limiting

| Scope      | Window | Max Requests | Applied To          |
| ---------- | ------ | ------------ | ------------------- |
| **Global** | 15 min | 100          | All routes          |
| **Login**  | 15 min | 5            | `POST /auth/login`  |

The login rate limit is **per IP address**. Once exceeded, the client receives a `429 Too Many Requests` response with a `Retry-After` header.

---

## License

ISC © Ozmo Innovations
