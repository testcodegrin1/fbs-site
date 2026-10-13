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

## Endpoints (Franchise, Vendor & Banner System)

### 1. Franchise Management
| Method | Path | Description | Access |
| ------ | ---- | ----------- | ------ |
| GET    | `/api/getFranchises` | List all franchises (`?includeInactive=true`) | Public / Admin |
| GET    | `/api/getFranchises/:id` | Get franchise details by ID | Public / Admin |
| POST   | `/api/createFranchise` | Create new franchise (multipart/form-data or JSON) | Super Admin (`franchises:manage`) |
| PUT    | `/api/updateFranchise/:id` | Update franchise details or active status | Super Admin (`franchises:manage`) |
| DELETE | `/api/deleteFranchise/:id` | Delete a franchise | Super Admin (`franchises:manage`) |

### 2. Vendor Franchise Access & Approvals
| Method | Path | Description | Access |
| ------ | ---- | ----------- | ------ |
| GET    | `/api/auth/franchises` | Active franchises list for login/register dropdown | Public |
| POST   | `/api/auth/login` | Login with franchise check (`role: "user"`, `franchiseId`). Auto-creates pending request if unapproved | Public |
| GET    | `/api/getUserRequests` | List vendor franchise access requests (`?status=pending\|approved\|rejected`, `?franchiseId`) | Super Admin (`franchises:manage`) |
| PUT    | `/api/updateUserRequestStatus/:id` | Approve or reject vendor access request (`status: "approved"\|"rejected"`, `rejectionReason`) | Super Admin (`franchises:manage`) |

### 3. Banner Templates & Variations
| Method | Path | Description | Access |
| ------ | ---- | ----------- | ------ |
| GET    | `/api/getBannerTemplates` | List banner templates (`?franchiseId`, `?orientation`, `?includeInactive`) | Authenticated |
| GET    | `/api/getBannerTemplate/:id` | Get template by ID with images array & custom fields | Authenticated |
| POST   | `/api/createBannerTemplate` | Create banner template with images atomically (`image_url`, `image_name`, `sort_order`) | Super Admin (`franchises:manage`) |
| PUT    | `/api/updateBannerTemplate/:id` | Update template with images array atomically | Super Admin (`franchises:manage`) |
| DELETE | `/api/deleteBannerTemplate/:id` | Delete banner template | Super Admin (`franchises:manage`) |

## Environment

See `.env.example`. `CORS_ORIGINS` must include the frontend origin(s) when the browser talks to this API directly.
