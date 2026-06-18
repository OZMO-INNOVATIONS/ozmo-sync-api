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
  - [Date & Time Formatting](#date--time-formatting)
  - [Endpoint Overview](#endpoint-overview)
  - [Authentication](#authentication)
    - [Register](#register)
    - [Login](#login)
    - [Refresh Token](#refresh-token)
    - [Logout](#logout)
    - [Change Initial Password](#change-initial-password)
    - [Change Password](#change-password)
    - [Forgot Password](#forgot-password)
    - [Reset Password](#reset-password)
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
  - [Dashboard](#dashboard)
    - [Get Admin Dashboard](#get-admin-dashboard)
    - [Get Staff Dashboard](#get-staff-dashboard)
  - [Meetings](#meetings)
    - [Fetch All Meetings](#fetch-all-meetings)
    - [Create Meeting](#create-meeting)
  - [Leave Management](#leave-management)
    - [Fetch All Leaves](#fetch-all-leaves)
    - [Submit Leave Request](#submit-leave-request)
    - [Update Leave Status](#update-leave-status)
  - [Document Management](#document-management)
    - [Admin: Get All Documents](#admin-get-all-documents)
    - [Admin: Get Update Requests](#admin-get-update-requests)
    - [Admin: Approve Document](#admin-approve-document)
    - [Admin: Reject Document](#admin-reject-document)
    - [Admin: Request Reupload](#admin-request-reupload)
    - [Admin: Approve Update Request](#admin-approve-update-request)
    - [Admin: Reject Update Request](#admin-reject-update-request)
    - [Employee: Upload Document](#employee-upload-document)
    - [Employee: Get My Documents](#employee-get-my-documents)
    - [Employee: Submit Update Request](#employee-submit-update-request)
    - [Employee: Get My Update Requests](#employee-get-my-update-requests)
  - [Chat & Collaboration](#chat--collaboration)
    - [Create Channel](#create-channel)
    - [Get Channels](#get-channels)
    - [Get Channel Details](#get-channel-details)
    - [Update Channel](#update-channel)
    - [Delete Channel](#delete-channel)
    - [Add Channel Members](#add-channel-members)
    - [Remove Channel Member](#remove-channel-member)
    - [Send Message](#send-message)
    - [Update Message](#update-message)
    - [Delete Message](#delete-message)
    - [Get Channel Messages](#get-channel-messages)
    - [Mark Message as Read](#mark-message-as-read)
    - [Get Unread Message Count](#get-unread-message-count)
    - [Search Messages](#search-messages)
    - [Get Chat Notifications](#get-chat-notifications)
- [Error Responses](#error-responses)
- [HTTP Status Codes](#http-status-codes)

---

## Tech Stack

| Technology        | Purpose                            |
| ----------------- | ---------------------------------- |
| NestJS 10         | Web framework                      |
| TypeScript 5      | Type safety                        |
| Prisma ORM        | Database client & migrations       |
| PostgreSQL        | Database storage                   |
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

## Database Architecture

OZMO SYNC uses a strictly separated schema structure mapping to a multi-tenant PostgreSQL database:
- **`workspaces` table**: Stores multiple workspace profiles (such as code, slug, name, etc.).
- **`users` table**: Handles core identity, credentials, roles, and status. Reusable profile fields (address, emergency contact, bio, etc.) are consolidated directly onto this table to support clean query scopes while preserving backward compatibility.
- **`workspace_members` table**: Joins users and workspaces in a many-to-many relationship, defining workspace-specific roles, designations, departments, reporting manager links, and joining dates.
- **Enterprise Modules**: Additional models mapped for Leave Management (`leave_types`, `leave_requests`, `leave_balances`), Projects (`projects`, `project_members`, `tasks`), and `notifications`, strictly isolated using workspace IDs.

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
├── repositories/                        # Database repositories using Prisma ORM
│   ├── user.repository.ts
│   └── attendance.repository.ts
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
└── schema.prisma                        # Prisma schema defining the database models
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
| `DATABASE_URL`        | —                       | PostgreSQL connection string      |

---

## Roles & Permissions

| Role          | Description                               |
| ------------- | ----------------------------------------- |
| `SUPER_ADMIN` | Platform Administrator                    |
| `ADMIN`       | Workspace Administrator                   |
| `HR`          | Human Resources                           |
| `TEAM_LEAD`   | Team Leader                               |
| `STAFF`       | Standard Employee                         |

RBAC is enforced via `@Roles()` decorator + `RolesGuard` at the controller level. Public routes (register, login, refresh) require no token.

---

## API Documentation

**Base URL:** 
- Local: `http://localhost:4000/api/v1`
- Live: `https://ozmo-sync-api.onrender.com/api/v1`

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
  "timestamp": "2026-05-31T10:00:00.000Z",
  "errorCode": "ERROR_CODE_STRING"
}
```

#### Duplicate Request Protection
All write operations (`POST`, `PUT`, `DELETE`, `PATCH`) are protected against parallel duplicate submissions (e.g. user double-taps). Parallel requests with the same user ID, HTTP method, path, and request body parameters will return a lock conflict error:
```json
{
  "success": false,
  "message": "REQUEST_ALREADY_IN_PROGRESS",
  "timestamp": "2026-06-10T00:55:00.000Z",
  "errorCode": "REQUEST_ALREADY_IN_PROGRESS"
}
```

---

### Date & Time Formatting

To ensure consistent and readable time presentation across clients (such as mobile apps and dashboards), the API standardizes dates and times in all JSON responses using the following formats:

*   **Datetime Fields** (e.g., `checkInTime`, `checkOutTime`, `createdAt`): `"DD Mon YYYY, hh:mm AM/PM"` (e.g., `"06 Jun 2026, 01:29 PM"`).
*   **Date-Only Fields** (e.g., `joiningDate`): `"DD Mon YYYY"` (e.g., `"06 Jun 2026"`).
*   **Duration Fields** (e.g., `duration`): Formatted dynamically (e.g., `"8h 30m"`, or `"45m"`).
*   **API Response Envelope `timestamp`**: Remains standard ISO 8601 string format (e.g., `"2026-05-31T10:00:00.000Z"`).
*   **Request Params & Bodies**: Inputs (such as filters, queries, or creation data) expect standard formats like `YYYY-MM-DD` or ISO strings.

---

### Endpoint Overview

| Method   | Endpoint                        | Auth        | Roles                              |
| -------- | ------------------------------- | ----------- | ---------------------------------- |
| `POST`   | `/auth/register`                | None        | —                                  |
| `POST`   | `/auth/login`                   | None        | —                                  |
| `POST`   | `/auth/refresh`                 | None        | —                                  |
| `POST`   | `/auth/logout`                  | JWT         | Any                                |
| `POST`   | `/auth/change-initial-password` | JWT         | Any                                |
| `PUT`    | `/auth/change-password`         | JWT         | Any                                |
| `POST`   | `/auth/forgot-password`         | None        | —                                  |
| `POST`   | `/auth/reset-password`          | None        | —                                  |
| `POST`   | `/auth/workspaces/switch`       | JWT         | Any                                |
| `GET`    | `/profile`                      | JWT         | Any                                |
| `PUT`    | `/profile`                      | JWT         | Any                                |
| `GET`    | `/users`                        | JWT + Roles | `ADMIN` `HR` `TEAM_LEAD`           |
| `GET`    | `/users/:id`                    | JWT + Roles | `ADMIN` `HR` `TEAM_LEAD`           |
| `DELETE` | `/users/:id`                    | JWT + Roles | `ADMIN`                            |
| `GET`    | `/attendance/status`            | JWT         | Any                                |
| `POST`   | `/attendance/check-in`          | JWT + Roles | `STAFF` `TEAM_LEAD` `ADMIN` `HR`    |
| `POST`   | `/attendance/check-out`         | JWT + Roles | `STAFF` `TEAM_LEAD` `ADMIN` `HR`    |
| `GET`    | `/attendance/my`                | JWT         | Any                                |
| `GET`    | `/attendance/dashboard`         | JWT + Roles | `ADMIN` `HR` `TEAM_LEAD`           |
| `GET`    | `/attendance/:userId`           | JWT + Roles | `ADMIN` `HR` `TEAM_LEAD`           |
| `POST`   | `/staff`                        | JWT + Roles | `ADMIN` `HR`                       |
| `GET`    | `/staff`                        | JWT + Roles | `ADMIN` `HR` `TEAM_LEAD`           |
| `GET`    | `/staff/search?q=`              | JWT + Roles | `ADMIN` `HR` `TEAM_LEAD`           |
| `GET`    | `/staff/filter`                 | JWT + Roles | `ADMIN` `HR` `TEAM_LEAD`           |
| `GET`    | `/staff/:id`                    | JWT + Roles | `ADMIN` `HR` `TEAM_LEAD`           |
| `PUT`    | `/staff/:id`                    | JWT + Roles | `ADMIN` `HR`                       |
| `DELETE` | `/staff/:id`                    | JWT + Roles | `ADMIN`                            |
| `GET`    | `/workspaces`                   | JWT         | Any                                |
| `GET`    | `/workspaces/my-workspace`      | JWT + Roles | `ADMIN` `SUPER_ADMIN`              |
| `POST`   | `/invitations`                  | JWT + Roles | `ADMIN` `SUPER_ADMIN`              |
| `GET`    | `/invitations`                  | JWT + Roles | `ADMIN` `SUPER_ADMIN`              |
| `POST`   | `/invitations/:token/revoke`    | JWT + Roles | `ADMIN` `SUPER_ADMIN`              |
| `GET`    | `/dashboard/admin`              | JWT + Roles | `ADMIN` `SUPER_ADMIN` `HR` `TEAM_LEAD` |
| `GET`    | `/dashboard/staff`              | JWT         | Any                                |
| `GET`    | `/admin/documents`              | JWT + Roles | `ADMIN` `HR`                       |
| `GET`    | `/admin/document/update-requests` | JWT + Roles | `ADMIN` `HR`                     |
| `POST`   | `/admin/document/approve`       | JWT + Roles | `ADMIN` `HR`                       |
| `POST`   | `/admin/document/reject`        | JWT + Roles | `ADMIN` `HR`                       |
| `POST`   | `/admin/document/reupload-request` | JWT + Roles | `ADMIN` `HR`                    |
| `POST`   | `/admin/document/update/approve` | JWT + Roles | `ADMIN` `HR`                       |
| `POST`   | `/admin/document/update/reject`  | JWT + Roles | `ADMIN` `HR`                       |
| `POST`   | `/employee/document/upload`     | JWT + Roles | Any (Workspace roles)              |
| `GET`    | `/employee/documents`           | JWT + Roles | Any (Workspace roles)              |
| `POST`   | `/employee/document/update-request` | JWT + Roles | Any (Workspace roles)          |
| `GET`    | `/employee/document/update-status` | JWT + Roles | Any (Workspace roles)           |
| `POST`   | `/chat/channels`                | JWT         | Any                                |
| `GET`    | `/chat/channels`                | JWT         | Any                                |
| `GET`    | `/chat/channels/:channelId`      | JWT         | Any                                |
| `PATCH`  | `/chat/channels/:channelId`      | JWT         | Any                                |
| `DELETE` | `/chat/channels/:channelId`      | JWT         | Any                                |
| `POST`   | `/chat/channels/:channelId/members` | JWT      | Any                                |
| `DELETE` | `/chat/channels/:channelId/members/:targetUserId` | JWT | Any                       |
| `POST`   | `/chat/messages`                | JWT         | Any                                |
| `PATCH`  | `/chat/messages/:messageId`      | JWT         | Any                                |
| `DELETE` | `/chat/messages/:messageId`      | JWT         | Any                                |
| `GET`    | `/chat/channels/:channelId/messages` | JWT     | Any                                |
| `POST`   | `/chat/messages/:messageId/read` | JWT         | Any                                |
| `GET`    | `/chat/unread`                  | JWT         | Any                                |
| `GET`    | `/chat/search`                  | JWT         | Any                                |
| `GET`    | `/chat/notifications`           | JWT         | Any                                |

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
      "createdAt": "31 May 2026, 10:00 AM"
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
      "createdAt": "31 May 2026, 10:00 AM",
      "updatedAt": "31 May 2026, 10:00 AM"
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
    "isFirstLogin": false,
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

#### Switch Workspace

Authenticate and switch to another workspace context the user is a member of. Returns a new access and refresh token pair containing the selected workspace context claims and corresponding workspace membership role.

**`POST /api/v1/auth/workspaces/switch`** — Auth: Bearer token

##### Request Body

| Field          | Type   | Required | Description                        |
| -------------- | ------ | :------: | ---------------------------------- |
| `workspaceId`  | string | Yes      | Workspace UUID to switch context to|

```json
{
  "workspaceId": "a90fde09-5431-41fb-89ad-902e4d5fb23a"
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Workspace context switched successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
    "user": {
      "id": "3f2e1a4b-...",
      "email": "jane.smith@ozmo.io",
      "role": "HR"
    }
  },
  "timestamp": "2026-05-31T10:11:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/workspaces/switch \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"a90fde09-5431-41fb-89ad-902e4d5fb23a"}'
```

---

#### Change Initial Password

For newly created staff logging in with a temporary password, the system forces a password change before they can access the application.

**`POST /api/v1/auth/change-initial-password`** — Auth: Bearer token

##### Request Body

```json
{
  "currentPassword": "Welcome@123",
  "newPassword": "John@123",
  "confirmPassword": "John@123"
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully",
  "timestamp": "2026-06-06T12:00:00.000Z"
}
```

---

#### Change Password

Change password for the authenticated user.

**`PUT /api/v1/auth/change-password`** — Auth: Bearer token

##### Request Body

```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully",
  "timestamp": "2026-06-05T19:13:09.578Z"
}
```

---

#### Forgot Password

Request a password reset link/token. In development/testing environments, the reset token is returned directly in the response body.

**`POST /api/v1/auth/forgot-password`** — Auth: None

##### Request Body

```json
{
  "email": "staff@company.com"
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Password reset token generated successfully",
  "token": "reset-token-value...",
  "timestamp": "2026-06-05T19:13:10.281Z"
}
```

---

#### Reset Password

Reset password using the token retrieved from the forgot password flow.

**`POST /api/v1/auth/reset-password`** — Auth: None

##### Request Body

```json
{
  "token": "reset-token-value...",
  "password": "NewPassword@123"
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Password reset successfully",
  "timestamp": "2026-06-05T19:13:11.985Z"
}
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
    "createdAt": "31 May 2026, 10:00 AM"
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Update Own Profile

**`PUT /api/v1/profile`** — Auth: Bearer token | Roles: Any

All fields are optional.

> [!IMPORTANT]
> **Profile Modification Restrictions**:
> - Non-admin/HR staff members can only update: `firstName`, `lastName`, `phone`, `profilePhoto`, `address`, `emergencyContact`, and `bio`.
> - Restricted fields (`email`, `role`, `designation`, `department`, `employeeId`, `joiningDate`, `workspaceId`, `workspaceName`) can only be modified by administrators. Attempting to modify restricted fields as a standard staff member will return a `403 Forbidden` error.

##### Request Body

| Field              | Type   | Validation  | Description                                                         |
| ------------------ | ------ | ----------- | ------------------------------------------------------------------- |
| `firstName`        | string | 2–50 chars  | First name of the user                                              |
| `lastName`         | string | 2–50 chars  | Last name of the user                                               |
| `phone`            | string |             | Phone number                                                        |
| `profilePhoto`     | string |             | Profile photo URL                                                   |
| `address`          | string |             | Full address                                                        |
| `emergencyContact` | string |             | Emergency contact info (e.g. `John Doe (+919999999999)`)           |
| `bio`              | string |             | Brief bio text                                                      |
| `email`            | string |             | (Restricted) User email                                             |
| `role`             | enum   |             | (Restricted) User role                                              |
| `designation`      | string |             | (Restricted) Designation/title                                      |
| `department`       | string |             | (Restricted) Department                                             |
| `employeeId`       | string |             | (Restricted) Employee ID                                            |
| `joiningDate`      | string |             | (Restricted) ISO joining date string                                |
| `workspaceId`      | string |             | (Restricted) Workspace ID                                           |
| `workspaceName`    | string |             | (Restricted) Workspace Name                                         |

```json
{
  "phone": "+60123456789",
  "emergencyContact": "Jane Doe (+919999999999)",
  "bio": "Software Engineer at OZMO"
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

**`GET /api/v1/users`** — Auth: Bearer token | Roles: `ADMIN` `HR` `TEAM_LEAD`

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

**`GET /api/v1/users/:id`** — Auth: Bearer token | Roles: `ADMIN` `HR` `TEAM_LEAD`

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

#### Get Current Status

**`GET /api/v1/attendance/status`** — Auth: Bearer token | Roles: Any

Returns the live check-in status of the authenticated user. Useful for determining whether to show a "Check In" or "Check Out" button.

```bash
curl http://localhost:4000/api/v1/attendance/status \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Attendance status fetched",
  "data": {
    "isCheckedIn": true,
    "session": {
      "id": "clxtk...",
      "checkInTime": "2026-06-07T19:07:43.926Z",
      "location": "office"
    }
  },
  "timestamp": "2026-06-07T19:07:45.000Z"
}
```

---

#### Check In

**`POST /api/v1/attendance/check-in`** — Auth: Bearer token | Roles: `STAFF` `TEAM_LEAD`

Returns `409 Conflict` if already checked in without checking out.

##### Request Body (all optional)

| Field         | Type   | Description                                    |
| ------------- | ------ | ---------------------------------------------- |
| `checkInTime` | string | Optional ISO 8601 datetime override. Defaults to server `NOW()` |
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
    "checkInTime": "31 May 2026, 09:00 AM",
    "checkOutTime": null,
    "notes": "Working from home today",
    "createdAt": "31 May 2026, 09:00 AM"
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
    "checkInTime": "31 May 2026, 09:00 AM",
    "checkOutTime": "31 May 2026, 05:30 PM",
    "durationMinutes": 510,
    "duration": "8h 30m"
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
      "userId": "3f2e1a4b-...",
      "checkInTime": "31 May 2026, 09:00 AM",
      "checkOutTime": "31 May 2026, 05:30 PM",
      "notes": null,
      "createdAt": "31 May 2026, 09:00 AM"
    }
  ],
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Get Attendance Dashboard

**`GET /api/v1/attendance/dashboard`** — Auth: Bearer token | Roles: `ADMIN` `HR` `TEAM_LEAD`

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
    "period": {
      "from": "31 May 2026, 12:00 AM",
      "to": "31 May 2026, 11:59 PM"
    },
    "totalPresent": 18,
    "totalSessions": 20,
    "completedSessions": 18,
    "totalDurationMinutes": 9180,
    "totalDuration": "153h"
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### Get Attendance for a User

**`GET /api/v1/attendance/:userId`** — Auth: Bearer token | Roles: `ADMIN` `HR` `TEAM_LEAD`

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

| Field               | Type   | Required | Validation / Description                                 |
| ------------------- | ------ | :------: | -------------------------------------------------------- |
| `fullName`          | string |   Yes    | Full name of the staff member (splits into first/last name). |
| `email`             | string |   Yes    | Valid email, normalized to lowercase                     |
| `temporaryPassword` | string |   Yes    | Temporary password, min length 8 characters              |
| `role`              | enum   |   Yes    | Role enum value                                          |
| `phone`             | string |    No    | Phone number                                             |
| `designation`       | string |    No    | Job designation                                          |
| `department`        | string |    No    | Department name                                          |
| `joiningDate`       | string |    No    | ISO 8601 date string                                     |

```json
{
  "fullName": "Ahmad Razif",
  "email": "ahmad.razif@ozmo.io",
  "temporaryPassword": "Welcome@123",
  "role": "TEAM_LEAD",
  "department": "Operations",
  "joiningDate": "2026-06-01"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/staff \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmad Razif",
    "email": "ahmad.razif@ozmo.io",
    "temporaryPassword": "Welcome@123",
    "role": "TEAM_LEAD",
    "department": "Operations",
    "joiningDate": "2026-06-01"
  }'
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Staff member created",
  "data": {
    "id": "7163c4af-e076-462a-a343-21abb610d3df",
    "employeeId": "OZ-2026-0002",
    "isFirstLogin": true
  },
  "timestamp": "2026-05-31T10:00:00.000Z"
}
```

---

#### List All Staff

**`GET /api/v1/staff`** — Auth: Bearer token | Roles: `ADMIN` `HR` `TEAM_LEAD`

##### Query Parameters (all optional)

| Param | Type | Example | Description |
| --- | --- | --- | --- |
| `page` | number | `?page=1` | Page number for pagination (default: 1) |
| `limit` | number | `?limit=20` | Max results per page (default: 20) |
| `role` | enum | `?role=STAFF` | Filter by user Role |
| `department` | string | `?department=Engineering` | Filter by department |
| `status` | enum | `?status=ACTIVE` | Filter by user status (`ACTIVE`, `INACTIVE`, `RESIGNED`, `TERMINATED`) |
| `sort` | string | `?sort=name` | Sort field: `name` (first and last name) or `joiningDate` |

```bash
curl "http://localhost:4000/api/v1/staff?page=1&limit=20&role=STAFF&sort=name" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Search Staff

**`GET /api/v1/staff/search?q=`** — Auth: Bearer token | Roles: `ADMIN` `HR` `TEAM_LEAD`

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

**`GET /api/v1/staff/filter`** — Auth: Bearer token | Roles: `ADMIN` `HR` `TEAM_LEAD`

| Param        | Type   | Values                                                       |
| ------------ | ------ | ------------------------------------------------------------ |
| `department` | string | Any string                                                   |
| `status`     | enum   | `ACTIVE` `INACTIVE` `RESIGNED` `TERMINATED`                  |
| `role`       | enum   | `SUPER_ADMIN` `ADMIN` `HR` `TEAM_LEAD` `STAFF` |

```bash
curl "http://localhost:4000/api/v1/staff/filter?department=Engineering&status=ACTIVE" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Get Staff by ID

**`GET /api/v1/staff/:id`** — Auth: Bearer token | Roles: `ADMIN` `HR` `TEAM_LEAD`

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
    "workspaceDetails": {
      "id": "2c13d182-4556-4056-bc11-bc7c5a49633b",
      "name": "OZMO Innovations 1780686965510",
      "plan": "FREE",
      "isActive": true,
      "memberCount": 1,
      "adminEmail": "admin_1780686965510@example.com",
      "createdAt": "2026-06-05T19:16:07.116Z",
      "updatedAt": "2026-06-05T19:16:07.116Z",
      "weekendDays": [],
      "pushNotifications": true,
      "attendanceAlerts": true,
      "leaveAlerts": true,
      "taskAlerts": true,
      "birthdayAlerts": true
    },
    "workspace": {
      "id": "2c13d182-4556-4056-bc11-bc7c5a49633b",
      "name": "OZMO Innovations 1780686965510",
      "plan": "FREE",
      "isActive": true,
      "memberCount": 1,
      "adminEmail": "admin_1780686965510@example.com",
      "createdAt": "2026-06-05T19:16:07.116Z",
      "updatedAt": "2026-06-05T19:16:07.116Z",
      "weekendDays": [],
      "pushNotifications": true,
      "attendanceAlerts": true,
      "leaveAlerts": true,
      "taskAlerts": true,
      "birthdayAlerts": true
    },
    "totalEmployees": 2,
    "activeEmployees": 2,
    "staffList": [
      {
        "id": "7163c4af-e076-462a-a343-21abb610d3df",
        "employeeId": "OZ-2026-0009",
        "firstName": "John",
        "lastName": "Admin",
        "email": "admin_1780686965510@example.com",
        "role": "ADMIN",
        "status": "ACTIVE",
        "createdAt": "05 Jun 2026, 07:16 PM",
        "isRegistrationCompleted": true,
        "workspaceId": "2c13d182-4556-4056-bc11-bc7c5a49633b",
        "workspaceName": "OZMO Innovations 1780686965510"
      },
      {
        "id": "904f618f-8ea4-41a4-bf1e-704bc35f7cfb",
        "employeeId": "OZ-2026-0010",
        "firstName": "Alice",
        "lastName": "Staff",
        "email": "staff_1780686965510@example.com",
        "phone": "9876543210",
        "role": "STAFF",
        "designation": "Software Engineer",
        "department": "Engineering",
        "joiningDate": "05 Jun 2026",
        "status": "ACTIVE",
        "createdAt": "05 Jun 2026, 07:16 PM",
        "isRegistrationCompleted": true,
        "workspaceId": "2c13d182-4556-4056-bc11-bc7c5a49633b",
        "workspaceName": "OZMO Innovations 1780686965510",
        "profilePhoto": "https://example.com/avatar.png"
      }
    ],
    "staff": [
      {
        "id": "7163c4af-e076-462a-a343-21abb610d3df",
        "employeeId": "OZ-2026-0009",
        "firstName": "John",
        "lastName": "Admin",
        "email": "admin_1780686965510@example.com",
        "role": "ADMIN",
        "status": "ACTIVE",
        "createdAt": "05 Jun 2026, 07:16 PM",
        "isRegistrationCompleted": true,
        "workspaceId": "2c13d182-4556-4056-bc11-bc7c5a49633b",
        "workspaceName": "OZMO Innovations 1780686965510"
      },
      {
        "id": "904f618f-8ea4-41a4-bf1e-704bc35f7cfb",
        "employeeId": "OZ-2026-0010",
        "firstName": "Alice",
        "lastName": "Staff",
        "email": "staff_1780686965510@example.com",
        "phone": "9876543210",
        "role": "STAFF",
        "designation": "Software Engineer",
        "department": "Engineering",
        "joiningDate": "05 Jun 2026",
        "status": "ACTIVE",
        "createdAt": "05 Jun 2026, 07:16 PM",
        "isRegistrationCompleted": true,
        "workspaceId": "2c13d182-4556-4056-bc11-bc7c5a49633b",
        "workspaceName": "OZMO Innovations 1780686965510",
        "profilePhoto": "https://example.com/avatar.png"
      }
    ],
    "attendanceSummary": {
      "presentToday": 1,
      "absentToday": 1
    },
    "leaveSummary": {
      "pendingLeaves": 2,
      "approvedLeaves": 5
    },
    "attendance": [
      {
        "id": "848243be-e260-449e-8798-e7c6b5a3ab11",
        "userId": "904f618f-8ea4-41a4-bf1e-704bc35f7cfb",
        "checkInTime": "05 Jun 2026, 07:16 PM",
        "checkOutTime": "05 Jun 2026, 07:16 PM",
        "notes": "Remote work",
        "createdAt": "05 Jun 2026, 07:16 PM"
      }
    ],
    "leaves": []
  },
  "timestamp": "2026-06-05T19:16:35.809Z"
}
```
```

```bash
curl http://localhost:4000/api/v1/workspaces/my-workspace \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Workspaces

#### Send Invitation

Invite a new member to join the workspace. Generates a unique registration token.

**`POST /api/v1/invitations`** — Auth: Bearer token | Roles: `ADMIN`, `SUPER_ADMIN`

##### Request Body

| Field  | Type   | Required | Description                        |
| ------ | ------ | :------: | ---------------------------------- |
| `email` | string |   Yes    | Invitee email address.             |
| `role`  | enum   |   Yes    | Assignable Role (e.g. `STAFF`, `HR`, `TEAM_LEAD`). |

```json
{
  "email": "invitee@company.com",
  "role": "HR"
}
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "id": "e3617be3-fe44-4861-ad81-cfb01f652cb9",
    "email": "invitee@company.com",
    "role": "HR",
    "token": "c3617be3-fe44-4861-ad81-cfb01f652cb9",
    "status": "PENDING",
    "workspaceId": "a2a03efe-5da3-4125-aade-3a0e9568f612",
    "invitedById": "1572d211-145e-47e7-bd3f-57861092af4e",
    "expiresAt": "11 Jun 2026, 06:07 AM",
    "signupUrl": "http://localhost:3000/auth/register?token=c3617be3-fe44-4861-ad81-cfb01f652cb9"
  },
  "timestamp": "2026-06-04T06:07:16.970Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/invitations \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email":"invitee@company.com","role":"HR"}'
```

---

#### List Invitations

Retrieve all invitations sent from the admin's workspace.

**`GET /api/v1/invitations`** — Auth: Bearer token | Roles: `ADMIN`, `SUPER_ADMIN`

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Invitations retrieved successfully",
  "data": [
    {
      "id": "e3617be3-fe44-4861-ad81-cfb01f652cb9",
      "email": "invitee@company.com",
      "role": "HR",
      "token": "c3617be3-fe44-4861-ad81-cfb01f652cb9",
      "status": "PENDING",
      "workspaceId": "a2a03efe-5da3-4125-aade-3a0e9568f612",
      "invitedById": "1572d211-145e-47e7-bd3f-57861092af4e",
      "expiresAt": "11 Jun 2026, 06:07 AM",
      "createdAt": "04 Jun 2026, 06:07 AM",
      "updatedAt": "04 Jun 2026, 06:07 AM"
    }
  ],
  "timestamp": "2026-06-04T06:07:16.970Z"
}
```

```bash
curl http://localhost:4000/api/v1/invitations \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Revoke Invitation

Revoke an active pending invitation.

**`POST /api/v1/invitations/:token/revoke`** — Auth: Bearer token | Roles: `ADMIN`, `SUPER_ADMIN`

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Invitation revoked successfully",
  "data": {
    "id": "e3617be3-fe44-4861-ad81-cfb01f652cb9",
    "status": "REVOKED"
  },
  "timestamp": "2026-06-04T06:07:16.970Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/invitations/c3617be3-fe44-4861-ad81-cfb01f652cb9/revoke \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Dashboard

#### Get Admin Dashboard

Retrieve statistics for the administration dashboard, reflecting the total and active workforce.

**`GET /api/v1/dashboard/admin`** — Auth: Bearer token | Roles: `ADMIN`, `SUPER_ADMIN`, `HR`, `TEAM_LEAD`

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Admin dashboard statistics retrieved successfully",
  "data": {
    "totalEmployees": 2,
    "presentToday": 0,
    "absentToday": 2,
    "leaveRequests": 3,
    "newEmployees": 2
  },
  "timestamp": "2026-06-05T19:16:39.252Z"
}
```

```bash
curl http://localhost:4000/api/v1/dashboard/admin \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Get Staff Dashboard

Retrieve personal workspace statistics for the currently authenticated staff member.

**`GET /api/v1/dashboard/staff`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Staff dashboard statistics retrieved successfully",
  "data": {
    "attendanceStatus": "Not Checked In",
    "todayHours": 0.0,
    "pendingLeaves": 1,
    "tasksAssigned": 5
  },
  "timestamp": "2026-06-05T19:16:41.942Z"
}
```

```bash
curl http://localhost:4000/api/v1/dashboard/staff \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Meetings

#### Fetch All Meetings

**`GET /api/v1/meetings`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Meetings fetched successfully",
  "data": [
    {
      "id": "meet_001",
      "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
      "title": "Sprint Planning & Standup",
      "description": "Aligning on deliverables and tasks for current sprint.",
      "dateTime": "2026-06-09T09:30:00.000Z",
      "link": "https://meet.google.com/abc-defg-hij",
      "duration": "30 mins",
      "createdAt": "2026-06-09T09:30:00.000Z",
      "updatedAt": "2026-06-09T09:30:00.000Z"
    }
  ],
  "timestamp": "2026-06-09T14:30:00.000Z"
}
```

```bash
curl http://localhost:4000/api/v1/meetings \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Create Meeting

**`POST /api/v1/meetings`** — Auth: Bearer token | Roles: `ADMIN` `SUPER_ADMIN` `HR` `TEAM_LEAD`

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `title` | string | Yes | Meeting title |
| `description` | string | No | Meeting description |
| `dateTime` | string | Yes | ISO 8601 Date/Time string |
| `link` | string | Yes | Meeting URL link |
| `duration` | string | Yes | Meeting duration (e.g. `45 mins`) |

```json
{
  "title": "Client Progress Review",
  "description": "Weekly alignment sync with clients.",
  "dateTime": "2026-06-10T15:00:00.000Z",
  "link": "https://meet.google.com/xyz-uvwx-123",
  "duration": "45 mins"
}
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Meeting created successfully",
  "data": {
    "id": "e3617be3-fe44-4861-ad81-cfb01f652cb9",
    "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
    "title": "Client Progress Review",
    "description": "Weekly alignment sync with clients.",
    "dateTime": "2026-06-10T15:00:00.000Z",
    "link": "https://meet.google.com/xyz-uvwx-123",
    "duration": "45 mins",
    "createdAt": "2026-06-09T15:35:00.000Z",
    "updatedAt": "2026-06-09T15:35:00.000Z"
  },
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/meetings \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Client Progress Review",
    "description": "Weekly alignment sync with clients.",
    "dateTime": "2026-06-10T15:00:00.000Z",
    "link": "https://meet.google.com/xyz-uvwx-123",
    "duration": "45 mins"
  }'
```

---

### Leave Management

#### Fetch All Leaves

**`GET /api/v1/leaves`** — Auth: Bearer token | Roles: Any (Staff gets own leaves, Admin/HR/Team Lead gets all leaves in workspace)

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Leaves fetched successfully",
  "data": [
    {
      "id": "lv_101",
      "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
      "userId": "3f2e1a4b-...",
      "employeeId": "emp_001",
      "employeeName": "Arjun Mehta",
      "department": "Tech Division",
      "teamId": "team_tech",
      "category": "casual",
      "priority": "normal",
      "startDate": "2026-06-12T00:00:00.000Z",
      "endDate": "2026-06-14T00:00:00.000Z",
      "days": 3,
      "reason": "Urgent family event",
      "hasAttachment": false,
      "status": "pending",
      "impactLevel": "low",
      "coverageStatus": "none",
      "teamLeadNote": "",
      "approvedBy": null,
      "rejectionReason": null,
      "reviewedAt": null,
      "appliedAt": "2026-06-09T14:30:00.000Z",
      "createdAt": "2026-06-09T14:30:00.000Z",
      "updatedAt": "2026-06-09T14:30:00.000Z"
    }
  ],
  "timestamp": "2026-06-09T14:30:00.000Z"
}
```

```bash
curl http://localhost:4000/api/v1/leaves \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Submit Leave Request

**`POST /api/v1/leaves`** — Auth: Bearer token | Roles: Any

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `id` | string | No | Optional custom ID (e.g. `lv_102`) |
| `employeeId` | string | Yes | Staff member's employee ID |
| `employeeName` | string | Yes | Staff member's full name |
| `department` | string | No | Department name |
| `teamId` | string | No | Team ID |
| `category` | string | Yes | Leave category (`casual`, `sick`, `paid`, `compOff`, `wfh`, `halfDay`) |
| `priority` | string | Yes | Priority level (`low`, `normal`, `high`, `urgent`) |
| `startDate` | string | Yes | ISO 8601 Date string |
| `endDate` | string | Yes | ISO 8601 Date string |
| `days` | number | Yes | Total days |
| `reason` | string | Yes | Leave reason |
| `hasAttachment` | boolean | No | Whether an attachment is included |
| `status` | string | No | Defaults to `pending` |
| `impactLevel` | string | No | Defaults to `low` |
| `coverageStatus` | string | No | Defaults to `none` |
| `teamLeadNote` | string | No | Optional note |

```json
{
  "id": "lv_102",
  "employeeId": "emp_001",
  "employeeName": "Arjun Mehta",
  "department": "Tech Division",
  "teamId": "team_tech",
  "category": "sick",
  "priority": "high",
  "startDate": "2026-06-15T00:00:00.000Z",
  "endDate": "2026-06-15T00:00:00.000Z",
  "days": 1,
  "reason": "Doctor appointment",
  "hasAttachment": false
}
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "id": "lv_102",
    "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
    "userId": "9a6c910a-bd46-4aa2-b459-f21c0f6c5bfc",
    "employeeId": "emp_001",
    "employeeName": "Arjun Mehta",
    "department": "Tech Division",
    "teamId": "team_tech",
    "category": "sick",
    "priority": "high",
    "startDate": "2026-06-15T00:00:00.000Z",
    "endDate": "2026-06-15T00:00:00.000Z",
    "days": 1,
    "reason": "Doctor appointment",
    "hasAttachment": false,
    "status": "pending",
    "impactLevel": "low",
    "coverageStatus": "none",
    "teamLeadNote": "",
    "approvedBy": null,
    "rejectionReason": null,
    "reviewedAt": null,
    "appliedAt": "2026-06-09T15:35:00.000Z",
    "createdAt": "2026-06-09T15:35:00.000Z",
    "updatedAt": "2026-06-09T15:35:00.000Z"
  },
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/leaves \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lv_102",
    "employeeId": "emp_001",
    "employeeName": "Arjun Mehta",
    "department": "Tech Division",
    "teamId": "team_tech",
    "category": "sick",
    "priority": "high",
    "startDate": "2026-06-15T00:00:00.000Z",
    "endDate": "2026-06-15T00:00:00.000Z",
    "days": 1,
    "reason": "Doctor appointment",
    "hasAttachment": false
  }'
```

---

#### Update Leave Status

**`PUT /api/v1/leaves/:id/status`** — Auth: Bearer token | Roles: `ADMIN` `SUPER_ADMIN` `HR` `TEAM_LEAD`

##### Request Body (Option A: Approve)

```json
{
  "status": "APPROVED",
  "approvedBy": "Admin Name"
}
```

##### Request Body (Option B: Reject)

```json
{
  "status": "REJECTED",
  "rejectedBy": "Admin Name",
  "rejectionReason": "Project release critical phase coverage needed"
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Leave status updated successfully",
  "data": {
    "id": "lv_102",
    "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
    "userId": "9a6c910a-bd46-4aa2-b459-f21c0f6c5bfc",
    "employeeId": "emp_001",
    "employeeName": "Arjun Mehta",
    "department": "Tech Division",
    "teamId": "team_tech",
    "category": "sick",
    "priority": "high",
    "startDate": "2026-06-15T00:00:00.000Z",
    "endDate": "2026-06-15T00:00:00.000Z",
    "days": 1,
    "reason": "Doctor appointment",
    "hasAttachment": false,
    "status": "approved",
    "impactLevel": "low",
    "coverageStatus": "none",
    "teamLeadNote": "",
    "approvedBy": "Admin Name",
    "rejectionReason": null,
    "reviewedAt": "2026-06-09T15:35:00.000Z",
    "appliedAt": "2026-06-09T15:35:00.000Z",
    "createdAt": "2026-06-09T15:35:00.000Z",
    "updatedAt": "2026-06-09T15:35:00.000Z"
  },
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl -X PUT http://localhost:4000/api/v1/leaves/lv_102/status \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","approvedBy":"Admin Name"}'
```

---

### Audit Logs

#### Fetch Audit Logs

**`GET /api/v1/audit`** — Auth: Bearer token | Roles: `SUPER_ADMIN`, `ADMIN`, `HR`

##### Query Parameters

All parameters are optional.

| Field | Type | Description |
| --- | --- | --- |
| `action` | string | Filter logs by specific action name |
| `entityType` | string | Filter logs by entity type/module |
| `actorId` | string | Filter logs by user ID (actor) |
| `workspaceId` | string | Filter logs by workspace ID |
| `from` | string (ISO-8601) | Filter logs starting from date |
| `to` | string (ISO-8601) | Filter logs up to date |
| `limit` | number | Page size limit (default `50`, max `200`) |
| `offset` | number | Page offset (default `0`) |

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Audit logs retrieved",
  "data": {
    "entries": [
      {
        "id": "ad_89c81b24-11e2-45e3-9824-a78c1873130d",
        "action": "DATA_EXPORTED",
        "entityType": "ATTENDANCE",
        "entityId": "ad_89c81b24-11e2-45e3-9824-a78c1873130d",
        "actor": "admin@company.com",
        "actorId": "9a6c910a-bd46-4aa2-b459-f21c0f6c5bfc",
        "ipAddress": "127.0.0.1",
        "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
        "detail": "Exported ATTENDANCE as CSV — attendance_report.csv",
        "timestamp": "2026-06-09T15:35:00.000Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  },
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl http://localhost:4000/api/v1/audit?limit=10 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Get Entity Audit Log

**`GET /api/v1/audit/:entityId`** — Auth: Bearer token | Roles: `SUPER_ADMIN`, `ADMIN`, `HR`

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Entity audit log retrieved",
  "data": [
    {
      "id": "ad_89c81b24-11e2-45e3-9824-a78c1873130d",
      "action": "DATA_EXPORTED",
      "entityType": "ATTENDANCE",
      "entityId": "ad_89c81b24-11e2-45e3-9824-a78c1873130d",
      "actor": "admin@company.com",
      "actorId": "9a6c910a-bd46-4aa2-b459-f21c0f6c5bfc",
      "ipAddress": "127.0.0.1",
      "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
      "detail": "Exported ATTENDANCE as CSV — attendance_report.csv",
      "timestamp": "2026-06-09T15:35:00.000Z"
    }
  ],
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl http://localhost:4000/api/v1/audit/ad_89c81b24-11e2-45e3-9824-a78c1873130d \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Notifications

#### Fetch Notifications

**`GET /api/v1/notifications`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "nt_89cb18e4-18c7-4ab2-921a-c71b162f48da",
      "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
      "userId": "9a6c910a-bd46-4aa2-b459-f21c0f6c5bfc",
      "title": "Leave Approved",
      "message": "Your leave request for 2026-06-15 has been approved.",
      "type": "leaveAlerts",
      "isRead": false,
      "actionId": "lv_102",
      "createdAt": "2026-06-09T15:35:00.000Z",
      "updatedAt": "2026-06-09T15:35:00.000Z",
      "deletedAt": null,
      "createdBy": null,
      "updatedBy": null
    }
  ],
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl http://localhost:4000/api/v1/notifications \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Mark Notification as Read

**`PATCH /api/v1/notifications/:id/read`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "nt_89cb18e4-18c7-4ab2-921a-c71b162f48da",
    "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
    "userId": "9a6c910a-bd46-4aa2-b459-f21c0f6c5bfc",
    "title": "Leave Approved",
    "message": "Your leave request for 2026-06-15 has been approved.",
    "type": "leaveAlerts",
    "isRead": true,
    "actionId": "lv_102",
    "createdAt": "2026-06-09T15:35:00.000Z",
    "updatedAt": "2026-06-09T15:35:00.000Z",
    "deletedAt": null,
    "createdBy": null,
    "updatedBy": null
  },
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl -X PATCH http://localhost:4000/api/v1/notifications/nt_89cb18e4-18c7-4ab2-921a-c71b162f48da/read \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Mark All Notifications as Read

**`POST /api/v1/notifications/read-all`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "success": true
  },
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/notifications/read-all \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Holidays

#### Fetch Holidays

**`GET /api/v1/holidays`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Holidays fetched successfully",
  "data": [
    {
      "id": "hl_5bca29ef-1e23-4b9d-adbc-c781bf6d182e",
      "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
      "name": "Independence Day",
      "date": "2026-07-04T00:00:00.000Z",
      "type": "publicHoliday",
      "description": "National holiday celebrating independence.",
      "notes": "Office closed.",
      "repeatYearly": true,
      "createdAt": "2026-06-09T15:35:00.000Z",
      "updatedAt": "2026-06-09T15:35:00.000Z"
    }
  ],
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl http://localhost:4000/api/v1/holidays \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Reports

#### Export Data

**`GET /api/v1/reports/export`** — Auth: Bearer token | Roles: `ADMIN`, `SUPER_ADMIN`, `HR`

##### Query Parameters

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `module` | string | Yes | Module name to export (e.g. `ATTENDANCE`, `LEAVES`, `STAFF`, `HOLIDAYS`) |
| `format` | string | Yes | Export file format (`CSV` or `PDF`) |
| `from` | string | No | Filter data from start date (ISO-8601) |
| `to` | string | No | Filter data to end date (ISO-8601) |

##### Response — `200 OK`

Returns the generated file stream as a downloadable attachment.

```bash
curl "http://localhost:4000/api/v1/reports/export?module=ATTENDANCE&format=CSV" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -o attendance_report.csv
```

---

### Careers

#### List Job Openings

**`GET /api/v1/careers/jobs`** — Auth: Public | Roles: Public (No token required)

##### Query Parameters

All parameters are optional.

| Field | Type | Description |
| --- | --- | --- |
| `department` | string | Filter jobs by department name |
| `location` | string | Filter jobs by location |
| `employmentType` | enum | Filter jobs by employment type (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN`) |
| `experienceLevel` | enum | Filter jobs by experience level (`ENTRY`, `MID`, `SENIOR`, `LEAD`, `EXECUTIVE`) |
| `search` | string | Keyword search on title/description |

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Job listings retrieved",
  "data": [
    {
      "id": "jb_f9bc2891-9e23-4ba9-adcd-e7c1bf8d132a",
      "title": "Senior Flutter Developer",
      "department": "Tech Division",
      "experienceLevel": "SENIOR",
      "employmentType": "FULL_TIME",
      "description": "Looking for an expert Flutter engineer...",
      "requirements": ["3+ years experience with Flutter", "Familiarity with clean architecture"],
      "skills": ["Flutter", "Dart", "BLoC", "Git"],
      "location": "Remote (USA/Canada)",
      "salaryMin": 90000,
      "salaryMax": 120000,
      "currency": "USD",
      "vacancies": 2,
      "status": "OPEN",
      "workspaceId": "790cb3f8-bcac-444c-9c79-f66dc33f9818",
      "workspaceName": "OZMO innovations",
      "hideSalaryPublicly": false,
      "applicantCount": 14,
      "closingDate": "2026-07-31T00:00:00.000Z",
      "createdAt": "2026-06-09T15:35:00.000Z",
      "updatedAt": "2026-06-09T15:35:00.000Z"
    }
  ],
  "timestamp": "2026-06-09T15:35:00.000Z"
}
```

```bash
curl http://localhost:4000/api/v1/careers/jobs?employmentType=FULL_TIME
```

---

#### Apply for a Job

**`POST /api/v1/careers/jobs/:jobId/apply`** — Auth: Public | Roles: Public (No token required)

Accepts a multipart form-data request.

##### Request Body (Form Data)

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `firstName` | string | Yes | Applicant's first name |
| `lastName` | string | Yes | Applicant's last name |
| `email` | string | Yes | Applicant's email address |
| `phone` | string | Yes | Applicant's phone number |
| `currentDesignation` | string | Yes | Current designation |
| `experienceYears` | number | Yes | Total years of experience |
| `education` | string | Yes | Highest education degree |
| `skills` | string/array | Yes | Array or list of skills (comma-separated if string) |
| `portfolioUrl` | string | No | Portfolio/LinkedIn URL |
| `coverLetter` | string | No | Optional cover letter text |
| `resume` | File | No | Upload resume (PDF, DOC, DOCX up to 5MB) |

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "id": "cd_29bc38e4-18c7-4ab2-921a-c71b162f48da",
    "jobId": "jb_f9bc2891-9e23-4ba9-adcd-e7c1bf8d132a",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "phone": "+1234567890",
    "currentDesignation": "Software Engineer",
    "experienceYears": 4,
    "education": "BS in Computer Science",
    "skills": ["Flutter", "Dart"],
    "portfolioUrl": "https://linkedin.com/in/janedoe",
    "coverLetter": "Excited about this opportunity...",
    "resumeUrl": "uploads/resumes/17812948291_resume.pdf",
    "stage": "APPLIED",
    "hasPortalAccess": false,
    "source": "CAREERS_PORTAL",
    "appliedAt": "2026-06-10T12:00:00.000Z",
    "createdAt": "2026-06-10T12:00:00.000Z"
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/careers/jobs/jb_f9bc2891-9e23-4ba9-adcd-e7c1bf8d132a/apply \
  -F "firstName=Jane" \
  -F "lastName=Doe" \
  -F "email=jane.doe@example.com" \
  -F "phone=+1234567890" \
  -F "currentDesignation=Software Engineer" \
  -F "experienceYears=4" \
  -F "education=BS in Computer Science" \
  -F "skills=Flutter,Dart" \
  -F "resume=@/path/to/resume.pdf"
```

### Document Management

This module allows employees to upload and manage their documents (e.g. ID proof, address proof, certificates), and allows administrators/HR to review, approve, reject, or request updates/re-uploads.

#### Admin: Get All Documents

Retrieve all documents uploaded by staff in the administrator's workspace.

**`GET /api/v1/admin/documents`** — Auth: Bearer token | Roles: `ADMIN`, `HR`

##### Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123",
      "userId": "usr_456",
      "name": "Passport",
      "documentType": "PASSPORT",
      "fileUrl": "https://storage.googleapis.com/bucket/passport.pdf",
      "status": "PENDING",
      "remarks": null,
      "expiryDate": "2031-12-31T00:00:00.000Z",
      "createdAt": "2026-06-15T10:00:00.000Z"
    }
  ]
}
```

##### Command
```bash
curl http://localhost:4000/api/v1/admin/documents \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Admin: Get Update Requests

Retrieve all pending document update requests in the workspace.

**`GET /api/v1/admin/document/update-requests`** — Auth: Bearer token | Roles: `ADMIN`, `HR`

##### Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "req_789",
      "documentId": "doc_123",
      "reason": "Corrected misspelled name and renewed validity",
      "newFileName": "Passport_Renewed.pdf",
      "newFileUrl": "https://storage.googleapis.com/bucket/passport_renewed.pdf",
      "status": "PENDING",
      "createdAt": "2026-06-16T12:00:00.000Z"
    }
  ]
}
```

##### Command
```bash
curl http://localhost:4000/api/v1/admin/document/update-requests \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Admin: Approve Document

Approve an uploaded document.

**`POST /api/v1/admin/document/approve`** — Auth: Bearer token | Roles: `ADMIN`, `HR`

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `documentId` | string (UUID) | Yes | The ID of the document to approve |
| `remarks` | string | No | Optional remarks or notes |

```json
{
  "documentId": "doc_123",
  "remarks": "Document details verified"
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Document approved successfully",
  "data": {
    "id": "doc_123",
    "status": "APPROVED",
    "remarks": "Document details verified"
  }
}
```

##### Command
```bash
curl -X POST http://localhost:4000/api/v1/admin/document/approve \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_123","remarks":"Document details verified"}'
```

---

#### Admin: Reject Document

Reject an uploaded document.

**`POST /api/v1/admin/document/reject`** — Auth: Bearer token | Roles: `ADMIN`, `HR`

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `documentId` | string (UUID) | Yes | The ID of the document to reject |
| `remarks` | string | Yes | Reason for rejection |

```json
{
  "documentId": "doc_123",
  "remarks": "Image blurry and illegible. Please upload a high-resolution scan."
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Document rejected successfully",
  "data": {
    "id": "doc_123",
    "status": "REJECTED",
    "remarks": "Image blurry and illegible. Please upload a high-resolution scan."
  }
}
```

##### Command
```bash
curl -X POST http://localhost:4000/api/v1/admin/document/reject \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_123","remarks":"Image blurry"}'
```

---

#### Admin: Request Reupload

Flag a document for re-upload.

**`POST /api/v1/admin/document/reupload-request`** — Auth: Bearer token | Roles: `ADMIN`, `HR`

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `documentId` | string (UUID) | Yes | Document ID |
| `remarks` | string | Yes | Instructions for what to upload |

```json
{
  "documentId": "doc_123",
  "remarks": "Please provide the back side of the card as well."
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Re-upload request sent successfully",
  "data": {
    "id": "doc_123",
    "status": "REUPLOAD_REQUESTED",
    "remarks": "Please provide the back side of the card as well."
  }
}
```

##### Command
```bash
curl -X POST http://localhost:4000/api/v1/admin/document/reupload-request \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_123","remarks":"Please provide the back side"}'
```

---

#### Admin: Approve Update Request

Approve an employee's requested document update. This will automatically overwrite the document's properties with the newly submitted values.

**`POST /api/v1/admin/document/update/approve`** — Auth: Bearer token | Roles: `ADMIN`, `HR`

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `updateRequestId` | string (UUID) | Yes | ID of the update request |
| `remarks` | string | No | Optional remarks |

```json
{
  "updateRequestId": "req_789",
  "remarks": "Verified changes. Approved."
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Update request approved successfully",
  "data": {
    "id": "doc_123",
    "name": "Passport_Renewed.pdf",
    "fileUrl": "https://storage.googleapis.com/bucket/passport_renewed.pdf",
    "status": "APPROVED"
  }
}
```

##### Command
```bash
curl -X POST http://localhost:4000/api/v1/admin/document/update/approve \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"updateRequestId":"req_789"}'
```

---

#### Admin: Reject Update Request

Reject an employee's requested document update.

**`POST /api/v1/admin/document/update/reject`** — Auth: Bearer token | Roles: `ADMIN`, `HR`

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `updateRequestId` | string (UUID) | Yes | ID of the update request |
| `remarks` | string | Yes | Reason for rejection |

```json
{
  "updateRequestId": "req_789",
  "remarks": "Incorrect document format uploaded."
}
```

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Update request rejected successfully",
  "data": {
    "id": "req_789",
    "status": "REJECTED",
    "remarks": "Incorrect document format uploaded."
  }
}
```

##### Command
```bash
curl -X POST http://localhost:4000/api/v1/admin/document/update/reject \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"updateRequestId":"req_789","remarks":"Incorrect document format"}'
```

---

#### Employee: Upload Document

Upload a new document for review.

**`POST /api/v1/employee/document/upload`** — Auth: Bearer token | Roles: `STAFF`, `TEAM_LEAD`, `ADMIN`, `HR`

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `documentType` | string | Yes | E.g. `PASSPORT`, `DRIVING_LICENSE`, `NATIONAL_ID`, `VISA` |
| `name` | string | Yes | Display name of the document |
| `fileUrl` | string | Yes | Remote url/path to the uploaded file |
| `expiryDate` | string | No | Optional ISO 8601 expiry date string |

```json
{
  "documentType": "NATIONAL_ID",
  "name": "Identity Card",
  "fileUrl": "https://storage.googleapis.com/bucket/my_national_id.pdf",
  "expiryDate": "2030-01-01T00:00:00.000Z"
}
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "doc_123",
    "userId": "usr_456",
    "name": "Identity Card",
    "documentType": "NATIONAL_ID",
    "fileUrl": "https://storage.googleapis.com/bucket/my_national_id.pdf",
    "status": "PENDING",
    "expiryDate": "2030-01-01T00:00:00.000Z",
    "createdAt": "2026-06-16T13:00:00.000Z"
  }
}
```

##### Command
```bash
curl -X POST http://localhost:4000/api/v1/employee/document/upload \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"documentType":"NATIONAL_ID","name":"Identity Card","fileUrl":"https://storage.googleapis.com/bucket/my_national_id.pdf"}'
```

---

#### Employee: Get My Documents

Retrieve all documents uploaded by the authenticated user.

**`GET /api/v1/employee/documents`** — Auth: Bearer token | Roles: `STAFF`, `TEAM_LEAD`, `ADMIN`, `HR`

##### Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123",
      "name": "Identity Card",
      "documentType": "NATIONAL_ID",
      "fileUrl": "https://storage.googleapis.com/bucket/my_national_id.pdf",
      "status": "PENDING",
      "expiryDate": "2030-01-01T00:00:00.000Z",
      "createdAt": "2026-06-16T13:00:00.000Z"
    }
  ]
}
```

##### Command
```bash
curl http://localhost:4000/api/v1/employee/documents \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### Employee: Submit Update Request

Submit a request to update an existing approved/rejected document with a new file.

**`POST /api/v1/employee/document/update-request`** — Auth: Bearer token | Roles: `STAFF`, `TEAM_LEAD`, `ADMIN`, `HR`

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `documentId` | string (UUID) | Yes | Target document ID |
| `reason` | string | Yes | Reason for requesting the update |
| `newFileName` | string | Yes | Display name for the replacement file |
| `newFileUrl` | string | Yes | Remote url/path to the replacement file |

```json
{
  "documentId": "doc_123",
  "reason": "Renewed the ID card with correct spelling",
  "newFileName": "Identity Card Renewed",
  "newFileUrl": "https://storage.googleapis.com/bucket/my_national_id_new.pdf"
}
```

##### Response — `201 Created`

```json
{
  "success": true,
  "message": "Update request submitted successfully",
  "data": {
    "id": "req_789",
    "documentId": "doc_123",
    "reason": "Renewed the ID card with correct spelling",
    "newFileName": "Identity Card Renewed",
    "newFileUrl": "https://storage.googleapis.com/bucket/my_national_id_new.pdf",
    "status": "PENDING",
    "createdAt": "2026-06-16T13:30:00.000Z"
  }
}
```

##### Command
```bash
curl -X POST http://localhost:4000/api/v1/employee/document/update-request \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_123","reason":"Renewed card","newFileName":"Identity Card Renewed","newFileUrl":"https://storage.googleapis.com/bucket/my_national_id_new.pdf"}'
```

---

#### Employee: Get My Update Requests

Retrieve the status of all document update requests made by the authenticated user.

**`GET /api/v1/employee/document/update-status`** — Auth: Bearer token | Roles: `STAFF`, `TEAM_LEAD`, `ADMIN`, `HR`

##### Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "req_789",
      "documentId": "doc_123",
      "reason": "Renewed the ID card with correct spelling",
      "newFileName": "Identity Card Renewed",
      "status": "PENDING",
      "remarks": null,
      "createdAt": "2026-06-16T13:30:00.000Z"
    }
  ]
}
```

##### Command
```bash
curl http://localhost:4000/api/v1/employee/document/update-status \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Chat & Collaboration

Real-time message broadcasting and conversation channels for workgroups. Note that client connections are established via WebSockets/Socket.io (`/chat` namespace) while core state changes, historical pagination, and queries occur via REST endpoints.

#### Create Channel

**`POST /api/v1/chat/channels`** — Auth: Bearer token | Roles: Any

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `channelName` | string | Yes | Name of the channel |
| `description` | string | No | Optional description |
| `channelType` | enum | Yes | `PUBLIC`, `PRIVATE`, `DIRECT` |
| `memberIds` | array of strings (UUID) | No | Initial member IDs to add |

```json
{
  "channelName": "Tech Talk",
  "description": "General discussions about technical stacks and frameworks",
  "channelType": "PUBLIC",
  "memberIds": ["usr_111", "usr_222"]
}
```

##### Response — `201 Created`

```json
{
  "message": "Channel created successfully",
  "data": {
    "id": "chan_001",
    "channelName": "Tech Talk",
    "description": "General discussions about technical stacks and frameworks",
    "channelType": "PUBLIC",
    "workspaceId": "ws_123",
    "createdById": "usr_456",
    "createdAt": "2026-06-16T14:00:00.000Z"
  }
}
```

##### Command
```bash
curl -X POST http://localhost:4000/api/v1/chat/channels \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"channelName":"Tech Talk","channelType":"PUBLIC"}'
```

---

#### Get Channels

Retrieve all channels the user is a member of within the current workspace.

**`GET /api/v1/chat/channels`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "message": "Channels retrieved successfully",
  "data": [
    {
      "id": "chan_001",
      "channelName": "Tech Talk",
      "channelType": "PUBLIC",
      "workspaceId": "ws_123"
    }
  ]
}
```

---

#### Get Channel Details

**`GET /api/v1/chat/channels/:channelId`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "message": "Channel details retrieved successfully",
  "data": {
    "id": "chan_001",
    "channelName": "Tech Talk",
    "description": "General discussions about technical stacks and frameworks",
    "channelType": "PUBLIC",
    "members": [
      {
        "userId": "usr_111",
        "user": { "firstName": "Alice", "lastName": "Smith", "email": "alice@company.com" }
      }
    ]
  }
}
```

---

#### Update Channel

**`PATCH /api/v1/chat/channels/:channelId`** — Auth: Bearer token | Roles: Any

##### Request Body (all optional)

| Field | Type | Description |
| --- | --- | --- |
| `channelName` | string | New channel name |
| `description` | string | New description |
| `channelType` | enum | `PUBLIC`, `PRIVATE`, `DIRECT` |

```json
{
  "channelName": "Tech Support",
  "description": "Help channel for engineering infrastructure issues"
}
```

##### Response — `200 OK`

```json
{
  "message": "Channel updated successfully",
  "data": {
    "id": "chan_001",
    "channelName": "Tech Support",
    "description": "Help channel for engineering infrastructure issues"
  }
}
```

---

#### Delete Channel

**`DELETE /api/v1/chat/channels/:channelId`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Channel deleted successfully"
}
```

---

#### Add Channel Members

**`POST /api/v1/chat/channels/:channelId/members`** — Auth: Bearer token | Roles: Any

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `memberIds` | array of strings (UUID) | Yes | User IDs to add to the channel |

```json
{
  "memberIds": ["usr_333", "usr_444"]
}
```

##### Response — `200 OK`

```json
{
  "message": "Members added successfully",
  "data": {
    "count": 2
  }
}
```

---

#### Remove Channel Member

**`DELETE /api/v1/chat/channels/:channelId/members/:targetUserId`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "message": "Member removed successfully"
}
```

---

#### Send Message

Publish a message to a channel. This records it in the DB and broadcasts it via WebSocket.

**`POST /api/v1/chat/messages`** — Auth: Bearer token | Roles: Any

##### Request Body

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `channelId` | string (UUID) | Yes | Recipient channel ID |
| `message` | string | Yes | Text content of the message |
| `messageType` | string | No | Defaults to `TEXT` (e.g. `TEXT`, `FILE`, `IMAGE`) |
| `fileUrl` | string | No | Optional attachment url |
| `fileName` | string | No | Optional attachment filename |

```json
{
  "channelId": "chan_001",
  "message": "Hello team, let's review the new design files.",
  "messageType": "TEXT"
}
```

##### Response — `201 Created`

```json
{
  "message": "Message sent successfully",
  "data": {
    "id": "msg_001",
    "channelId": "chan_001",
    "senderId": "usr_111",
    "message": "Hello team, let's review the new design files.",
    "messageType": "TEXT",
    "fileUrl": null,
    "fileName": null,
    "createdAt": "2026-06-16T14:15:00.000Z"
  }
}
```

---

#### Update Message

**`PATCH /api/v1/chat/messages/:messageId`** — Auth: Bearer token | Roles: Any

##### Request Body

```json
{
  "message": "Hello team, let's review the new design files. (Updated)"
}
```

##### Response — `200 OK`

```json
{
  "message": "Message updated successfully",
  "data": {
    "id": "msg_001",
    "message": "Hello team, let's review the new design files. (Updated)",
    "updatedAt": "2026-06-16T14:16:00.000Z"
  }
}
```

---

#### Delete Message

**`DELETE /api/v1/chat/messages/:messageId`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

#### Get Channel Messages

Fetch conversation history inside a channel. Supports pagination.

**`GET /api/v1/chat/channels/:channelId/messages`** — Auth: Bearer token | Roles: Any

##### Query Parameters

| Field | Type | Default | Description |
| --- | --- | :---: | --- |
| `page` | number | `1` | Page offset |
| `limit` | number | `50` | Page limit (max 100) |

##### Response — `200 OK`

```json
{
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "id": "msg_001",
        "channelId": "chan_001",
        "senderId": "usr_111",
        "message": "Hello team",
        "createdAt": "2026-06-16T14:15:00.000Z",
        "sender": { "firstName": "Alice", "lastName": "Smith" }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1
    }
  }
}
```

---

#### Mark Message as Read

Confirm that a user has viewed a specific message.

**`POST /api/v1/chat/messages/:messageId/read`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "message": "Message marked as read",
  "data": {
    "success": true
  }
}
```

---

#### Get Unread Message Count

Retrieve the count of unread messages across all channels for the user in the current workspace context.

**`GET /api/v1/chat/unread`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 12
  }
}
```

---

#### Search Messages

Search conversational logs for keywords.

**`GET /api/v1/chat/search`** — Auth: Bearer token | Roles: Any

##### Query Parameters

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `query` | string | Yes | Text segment to look for |
| `filter` | string | No | Optional category / channel ID filter |

##### Response — `200 OK`

```json
{
  "message": "Search results retrieved successfully",
  "data": [
    {
      "id": "msg_001",
      "channelId": "chan_001",
      "message": "Found the design review files",
      "createdAt": "2026-06-16T14:15:00.000Z",
      "channel": { "channelName": "Tech Talk" }
    }
  ]
}
```

---

#### Get Chat Notifications

Retrieve recent chat-related push and email notification templates generated for the user.

**`GET /api/v1/chat/notifications`** — Auth: Bearer token | Roles: Any

##### Response — `200 OK`

```json
{
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "id": "notif_001",
      "title": "New Message from Alice",
      "body": "Alice: Hello team...",
      "createdAt": "2026-06-16T14:15:05.000Z"
    }
  ]
}
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
