# Progress Snapshot

Date: 2026-02-25  
Scope: Work completed up to this moment

## Update 2026-02-25 (user_id tenancy decision)
- Confirmed architecture decision: `user_id` is the tenant boundary (no separate tenant tables for now).
- Reworked backend ownership model to user-scoped data on:
  - `apps.user_id`
  - `licenses.user_id`
  - `activation_logs.user_id`
  - `activations.user_id` (already existed; now used consistently)
- Added migration: `apps/backend/drizzle/0004_solid_user_scope.sql`.
- Refactored backend routes/services to enforce user-scoped reads/writes for app, license, and activation admin endpoints.
- Added auth utility to resolve current user from active session:
  - `apps/backend/src/lib/request-auth.ts`

## Update 2026-02-25 (feature 1 started: clients + invoices)
- Added backend schema tables:
  - `clients`
  - `invoices`
- Added migration:
  - `apps/backend/drizzle/0005_bright_freelancer_core.sql`
- Added backend routes:
  - `/api/clients`
  - `/api/invoices`
  - `/api/invoices/stats`
- Added frontend data support:
  - new types (`Client`, `Invoice`, `BillingStats`)
  - API client methods for clients and invoices
  - dashboard hook state/actions for clients/invoices and billing stats
- Added new dashboard section:
  - `FreelanceOpsPanel` with create/list/delete clients
  - create/list/update/delete invoices
  - billing summary cards (invoiced, paid, outstanding)

## Update 2026-02-25 (invoice PDF async pipeline)
- Added freelancer branding profile storage:
  - table: `freelancer_profiles`
  - endpoint: `/api/freelancer-profile` (`GET`, `PUT`)
- Added async invoice PDF queue:
  - table: `invoice_pdf_jobs`
  - queue endpoint: `POST /api/invoices/:id/generate-pdf`
  - status endpoint: `GET /api/invoices/:id/pdf-status`
  - file endpoint: `GET /api/invoices/:id/pdf`
- Added PDF worker process:
  - `apps/backend/src/workers/invoice-pdf-worker.ts`
  - scripts: `dev:worker:pdf`, `start:worker:pdf`
- Added PDF rendering service with optional logo URL support and saved output files.

## Update 2026-02-25 (logo upload hardening: R2 + WebP)
- Replaced manual logo URL entry with backend upload pipeline:
  - `POST /api/freelancer-profile/logo` accepts image file upload.
- Added server-side image processing:
  - convert uploaded logo to WebP
  - resize/compress before storage
- Added Cloudflare R2 object storage integration:
  - upload processed logo
  - store returned public URL and object key in profile
  - replace old object on re-upload
- Added DB support for object-key tracking:
  - `freelancer_profiles.logo_object_key`
- Applied SOLID layering for this feature:
  - storage abstraction (`ObjectStorage`)
  - concrete R2 implementation (`R2ObjectStorage`)
  - image processor abstraction (`ImageProcessor`)
  - concrete Sharp implementation (`SharpImageProcessor`)
  - orchestration service (`FreelancerLogoService`)

## Update 2026-02-25 (rebrand)
- Rebranded core product naming to `Fawtarly` across frontend and backend:
  - frontend app title/login/header/loading labels
  - backend OpenAPI title, startup log, and health root text
  - root package name and key documentation titles

## What is already done
- Built and wired backend API for:
  - App catalog CRUD (`/api/apps`)
  - License admin CRUD/status (`/api/licenses`)
  - Public license flows (`/api/v1/license/activate|validate|deactivate`)
  - Activation management and stats (`/api/activations`)
- Added middleware stack in backend:
  - Auth guard
  - CSRF protection
  - Security headers
  - Rate limiting
  - CORS with same-origin proxy support in production
  - OpenAPI docs endpoint (`/docs`)
- Refactored frontend dashboard:
  - App management inside licensing panel
  - License inventory with edit/revoke/activate/delete actions
  - Machine-locked license creation flow
  - Filtered license listing by app name
- Added schema support for `shop_name` in activations.
- Updated README and deployment documentation.

## Key recent commits
- `cc906a3` feat(licenses): show machine-bound vs dynamic license type in inventory
- `0b44db9` align public license API responses and frontend client types
- `d31db4a` refactor license panel UI and add machine-locked license flow
- `00db7cc` docs: refine README structure and deployment guide

## Current in-repo planning docs
- Freelancer SaaS expansion design:
  - [2026-02-25-freelancer-saas-brainstorm.md](/mnt/hdd/projects/desktop/app-licensing/docs/work-done/2026-02-25-freelancer-saas-brainstorm.md)

## Current working tree state
- Modified:
  - `package.json` (format/order only; no behavior change)
- Untracked:
  - `docs/work-done/` (new docs)
  - `work-done/` (top-level folder exists)
  - `apps/backend/src/test-write.txt` (empty file)

## Not done yet
- Per-user license signing key system (replace current single global secret model).
- Freelancer business modules (clients, projects, invoices, payments, hosting)
- Licensing hardening redesign (asymmetric signing, key rotation, challenge-response)

## Recommended next implementation step
1. Start Phase 1 from the brainstorm doc:
   - Add per-user signing keys and `kid` support for issued licenses
   - Replace HMAC activation/license signing flow with per-user key material
   - Add key rotation and revocation checks

## Update protocol for this file
1. Keep appending by date under a new section: `## Update YYYY-MM-DD`.
2. Record only factual changes (what merged, what exists, what is blocked).
3. Keep “Not done yet” current so this file stays useful as a handoff.
