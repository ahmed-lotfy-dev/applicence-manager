# Desktop Activation Platform

Unified platform to manage activation for multiple desktop apps.

## What this includes
- `apps/backend`: Activation server + admin APIs + PostgreSQL schema bootstrap
- `apps/frontend`: Web admin UI for apps, users, subscriptions, licenses, and activation logs

Each app can have its own policy:
- `license_device_binding` (recommended default)
- `license_only`

## Local setup
1. Create PostgreSQL database
2. Copy `apps/backend/.env.example` to `apps/backend/.env`
3. Install dependencies

```bash
bun install
```

4. Run backend and frontend

```bash
bun run dev
```

Run one app only:

```bash
bun run dev:backend
bun run dev:frontend
```

Build:

```bash
bun run build
bun run build:backend
bun run build:frontend
```

## Admin protection (required)
Admin routes are protected and require secure admin sign-in.

Set these in `apps/backend/.env`:

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

## Deployment under one domain (frontend + backend)
Use one host and proxy backend inside frontend domain:
- `https://activation.ahmedlotfy.site/` => frontend SPA
- `https://activation.ahmedlotfy.site/api/*` => backend API (proxied)

Included ready Nginx config:
- `deploy/nginx.activation.conf`

### Deploy steps
1. Build frontend and place files in `/var/www/activation/frontend`:

```bash
bun run build:frontend
```

2. Run backend on port `8000`:

```bash
bun run start:backend
```

3. Set backend env (`apps/backend/.env`) to same domain:

```env
FRONTEND_ORIGIN=https://activation.ahmedlotfy.site
```

4. Copy Nginx file and enable it:

```bash
sudo cp deploy/nginx.activation.conf /etc/nginx/sites-available/activation.ahmedlotfy.site
sudo ln -s /etc/nginx/sites-available/activation.ahmedlotfy.site /etc/nginx/sites-enabled/activation.ahmedlotfy.site
sudo nginx -t
sudo systemctl reload nginx
```

Note: The backend now uses secure cookie sessions (`HttpOnly`, `SameSite=Strict`, and `Secure` in production HTTPS). The frontend no longer stores auth tokens in `localStorage`.
# AppLicence-Manager
