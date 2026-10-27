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

## Endpoints (Product System)

### Product Templates & Variations
| Method | Path | Description | Access |
| ------ | ---- | ----------- | ------ |
| GET    | `/api/getProductTemplates` | List product templates (`?orientation`, `?includeInactive`) | Authenticated |
| GET    | `/api/getProductTemplate/:id` | Get template by ID with images array & custom fields | Authenticated |
| POST   | `/api/createProductTemplate` | Create product template with images atomically (`image_url`, `image_name`, `sort_order`) | Super Admin (`product_templates:manage`) |
| PUT    | `/api/updateProductTemplate/:id` | Update template with images array atomically | Super Admin (`product_templates:manage`) |
| DELETE | `/api/deleteProductTemplate/:id` | Delete product template | Super Admin (`product_templates:manage`) |

## Environment

See `.env.example`. `CORS_ORIGINS` must include the frontend origin(s) when the browser talks to this API directly.
