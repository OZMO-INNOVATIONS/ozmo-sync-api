# 🔐 Ozmo Sync API

Production-style Node.js authentication REST API built with Express.js, JWT, and Clean Architecture — **no database required**.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
  - [Health Check](#1-health-check)
  - [Register](#2-register)
  - [Login](#3-login)
  - [Get Profile](#4-get-profile)
  - [Refresh Token](#5-refresh-token)
  - [Logout](#6-logout)
- [Error Responses](#-error-responses)
- [Seed Users](#-seed-users)

---

## 🛠 Tech Stack

| Technology         | Purpose                      |
| ------------------ | ---------------------------- |
| Node.js            | Runtime                      |
| Express.js         | Web framework                |
| JWT (jsonwebtoken) | Access & refresh tokens      |
| bcryptjs           | Password hashing             |
| express-validator  | Request validation           |
| helmet             | Security headers             |
| cors               | Cross-origin resource sharing|
| morgan             | HTTP request logging         |
| express-rate-limit | Brute-force protection       |
| dotenv             | Environment variable loading |
| uuid               | Unique ID generation         |
| nodemon            | Development auto-reload      |

---

## 📁 Project Structure

```
src/
 ├── config/
 │    └── env.js                   # Centralized dotenv configuration
 │
 ├── controllers/
 │    ├── authController.js        # Thin HTTP layer for auth
 │    └── userController.js        # Thin HTTP layer for users
 │
 ├── middleware/
 │    ├── authMiddleware.js        # JWT Bearer auth & RBAC guard
 │    ├── errorMiddleware.js       # Centralized 404 & global error handler
 │    └── validationMiddleware.js  # express-validator rule-sets
 │
 ├── routes/
 │    ├── authRoutes.js            # Public + protected auth routes
 │    └── userRoutes.js            # Protected user routes
 │
 ├── services/
 │    └── authService.js           # Core business logic layer
 │
 ├── repositories/
 │    └── userRepository.js        # Data persistence layer (JSON file)
 │
 ├── utils/
 │    ├── jwt.js                   # JWT sign & verify helpers
 │    ├── password.js              # bcrypt hash & compare helpers
 │    └── response.js              # Standardized API response envelope
 │
 ├── data/
 │    └── users.json               # JSON file storage (replaces DB)
 │
 ├── app.js                        # Express app factory
 └── server.js                     # HTTP server & graceful shutdown
```

---

## 🚀 Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/OZMO-INNOVATIONS/ozmo-sync-api.git
cd ozmo-sync-api

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. (Optional) Generate strong JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Paste the output into JWT_SECRET and JWT_REFRESH_SECRET in .env

# 5. Start development server (with auto-reload)
npm run dev

# 6. Start production server
npm start
```

The server will start at `http://localhost:4000`

---

## ⚙️ Environment Variables

| Variable               | Default          | Description                         |
| ---------------------- | ---------------- | ----------------------------------- |
| `NODE_ENV`             | `development`    | App environment                     |
| `PORT`                 | `4000`           | Server port                         |
| `APP_NAME`             | `ozmo-auth-api`  | Application name                    |
| `JWT_SECRET`           | **(required)**   | Secret key for access tokens        |
| `JWT_EXPIRES_IN`       | `15m`            | Access token expiry duration        |
| `JWT_REFRESH_SECRET`   | **(required)**   | Secret key for refresh tokens       |
| `JWT_REFRESH_EXPIRES`  | `7d`             | Refresh token expiry duration       |
| `BCRYPT_SALT_ROUNDS`   | `12`             | bcrypt hashing rounds               |
| `ALLOWED_ORIGINS`      | `localhost:3000`  | Comma-separated CORS origins       |
| `RATE_LIMIT_WINDOW_MS` | `900000`         | Rate limit window (15 min)          |
| `RATE_LIMIT_MAX`       | `100`            | Max requests per window             |

---

## 📖 API Documentation

**Base URL:** `http://localhost:4000`
**API Prefix:** `/api/v1`

### Response Envelope

All responses follow a consistent structure:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... },
  "timestamp": "2026-05-27T17:03:40.069Z"
}
```

---

### 1. Health Check

Check if the server is running.

**Endpoint:** `GET /health`
**Auth:** None

#### cURL

```bash
curl -X GET http://localhost:4000/health
```

#### Response — `200 OK`

```json
{
  "success": true,
  "message": "Service is healthy",
  "app": "ozmo-auth-api",
  "env": "development",
  "timestamp": "2026-05-27T17:04:09.338Z"
}
```

---

### 2. Register

Create a new user account and receive tokens.

**Endpoint:** `POST /api/v1/auth/register`
**Auth:** None

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

| Field      | Type   | Required | Validation                                         |
| ---------- | ------ | -------- | -------------------------------------------------- |
| `name`     | string | ✅       | 2–100 characters                                   |
| `email`    | string | ✅       | Valid email format                                  |
| `password` | string | ✅       | Min 8 chars, 1 uppercase letter, 1 number           |

```json
{
  "name": "Charlie New",
  "email": "charlie@ozmo.io",
  "password": "Secure@789"
}
```

#### cURL

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charlie New",
    "email": "charlie@ozmo.io",
    "password": "Secure@789"
  }'
```

#### Response — `201 Created`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c3bfdcf7-f528-45cb-80c7-590ecb3c3c46",
      "name": "Charlie New",
      "email": "charlie@ozmo.io",
      "role": "user",
      "createdAt": "2026-05-27T17:03:58.461Z"
    }
  },
  "timestamp": "2026-05-27T17:03:58.655Z"
}
```

#### Error — `409 Conflict` (Duplicate Email)

```json
{
  "success": false,
  "message": "Email already in use",
  "timestamp": "2026-05-27T17:05:00.000Z"
}
```

---

### 3. Login

Authenticate with email and password to receive tokens.

**Endpoint:** `POST /api/v1/auth/login`
**Auth:** None

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

| Field      | Type   | Required | Description     |
| ---------- | ------ | -------- | --------------- |
| `email`    | string | ✅       | Registered email|
| `password` | string | ✅       | User password   |

```json
{
  "email": "alice@ozmo.io",
  "password": "Password@123"
}
```

#### cURL

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@ozmo.io",
    "password": "Password@123"
  }'
```

#### Response — `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_001",
      "name": "Alice Admin",
      "email": "alice@ozmo.io",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2026-05-27T17:03:40.069Z"
}
```

#### Error — `401 Unauthorized`

```json
{
  "success": false,
  "message": "Invalid email or password",
  "timestamp": "2026-05-27T17:03:06.906Z"
}
```

---

### 4. Get Profile

Fetch the authenticated user's profile.

**Endpoint:** `GET /api/v1/user/profile`
**Auth:** 🔒 Bearer Token (required)

#### Request Headers

```
Authorization: Bearer <ACCESS_TOKEN>
```

#### cURL

```bash
curl -X GET http://localhost:4000/api/v1/user/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Response — `200 OK`

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "usr_001",
      "name": "Alice Admin",
      "email": "alice@ozmo.io",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2026-05-27T17:03:50.232Z"
}
```

#### Error — `401 Unauthorized` (Missing/Invalid Token)

```json
{
  "success": false,
  "message": "No token provided — Bearer <token> required",
  "timestamp": "2026-05-27T17:05:00.000Z"
}
```

#### Error — `401 Unauthorized` (Expired Token)

```json
{
  "success": false,
  "message": "Access token expired — please refresh",
  "timestamp": "2026-05-27T17:20:00.000Z"
}
```

---

### 5. Refresh Token

Exchange a valid refresh token for a new access + refresh token pair.

**Endpoint:** `POST /api/v1/auth/refresh`
**Auth:** None (uses refresh token in body)

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

| Field          | Type   | Required | Description                      |
| -------------- | ------ | -------- | -------------------------------- |
| `refreshToken` | string | ✅       | Refresh token from login/register|

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### cURL

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

#### Response — `200 OK`

```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
    "user": {
      "id": "usr_001",
      "name": "Alice Admin",
      "email": "alice@ozmo.io",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2026-05-27T17:10:00.000Z"
}
```

#### Error — `401 Unauthorized`

```json
{
  "success": false,
  "message": "Invalid or expired refresh token",
  "timestamp": "2026-05-27T17:10:00.000Z"
}
```

---

### 6. Logout

Invalidate the user's refresh token (server-side logout).

**Endpoint:** `POST /api/v1/auth/logout`
**Auth:** 🔒 Bearer Token (required)

#### Request Headers

```
Authorization: Bearer <ACCESS_TOKEN>
```

#### cURL

```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Response — `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {},
  "timestamp": "2026-05-27T17:15:00.000Z"
}
```

---

## ❌ Error Responses

### Validation Error — `422 Unprocessable Entity`

Returned when request body fails validation rules.

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    },
    {
      "field": "password",
      "message": "Password is required"
    }
  ],
  "timestamp": "2026-05-27T17:05:00.000Z"
}
```

### Not Found — `404 Not Found`

```json
{
  "success": false,
  "message": "Route GET /api/v1/unknown not found",
  "timestamp": "2026-05-27T17:05:00.000Z"
}
```

### Rate Limited — `429 Too Many Requests`

```json
{
  "success": false,
  "message": "Too many authentication attempts — please try again in 15 minutes",
  "timestamp": "2026-05-27T17:05:00.000Z"
}
```

### Server Error — `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Something went wrong",
  "timestamp": "2026-05-27T17:05:00.000Z"
}
```

---

## 👤 Seed Users

The project comes with two pre-seeded users in `src/data/users.json`.

| Name        | Email          | Password       | Role    |
| ----------- | -------------- | -------------- | ------- |
| Alice Admin | alice@ozmo.io  | `Password@123` | `admin` |
| Bob User    | bob@ozmo.io    | `Password@123` | `user`  |

---

## 📝 HTTP Status Codes Reference

| Code | Meaning                 | Used For                          |
| ---- | ----------------------- | --------------------------------- |
| 200  | OK                      | Successful read/update/delete     |
| 201  | Created                 | Successful resource creation      |
| 401  | Unauthorized            | Invalid/missing/expired token     |
| 403  | Forbidden               | Insufficient role permissions     |
| 404  | Not Found               | Route or resource does not exist  |
| 409  | Conflict                | Duplicate email on registration   |
| 413  | Payload Too Large       | Request body exceeds 10kb limit   |
| 422  | Unprocessable Entity    | Request validation failed         |
| 429  | Too Many Requests       | Rate limit exceeded               |
| 500  | Internal Server Error   | Unexpected server failure         |

---

## 📄 License

UNLICENSED — © OZMO-INNOVATIONS
