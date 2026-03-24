# Quick Setup Commands

## 1. Generate Better Auth Secret

```bash
openssl rand -hex 32
```

Add to `.env`:
```env
BETTER_AUTH_SECRET=paste_generated_string_here
BETTER_AUTH_URL=http://localhost:8000
```

## 2. GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. New OAuth App
3. Settings:
   - Homepage URL: http://localhost:3000
   - Callback URL: http://localhost:8000/api/auth/callback/github
4. Copy Client ID and Secret to `.env`

## 3. Google OAuth Setup

1. Go to https://console.cloud.google.com
2. Create project → Credentials → OAuth Client ID
3. Settings:
   - Authorized JavaScript origins: http://localhost:3000
   - Authorized redirect URIs: http://localhost:8000/api/auth/callback/google
4. Copy Client ID and Secret to `.env`

## 4. Database Migration

```bash
cd apps/backend
bun run db:generate
bun run db:migrate
```

## 5. Run Dev Server

```bash
bun run dev
```

## 6. Remove Old Admin Variables

From `.env`, remove or comment:
```env
# ADMIN_EMAIL=...
# ADMIN_PASSWORD=...
```
