# App Licence Manager

Unified platform for licensing and activation of desktop applications.

## Monorepo structure
- `apps/backend`: Activation API, admin APIs, security middleware, and PostgreSQL access.
- `apps/frontend`: Admin web app for apps, users, subscriptions, licenses, and activation logs.
- `docs/`: Portfolio and screenshots for project documentation.

Supported licensing policies per app:
- `license_device_binding` (recommended default)
- `license_only`

## Quick start
1. Create a PostgreSQL database.
2. Copy `apps/backend/.env.example` to `apps/backend/.env`.
3. Install dependencies:

```bash
bun install
```

4. Start backend and frontend:

```bash
bun run dev
```

Run a single app:

```bash
bun run dev:backend
bun run dev:frontend
```

Build commands:

```bash
bun run build
bun run build:backend
bun run build:frontend
```

## Required security configuration
Admin routes require secure credentials and token secrets.

Set these values in `apps/backend/.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-very-strong-password
# Optional alternative to ADMIN_PASSWORD:
# ADMIN_PASSWORD_HASH=$2b$12$your-bcrypt-hash
JWT_SECRET=long-random-secret-at-least-32-chars
LICENSE_TOKEN_SECRET=another-long-random-secret-at-least-32-chars
ACTIVATION_TOKEN_TTL_DAYS=30
DB_SSL_MODE=require
```

Backend sessions use secure cookies (`HttpOnly`, `SameSite=Strict`, and `Secure` in production HTTPS). The frontend does not store auth tokens in `localStorage`.

## Deployment under one domain
Recommended setup:
- `https://activation.ahmedlotfy.site/` serves the frontend SPA.
- `https://activation.ahmedlotfy.site/api/*` proxies to backend APIs.

Nginx config is included at `deploy/nginx.activation.conf`.

Deployment flow:
1. Build frontend assets and place them in `/var/www/activation/frontend`:

```bash
bun run build:frontend
```

2. Start backend on port `8000`:

```bash
bun run start:backend
```

3. Configure backend origin in `apps/backend/.env`:

```env
FRONTEND_ORIGIN=https://activation.ahmedlotfy.site
```

4. Install and enable Nginx site:

```bash
sudo cp deploy/nginx.activation.conf /etc/nginx/sites-available/activation.ahmedlotfy.site
sudo ln -s /etc/nginx/sites-available/activation.ahmedlotfy.site /etc/nginx/sites-enabled/activation.ahmedlotfy.site
sudo nginx -t
sudo systemctl reload nginx
```

## Portfolio assets
- `docs/portfolio/applicence-manager-project.md`: Project entry data for portfolio forms.
- `docs/portfolio/applicence-manager-case-study.md`: Full case study.
- `docs/screenshots/`: UI and deployment screenshots.
