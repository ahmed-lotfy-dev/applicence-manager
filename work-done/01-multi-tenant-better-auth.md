# Freelancer SaaS - Multi-Tenant App Licensing Platform

**Date:** 2026-02-25
**Status:** In Progress

---

## Project Overview

Transform the existing app licensing tool into a full freelancer SaaS platform for managing:
- Client management
- Project/job tracking
- Payment tracking
- Hosting/domain tracking
- App licensing (as one feature)

**Multi-tenancy approach:** Each user (freelancer) = tenant. All data filtered by `userId`.

---

## What Was Done

### 1. Initial Brainstorming

Asked user about:
- Auth method → Hybrid (social login + portal)
- License algorithm → Tenant-configurable (each freelancer can customize)
- Features → All (clients, projects, payments, hosting, domains, time tracking, invoicing)
- Hosting tracking → Basic (provider info only)
- Build priority → App licensing is already functional, scan and advise

### 2. Project Scanning

Analyzed existing codebase:

| Component | Technology |
|----------|------------|
| Backend | Bun + Elysia |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Frontend | React + Vite |
| Auth | Single admin (env-based) |

**Existing Tables:**
- `users` - single admin user
- `sessions` - admin sessions
- `accounts` - (placeholder)
- `managedApps` - apps for licensing
- `licenses` - license keys
- `activations` - machine activations
- `activationLogs` - activation history

### 3. Implemented Multi-Tenancy with Better Auth

#### Step 1: Install Better Auth
- Added `better-auth` to project (later moved to backend only)

#### Step 2: Environment Variables
Added to `.env`:
```env
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=http://localhost:8000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Step 3: Created auth.ts
- Better Auth setup with GitHub + Google social providers
- Drizzle adapter for PostgreSQL

#### Step 4: Updated auth-schema.ts
Added `userId` to all tables for multi-tenancy:
- `managedApps` - now has `userId`
- `licenses` - now has `userId`
- `activations` - now has `userId`
- `activationLogs` - now has `userId`

#### Step 5: Updated middleware/auth.ts
- Replaced custom session check with Better Auth's `auth.api.getSession()`
- Public paths: `/api/auth/*`, `/api/csrf`, `/health`, `/`, `/docs`, `/api/v1/license/*`

#### Step 6: Updated index.ts
- Mounted Better Auth handler: `.mount(auth.handler)`

#### Step 7: Updated services

**apps.ts:**
- `getOrCreateAppByName(userId, appName)` - filtered by userId
- `getAppByIdentifier(userId, appName)` - filtered by userId
- `listApps(userId)` - filtered by userId
- `getAppById(userId, appId)` - filtered by userId
- `updateApp(userId, appId, input)` - filtered by userId
- `deleteApp(userId, appId)` - filtered by userId

**licensing.ts:**
- `issueLicense({ userId, ... })` - added userId
- `listLicenses(userId, appName)` - filtered by userId
- `getLicenseById(userId, licenseId)` - filtered by userId
- `setLicenseStatus(userId, licenseId, status)` - filtered by userId
- `updateLicenseById(userId, licenseId, input)` - filtered by userId
- `deleteLicenseById(userId, licenseId)` - filtered by userId
- `activateLicense({ userId, ... })` - added userId
- `validateActivation({ userId, ... })` - added userId
- `deactivateActivation({ userId, ... })` - added userId

#### Step 8: Updated routes

**routes/licenses.ts:**
- Added `getUserIdFromStore()` helper
- All endpoints now pass `userId` to services

**routes/apps.ts:**
- Added `getUserIdFromStore()` helper
- All endpoints now pass `userId` to services

**routes/activations.ts:**
- All queries filtered by `userId`

**routes/license-public.ts:**
- Public activation endpoints now find `userId` by license key
- License lookup uses `userId` for validation

#### Step 9: Removed better-auth from root
- Removed from top-level `package.json` (should be in backend only)

---

## What Needs to Be Done

### Backend
- [ ] Generate database migration: `bun run db:generate && bun run db:migrate`
- [ ] Fix any TypeScript errors
- [ ] Test the API endpoints

### Frontend
- [ ] Update `auth-client.ts` to use Better Auth client
- [ ] Update `LoginPage.tsx` with social login buttons
- [ ] Update `App.tsx` to use Better Auth session

### Environment Setup
- [ ] Generate BETTER_AUTH_SECRET: `openssl rand -hex 32`
- [ ] Add GitHub OAuth app credentials
- [ ] Add Google OAuth credentials
- [ ] Remove old ADMIN_EMAIL, ADMIN_PASSWORD vars

---

## File Changes Summary

| File | Action |
|------|--------|
| `apps/backend/.env` | Added Better Auth vars |
| `apps/backend/src/auth.ts` | **NEW** - Better Auth setup |
| `apps/backend/src/db/auth-schema.ts` | Modified - added userId |
| `apps/backend/src/middleware/auth.ts` | Modified - Better Auth |
| `apps/backend/src/index.ts` | Modified - mount auth.handler |
| `apps/backend/src/services/apps.ts` | Modified - userId filtering |
| `apps/backend/src/services/licensing.ts` | Modified - userId filtering |
| `apps/backend/src/routes/apps.ts` | Modified - pass userId |
| `apps/backend/src/routes/licenses.ts` | Modified - pass userId |
| `apps/backend/src/routes/activations.ts` | Modified - userId filtering |
| `apps/backend/src/routes/license-public.ts` | Modified - find userId |
| `package.json` | Removed better-auth |

---

## Multi-Tenancy Logic

```
Every query includes: now WHERE userId = 'current-user-id'

This ensures:
- Each freelancer only sees their own clients
- Each freelancer only sees their own projects
- Each freelancer only sees their own licenses
- Each freelancer only sees their own activations
- Public license activation finds the correct owner via license key
```

---

## Next Steps

1. Generate and run migrations
2. Set up OAuth credentials (GitHub + Google)
3. Test the full auth flow
4. Build frontend integration

---

*Last updated: 2026-02-25*
