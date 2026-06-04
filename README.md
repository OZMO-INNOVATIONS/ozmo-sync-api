# OZMO SYNC API

Enterprise-grade Staff Management & Attendance Tracking REST API built with **NestJS + TypeScript**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Roles & Permissions](#roles--permissions)
- [API Documentation](#api-documentation)
  - [Response Envelope](#response-envelope)
  - [Endpoint Overview](#endpoint-overview)
  - [Authentication](#authentication)
    - [Register](#register)
    - [Login](#login)
    - [Refresh Token](#refresh-token)
    - [Logout](#logout)
  - [Profile](#profile)
    - [Get Own Profile](#get-own-profile)
    - [Update Own Profile](#update-own-profile)
    - [List All Users](#list-all-users)
    - [Get User by ID](#get-user-by-id)
    - [Delete User](#delete-user)
  - [Attendance](#attendance)
    - [Check In](#check-in)
    - [Check Out](#check-out)
    - [Get My Attendance](#get-my-attendance)
    - [Get Attendance Dashboard](#get-attendance-dashboard)
    - [Get Attendance for a User](#get-attendance-for-a-user)
  - [Staff Management](#staff-management)
    - [Create Staff Member](#create-staff-member)
    - [List All Staff](#list-all-staff)
    - [Search Staff](#search-staff)
    - [Filter Staff](#filter-staff)
    - [Get Staff by ID](#get-staff-by-id)
    - [Update Staff](#update-staff)
    - [Delete Staff](#delete-staff)
  - [Workspaces](#workspaces)
    - [Get Workspace Details](#get-workspace-details)
- [Error Responses](#error-responses)
- [HTTP Status Codes](#http-status-codes)

---

## Tech Stack

| Technology        | Purpose                            |
| ----------------- | ---------------------------------- |
| NestJS 10         | Web framework                      |
| TypeScript 5      | Type safety                        |
| @nestjs/passport  | JWT authentication strategy        |
| @nestjs/jwt       | JWT signing & verification         |
| passport-jwt      | Passport JWT strategy              |
| class-validator   | DTO validation                     |
| class-transformer | Request body transformation        |
| bcryptjs          | Password & refresh token hashing   |
| uuid              | Unique ID generation               |
| @nestjs/config    | Environment variable management    |
| jsonwebtoken      | Refresh token signing              |

---

## Project Structure

```
src/
├── main.ts                              # Bootstrap — global prefix, versioning, pipes, filters
├── app.module.ts
│
├── common/
│   ├── constants/roles.enum.ts          # Role enum, UserStatus enum
│   ├── decorators/
│   │   ├── roles.decorator.ts           # @Roles(...roles) via SetMetadata
│   │   └── current-user.decorator.ts    # @CurrentUser() param decorator
│   ├── guards/
│   │   ├── jwt-auth.guard.ts            # Thin AuthGuard('jwt') wrapper
│   │   └── roles.guard.ts              # Reflector-based RBAC
│   ├── interceptors/
│   │   └── response.interceptor.ts     # Wraps success → { success, message, data, timestamp }
│   ├── filters/
│   │   └── http-exception.filter.ts    # Wraps errors → { success: false, message, timestamp }
│   └── interfaces/
│       ├── jwt-payload.interface.ts
│       ├── request-user.interface.ts
│       └── api-response.interface.ts
│
├── repositories/                        # Phase 1: injectable in-memory Map stores
│   ├── user.repository.ts
│   ├── attendance.repository.ts
│   └── staff-profile.repository.ts
│
├── auth/                                # register, login, refresh, logout
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/jwt.strategy.ts
│   └── dto/
│       ├── register.dto.ts
│       ├── login.dto.ts
│       └── refresh-token.dto.ts
│
├── profile/                             # Own profile + admin user management
│   ├── profile.module.ts
│   ├── profile.controller.ts
│   ├── profile.service.ts
│   └── dto/update-profile.dto.ts
│
├── attendance/                          # Check-in/out, history, dashboard
│   ├── attendance.module.ts
│   ├── attendance.controller.ts
│   ├── attendance.service.ts
│   └── dto/
│       ├── check-in.dto.ts
│       └── attendance-query.dto.ts
│
└── staff/                               # HR staff CRUD, search, filter
    ├── staff.module.ts
    ├── staff.controller.ts
    ├── staff.service.ts
    └── dto/
        ├── create-staff.dto.ts
        ├── update-staff.dto.ts
        └── staff-filter.dto.ts

prisma/
└── schema.prisma                        # Phase 3: PostgreSQL schema (ready, not yet wired)
```

---

## Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/OZMO-INNOVATIONS/ozmo-sync-api.git
cd ozmo-sync-api

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Generate strong JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — paste one value into JWT_SECRET, the other into JWT_REFRESH_SECRET

# 5. Start development server (auto-reload)
npm run start:dev

# 6. Build for production
npm run build

# 7. Start production server
npm start
```

Server starts at `http://localhost:4000/api/v1`

---

## Environment Variables

| Variable              | Default                 | Description                       |
| --------------------- | ----------------------- | --------------------------------- |
| `NODE_ENV`            | `development`           | App environment                   |
| `PORT`                | `4000`                  | Server port                       |
| `JWT_SECRET`          | **(required)**          | Secret key for access tokens      |
| `JWT_EXPIRES_IN`      | `15m`                   | Access token TTL                  |
| `JWT_REFRESH_SECRET`  | **(required)**          | Secret key for refresh tokens     |
| `JWT_REFRESH_EXPIRES` | `7d`                    | Refresh token TTL                 |
| `BCRYPT_SALT_ROUNDS`  | `12`                    | bcrypt hashing cost factor        |
| `ALLOWED_ORIGINS`     | `http://localhost:3000` | Comma-separated CORS origins      |
| `DATABASE_URL`        | —                       | PostgreSQL connection (Phase 3)   |

---

## Roles & Permissions

| Role          | Description                               |
| ------------- | ----------------------------------------- |
| `SUPER_ADMIN` | Full system access                        |
| `ADMIN`       | User & staff management, full attendance  |
| `HR`          | Staff CRUD, attendance reporting          |
| `MANAGER`     | View staff lists and attendance           |
| `TEAM_LEAD`   | Attendance check-in/out, view own team    |
| `STAFF`       | Own attendance only                       |
| `GUEST`       | Read-only (reserved)                      |

RBAC is enforced via `@Roles()` decorator + `RolesGuard` at the controller level. Public routes (register, login, refresh) require no token.

---

## API Documentation

**Base URL:** `http://localhost:4000/api/v1`

---

### Response Envelope

All responses share the same structure.

**Success**
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {},
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

**Error**
```json
{
  "success": false,
  "message": "Human-readable error",
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

### Endpoint Overview

| Method   | Endpoint                        | Auth        | Roles                              |
| -------- | ------------------------------- | ----------- | ---------------------------------- |
| `POST`   | `/auth/register`                | None        | —                                  |
| `POST`   | `/auth/login`                   | None        | —                                  |
| `POST`   | `/auth/refresh`                 | None        | —                                  |
| `POST`   | `/auth/logout`                  | JWT         | Any                                |
| `GET`    | `/profile`                      | JWT         | Any                                |
| `PUT`    | `/profile`                      | JWT         | Any                                |
| `GET`    | `/users`                        | JWT + Roles | `ADMIN` `HR` `MANAGER`             |
| `GET`    | `/users/:id`                    | JWT + Roles | `ADMIN` `HR` `MANAGER`             |
| `DELETE` | `/users/:id`                    | JWT + Roles | `ADMIN`                            |
| `POST`   | `/attendance/check-in`          | JWT + Roles | `STAFF` `TEAM_LEAD`                |
| `POST`   | `/attendance/check-out`         | JWT + Roles | `STAFF` `TEAM_LEAD`                |
| `GET`    | `/attendance/my`                | JWT         | Any                                |
| `GET`    | `/attendance/dashboard`         | JWT + Roles | `ADMIN` `HR` `MANAGER`             |
| `GET`    | `/attendance/:userId`           | JWT + Roles | `ADMIN` `HR` `MANAGER`             |
| `POST`   | `/staff`                        | JWT + Roles | `ADMIN` `HR`                       |
| `GET`    | `/staff`                        | JWT + Roles | `ADMIN` `HR` `MANAGER`             |
| `GET`    | `/staff/search?q=`              | JWT + Roles | `ADMIN` `HR` `MANAGER`             |
| `GET`    | `/staff/filter`                 | JWT + Roles | `ADMIN` `HR` `MANAGER`             |
| `GET`    | `/staff/:id`                    | JWT + Roles | `ADMIN` `HR` `MANAGER` `TEAM_LEAD` |
| `PUT`    | `/staff/:id`                    | JWT + Roles | `ADMIN` `HR`                       |
| `DELETE` | `/staff/:id`                    | JWT + Roles | `ADMIN`                            |
| `GET`    | `/workspaces/my-workspace`      | JWT + Roles | `ADMIN` `SUPER_ADMIN`              |

---

### Authentication

#### Register

Create a new account and receive a token pair. `employeeId` is auto-generated in the format `OZ-{year}-{count}`.

**`POST /api/v1/auth/register`** — Auth: None

##### Request Body

| Field | Type | Required | Validation / Description |
| ------------- | ------ | :------: | --------------------------------------------- |
| `fullName` | string | No | 2–100 characters. If provided, splits into firstName & lastName. |
| `firstName` | string | No | 2–50 characters. |
| `lastName` | string | No | 2–50 characters. |
| `email` | string | Yes | Valid email, normalized to lowercase |
| `password` | string | Yes | Min 8 chars, at least 1 uppercase, 1 digit |
| `phone` | string | No | |
| `role` | enum | No | Role enum value (default: `ADMIN`) |
| `designation` | string | No | |
| `department` | string | No | |
| `workspaceName` | string | Yes | Max 100 characters. |
| `companyName` | string | No | Max 255 characters. |
| `logo` | string | No | Logo image URL. |
| `businessType` | string | No | Max 100 characters. |
| `industryType` | string | No | Max 100 characters. |
| `companySize` | string | No | Max 50 characters. |
| `country` | string | No | Max 100 characters. |
| `website` | string | No | Max 255 characters. |
| `companyEmail` | string | No | Valid email address. |
| `companyPhone` | string | No | Max 50 characters. |
| `companyAddress` | string | No | Street address. |
| `companyDescription` | string | No | Business description. |
| `attendanceMethod` | string | No | e.g. `RFID`, `BIOMETRIC`, `MOBILE`. |
| `defaultWorkingHours` | string | No | e.g. `9:00 AM - 6:00 PM`. |
| `weekendDays` | array | No | String array of weekend days. |
| `leavePolicy` | string | No | Policy text. |
| `notifications` | object | No | Object containing alert setting overrides: `pushNotifications`, `attendanceAlerts`, `leaveAlerts`, `taskAlerts`, `birthdayAlerts`. |

```json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@ozmo.io",
  "password": "Secure@789",
  "phone": "+1234567890",
  "workspaceName": "Ozmo Engineering",
  "companyName": "Ozmo Innovations Inc.",
  "logo": "https://example.com/logo.png",
  "businessType": "Software Service",
  "industryType": "Technology",
  "companySize": "10-49",
  "country": "Singapore",
  "website": "https://ozmo.io",
  "companyEmail": "contact@ozmo.io",
  "companyPhone": "+6512345678",
  "companyAddress": "123 Technology Way",
  "companyDescription": "Building Enterprise Workforce Software",
  "attendanceMethod": "BIOMETRIC",
  "defaultWorkingHours": "9:00 AM - 6:00 PM",
  "weekendDays": ["Saturday", "Sunday"],
  "leavePolicy": "14 days annual leave",
  "notifications": {
    "pushNotifications": true,
    "attendanceAlerts": false,
    "leaveAlerts": true,
    "taskAlerts": false,
    "birthdayAlerts": true
  }
}
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "3f2e1a4b-...",
      "employeeId": "OZ-2026-0001",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@ozmo.io",
      "role": "ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-05-31T10:00:00.000Z"
    },
    "workspace": {
      "id": "7b2e1a4b-...",
      "name": "Ozmo Engineering",
      "plan": "FREE",
      "isActive": true,
      "memberCount": 1,
      "adminEmail": "jane.smith@ozmo.io",
      "logoUrl": "https://example.com/logo.png",
      "companyName": "Ozmo Innovations Inc.",
      "businessType": "Software Service",
      "industryType": "Technology",
      "companySize": "10-49",
      "country": "Singapore",
      "website": "https://ozmo.io",
      "companyEmail": "contact@ozmo.io",
      "companyPhone": "+6512345678",
      "companyAddress": "123 Technology Way",
      "companyDescription": "Building Enterprise Workforce Software",
      "attendanceMethod": "BIOMETRIC",
      "defaultWorkingHours": "9:00 AM - 6:00 PM",
      "weekendDays": ["Saturday", "Sunday"],
      "leavePolicy": "14 days annual leave",
      "pushNotifications": true,
      "attendanceAlerts": false,
      "leaveAlerts": true,
      "taskAlerts": false,
      "birthdayAlerts": true,
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane.smith@ozmo.io",
    "password": "Secure@789",
    "workspaceName": "Ozmo Engineering"
  }'
```

---

#### Login

Authenticate with **email** or **employeeId** plus password.

**`POST /api/v1/auth/login`** — Auth: None

##### Request Body

| Field        | Type   | Required         | Description                        |
| ------------ | ------ | :--------------: | ---------------------------------- |
| `email`      | string | One of these two | Registered email address           |
| `employeeId` | string | One of these two | e.g. `OZ-2026-0001`               |
| `password`   | string | Yes              | Account password                   |

```json
{
  "email": "jane.smith@ozmo.io",
  "password": "Secure@789"
}
```

```json
{
  "employeeId": "OZ-2026-0001",
  "password": "Secure@789"
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "3f2e1a4b-...",
      "employeeId": "OZ-2026-0001",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@ozmo.io",
      "role": "STAFF",
      "status": "ACTIVE"
    }
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane.smith@ozmo.io","password":"Secure@789"}'
```

---

#### Refresh Token

Exchange a valid refresh token for a new access + refresh pair. The used token is immediately invalidated (rotation).

**`POST /api/v1/auth/refresh`** — Auth: None

##### Request Body

| Field          | Type   | Required | Description         |
| -------------- | ------ | :------: | ------------------- |
| `refreshToken` | string | Yes      | Valid refresh token |

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
    "user": { "id": "3f2e1a4b-...", "email": "jane.smith@ozmo.io" }
  },
  "timestamp": "2026-05-31T10:05:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

---

#### Logout

Invalidate the server-side refresh token.

**`POST /api/v1/auth/logout`** — Auth: Bearer token

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {},
  "timestamp": "2026-05-31T10:10:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Profile

#### Get Own Profile

**`GET /api/v1/profile`** — Auth: Bearer token | Roles: Any

```bash
curl http://localhost:4000/api/v1/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "3f2e1a4b-...",
    "employeeId": "OZ-2026-0001",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@ozmo.io",
    "role": "STAFF",
    "department": "Engineering",
    "status": "ACTIVE",
    "createdAt": "2026-05-31T10:00:00.000Z"
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Update Own Profile

**`PUT /api/v1/profile`** — Auth: Bearer token | Roles: Any

All fields are optional. Email, password, and role cannot be changed here.

##### Request Body

| Field         | Type   | Validation  |
| ------------- | ------ | ----------- |
| `firstName`   | string | 2–50 chars  |
| `lastName`    | string | 2–50 chars  |
| `phone`       | string |             |
| `designation` | string |             |
| `department`  | string |             |

```json
{
  "phone": "+60123456789",
  "department": "Product"
}
```

```bash
curl -X PUT http://localhost:4000/api/v1/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+60123456789","department":"Product"}'
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "id": "3f2e1a4b-...", "phone": "+60123456789", "department": "Product" },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### List All Users

**`GET /api/v1/users`** — Auth: Bearer token | Roles: `ADMIN` `HR` `MANAGER`

```bash
curl http://localhost:4000/api/v1/users \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "...",
      "employeeId": "OZ-2026-0001",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "STAFF",
      "status": "ACTIVE"
    }
  ],
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Get User by ID

**`GET /api/v1/users/:id`** — Auth: Bearer token | Roles: `ADMIN` `HR` `MANAGER`

```bash
curl http://localhost:4000/api/v1/users/3f2e1a4b-... \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Delete User

**`DELETE /api/v1/users/:id`** — Auth: Bearer token | Roles: `ADMIN`

Note: Cannot delete your own account (returns `403`).

```bash
curl -X DELETE http://localhost:4000/api/v1/users/3f2e1a4b-... \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {},
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

### Attendance

#### Check In

**`POST /api/v1/attendance/check-in`** — Auth: Bearer token | Roles: `STAFF` `TEAM_LEAD`

Returns `409 Conflict` if already checked in without checking out.

##### Request Body (all optional)

| Field         | Type   | Description                                    |
| ------------- | ------ | ---------------------------------------------- |
| `checkInTime` | string | ISO 8601 datetime. Defaults to server `NOW()`  |
| `notes`       | string | Optional note                                  |

```json
{
  "notes": "Working from home today"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/attendance/check-in \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Working from home today"}'
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Check-in recorded",
  "data": {
    "id": "a1b2c3d4-...",
    "userId": "3f2e1a4b-...",
    "checkInTime": "2026-05-31T09:00:00.000Z",
    "checkOutTime": null,
    "notes": "Working from home today"
  },
  "timestamp": "2026-05-31T09:00:00.000Z"
}
```

---

#### Check Out

**`POST /api/v1/attendance/check-out`** — Auth: Bearer token | Roles: `STAFF` `TEAM_LEAD`

Returns `404` if no open check-in exists.

```bash
curl -X POST http://localhost:4000/api/v1/attendance/check-out \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Check-out recorded",
  "data": {
    "id": "a1b2c3d4-...",
    "checkInTime": "2026-05-31T09:00:00.000Z",
    "checkOutTime": "2026-05-31T17:30:00.000Z",
    "durationMinutes": 510
  },
  "timestamp": "2026-05-31T17:30:00.000Z"
}
```

---

#### Get My Attendance

**`GET /api/v1/attendance/my`** — Auth: Bearer token | Roles: Any

##### Query Parameters (all optional)

| Param   | Format       | Example            | Description           |
| ------- | ------------ | ------------------ | --------------------- |
| `date`  | `YYYY-MM-DD` | `?date=2026-05-31` | Single day            |
| `week`  | `YYYY-WNN`   | `?week=2026-W22`   | ISO calendar week     |
| `month` | `YYYY-MM`    | `?month=2026-05`   | Full month            |
| `from`  | `YYYY-MM-DD` | `?from=2026-05-01` | Start of custom range |
| `to`    | `YYYY-MM-DD` | `?to=2026-05-31`   | End of custom range   |

```bash
curl "http://localhost:4000/api/v1/attendance/my?month=2026-05" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Attendance fetched",
  "data": [
    {
      "id": "a1b2c3d4-...",
      "checkInTime": "2026-05-31T09:00:00.000Z",
      "checkOutTime": "2026-05-31T17:30:00.000Z",
      "durationMinutes": 510,
      "notes": null
    }
  ],
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Get Attendance Dashboard

**`GET /api/v1/attendance/dashboard`** — Auth: Bearer token | Roles: `ADMIN` `HR` `MANAGER`

Returns aggregated presence stats for all staff. Accepts the same query params as `/attendance/my`. Defaults to today if no query is provided.

```bash
curl "http://localhost:4000/api/v1/attendance/dashboard?date=2026-05-31" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Dashboard data fetched",
  "data": {
    "date": "2026-05-31",
    "summary": { "present": 18, "absent": 4, "late": 2 },
    "records": [
      {
        "userId": "...",
        "employeeId": "OZ-2026-0001",
        "firstName": "Jane",
        "checkInTime": "2026-05-31T09:00:00.000Z"
      }
    ]
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Get Attendance for a User

**`GET /api/v1/attendance/:userId`** — Auth: Bearer token | Roles: `ADMIN` `HR` `MANAGER`

Accepts the same query parameters as `/attendance/my`.

```bash
curl "http://localhost:4000/api/v1/attendance/3f2e1a4b-...?month=2026-05" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Staff Management

#### Create Staff Member

**`POST /api/v1/staff`** — Auth: Bearer token | Roles: `ADMIN` `HR`

##### Request Body

| Field         | Type   | Required | Validation                                 |
| ------------- | ------ | :------: | ------------------------------------------ |
| `firstName`   | string | Yes      | 2–50 characters                            |
| `lastName`    | string | Yes      | 2–50 characters                            |
| `email`       | string | Yes      | Valid email, normalized to lowercase       |
| `password`    | string | Yes      | Min 8 chars, at least 1 uppercase, 1 digit |
| `role`        | enum   | Yes      | Role enum value                            |
| `phone`       | string | No       |                                            |
| `designation` | string | No       |                                            |
| `department`  | string | No       |                                            |
| `joiningDate` | string | No       | ISO 8601 date                              |

```json
{
  "firstName": "Ahmad",
  "lastName": "Razif",
  "email": "ahmad.razif@ozmo.io",
  "password": "Welcome@123",
  "role": "MANAGER",
  "department": "Operations",
  "joiningDate": "2026-06-01"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/staff \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ahmad",
    "lastName": "Razif",
    "email": "ahmad.razif@ozmo.io",
    "password": "Welcome@123",
    "role": "MANAGER",
    "department": "Operations"
  }'
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Staff member created",
  "data": {
    "id": "...",
    "employeeId": "OZ-2026-0002",
    "firstName": "Ahmad",
    "lastName": "Razif",
    "email": "ahmad.razif@ozmo.io",
    "role": "MANAGER",
    "department": "Operations",
    "status": "ACTIVE"
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### List All Staff

**`GET /api/v1/staff`** — Auth: Bearer token | Roles: `ADMIN` `HR` `MANAGER`

```bash
curl http://localhost:4000/api/v1/staff \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Search Staff

**`GET /api/v1/staff/search?q=`** — Auth: Bearer token | Roles: `ADMIN` `HR` `MANAGER`

Searches across `firstName`, `lastName`, `email`, `employeeId`, and `department`.

| Param | Type   | Required | Description    |
| ----- | ------ | :------: | -------------- |
| `q`   | string | Yes      | Search keyword |

```bash
curl "http://localhost:4000/api/v1/staff/search?q=ahmad" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Search results",
  "data": [
    {
      "employeeId": "OZ-2026-0002",
      "firstName": "Ahmad",
      "lastName": "Razif",
      "department": "Operations",
      "status": "ACTIVE"
    }
  ],
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Filter Staff

**`GET /api/v1/staff/filter`** — Auth: Bearer token | Roles: `ADMIN` `HR` `MANAGER`

| Param        | Type   | Values                                                       |
| ------------ | ------ | ------------------------------------------------------------ |
| `department` | string | Any string                                                   |
| `status`     | enum   | `ACTIVE` `INACTIVE` `RESIGNED` `TERMINATED`                  |
| `role`       | enum   | `SUPER_ADMIN` `ADMIN` `HR` `MANAGER` `TEAM_LEAD` `STAFF` `GUEST` |

```bash
curl "http://localhost:4000/api/v1/staff/filter?department=Engineering&status=ACTIVE" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Get Staff by ID

**`GET /api/v1/staff/:id`** — Auth: Bearer token | Roles: `ADMIN` `HR` `MANAGER` `TEAM_LEAD`

```bash
curl http://localhost:4000/api/v1/staff/3f2e1a4b-... \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Update Staff

**`PUT /api/v1/staff/:id`** — Auth: Bearer token | Roles: `ADMIN` `HR`

All fields are optional. Accepts the same fields as [Create Staff Member](#create-staff-member) plus `status`.

| Field    | Type | Values                                        |
| -------- | ---- | --------------------------------------------- |
| `status` | enum | `ACTIVE` `INACTIVE` `RESIGNED` `TERMINATED`   |

```json
{
  "designation": "Senior Engineer",
  "status": "INACTIVE"
}
```

```bash
curl -X PUT http://localhost:4000/api/v1/staff/3f2e1a4b-... \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"designation":"Senior Engineer","status":"INACTIVE"}'
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Staff member updated",
  "data": { "id": "...", "designation": "Senior Engineer", "status": "INACTIVE" },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Delete Staff

**`DELETE /api/v1/staff/:id`** — Auth: Bearer token | Roles: `ADMIN`

Note: Cannot delete your own account (returns `403`).

```bash
curl -X DELETE http://localhost:4000/api/v1/staff/3f2e1a4b-... \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Staff member deleted",
  "data": {},
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

### Workspaces

#### Get Workspace Details

Retrieve the workspace details for the authenticated administrator, including associated staff, attendance records, and leave data.

**`GET /api/v1/workspaces/my-workspace`** — Auth: Bearer token | Roles: `ADMIN`, `SUPER_ADMIN`

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Workspace details with associated data retrieved successfully",
  "data": {
    "workspace": {
      "id": "a2a03efe-5da3-4125-aade-3a0e9568f612",
      "name": "Ozmo Engineering",
      "plan": "FREE",
      "isActive": true,
      "memberCount": 1,
      "adminEmail": "jane.smith@ozmo.io",
      "logoUrl": "https://example.com/logo.png",
      "createdAt": "2026-06-04T06:07:14.662Z",
      "updatedAt": "2026-06-04T06:07:14.662Z",
      "companyName": "Ozmo Innovations Inc.",
      "businessType": "Software Service",
      "industryType": "Technology",
      "companySize": "10-49",
      "country": "Singapore",
      "website": "https://ozmo.io",
      "companyEmail": "contact@ozmo.io",
      "companyPhone": "+6512345678",
      "companyAddress": "123 Technology Way",
      "companyDescription": "Building Enterprise Workforce Software",
      "attendanceMethod": "BIOMETRIC",
      "defaultWorkingHours": "9:00 AM - 6:00 PM",
      "weekendDays": ["Saturday", "Sunday"],
      "leavePolicy": "14 days annual leave",
      "pushNotifications": true,
      "attendanceAlerts": false,
      "leaveAlerts": true,
      "taskAlerts": false,
      "birthdayAlerts": true
    },
    "staff": [
      {
        "id": "1572d211-145e-47e7-bd3f-57861092af4e",
        "employeeId": "OZ-2026-0005",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@ozmo.io",
        "phone": "+1234567890",
        "role": "ADMIN",
        "status": "ACTIVE",
        "createdAt": "2026-06-04T06:07:15.409Z"
      }
    ],
    "attendance": [
      {
        "id": "848243be-e260-449e-8798-e7c6b5a3ab11",
        "userId": "1572d211-145e-47e7-bd3f-57861092af4e",
        "checkInTime": "2026-06-04T06:10:00.000Z",
        "checkOutTime": "2026-06-04T14:10:00.000Z",
        "notes": "Remote work",
        "createdAt": "2026-06-04T06:10:00.000Z"
      }
    ],
    "leaves": []
  },
  "timestamp": "2026-06-04T06:07:16.970Z"
}
```

```bash
curl http://localhost:4000/api/v1/workspaces/my-workspace \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## Error Responses

### Validation Error — `400 Bad Request`

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "email must be an email" },
    { "field": "password", "message": "password must contain at least one uppercase letter" }
  ],
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

### Unauthorized — `401 Unauthorized`

```json
{
  "success": false,
  "message": "Unauthorized",
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

### Forbidden — `403 Forbidden`

```json
{
  "success": false,
  "message": "Role 'STAFF' is not permitted to access this resource",
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

### Not Found — `404 Not Found`

```json
{
  "success": false,
  "message": "Staff member not found",
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

### Conflict — `409 Conflict`

```json
{
  "success": false,
  "message": "Already checked in — please check out first",
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

### Server Error — `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Internal server error",
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

## HTTP Status Codes

| Code | Meaning               | Used For                                       |
| ---- | --------------------- | ---------------------------------------------- |
| 200  | OK                    | Successful read, update, logout, check-out     |
| 201  | Created               | Register, check-in, staff create               |
| 400  | Bad Request           | Validation errors, missing required fields     |
| 401  | Unauthorized          | Missing, invalid, or expired token             |
| 403  | Forbidden             | Insufficient role, or self-delete attempt      |
| 404  | Not Found             | Resource does not exist                        |
| 409  | Conflict              | Duplicate email, double check-in               |
| 500  | Internal Server Error | Unexpected server failure                      |

---

## License

UNLICENSED — © OZMO-INNOVATIONS
