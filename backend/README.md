# FBS Backend

Standalone auth/API service for FBS Prints. Owns MySQL access so the frontend can stay separate and the database can be hosted independently later.

## Setup

1. Copy `.env.example` to `.env` and fill in MySQL credentials.
2. Apply the schema:

```bash
mysql -u USER -p DATABASE < database/auth-schema.sql
```

3. Install and run:

```bash
npm install
npm run dev
```

API defaults to `http://localhost:4000`.

On first auth/database initialization, the backend seeds roles, permissions, and
one super-admin account if it does not already exist:

```text
Email: superadmin@fbsprints.com
Password: SuperAdmin@2026
Login: /superadmin/login
```

Override `DEFAULT_SUPERADMIN_EMAIL`, `DEFAULT_SUPERADMIN_NAME`, and
`DEFAULT_SUPERADMIN_PASSWORD` before starting the backend if you want different
initial credentials.

## Endpoints

| Method     | Path                           | Description                |
| ---------- | ------------------------------ | -------------------------- |
| GET        | `/health`                      | Health check               |
| POST       | `/api/auth/login`              | Login + set session cookie |
| POST       | `/api/auth/logout`             | Clear session cookie       |
| GET        | `/api/auth/me`                 | Current user               |
| GET/POST   | `/api/users`                   | List / create users        |
| put/DELETE | `/api/users/:id`               | Update / delete user       |
| GET        | `/api/roles`                   | List roles + permissions   |
| put        | `/api/roles/:role/permissions` | Update role permissions    |

## Environment

See `.env.example`. `CORS_ORIGINS` must include the frontend origin(s) when the browser talks to this API directly.
