# Freelancer Ops + Licensing Platform Brainstorm

Date: 2026-02-25  
Status: Draft v1 (ready to implement in phases)  
Owner: Ahmed (primary tenant owner)

> Update (2026-02-25): Current implementation direction uses `user_id` as tenancy boundary (single workspace per user) instead of separate `tenants` tables for phase 1.

## 1) Goal
Expand the current Fawtarly platform into a freelancer operations system where licensing is one module, not the whole product.

Core outcomes:
- Track freelance clients, projects, contracts, invoices, and payments.
- Track hosting ownership and costs (especially projects hosted on your VPS).
- Keep licensing management inside the same app.
- Support multi-tenant architecture by `user_id` / tenant ownership.
- Keep license generation and verification hard to abuse or clone.

## 2) Product Scope (MVP -> v2)
MVP modules:
- CRM: clients, contacts, status, notes.
- Projects: scope, milestones, deadlines, delivery status.
- Billing: invoices, payment records, amount paid, remaining due.
- Hosting tracking: where each project is hosted, domain, server/VPS cost share, renewal dates.
- Licensing: app registry, licenses, activations, revocations (existing capability).

v2 modules:
- Time tracking and profitability dashboard.
- Contract file management and e-sign integration.
- Automated invoice reminders and recurring billing.
- Tenant-level custom branding and client portal.

## 3) Architecture Options
### Option A: Single-user app + lightweight isolation
- Keep current schema and attach records directly to `users.id`.
- Fastest path, lowest migration complexity.
- Weak for future team collaboration and B2B resale.

### Option B: Full workspace multi-tenant from day one
- Add `tenants` + `tenant_memberships`; all business rows include `tenant_id`.
- Strong isolation and future-proofing.
- More migration and policy work now.

### Option C (Recommended): Hybrid now, strict tenancy model
- Create `tenants` now, but bootstrap each existing user with one personal tenant.
- Use `tenant_id` everywhere for business entities.
- Treat “multi-tenant by userId” as `tenant.owner_user_id = users.id` for your personal workspace.
- Gives immediate personal workflow + future team/client expansion without rewrite.

Why Option C:
- Preserves your current single-owner workflow.
- Keeps data model clean for future SaaS expansion.
- Avoids painful re-architecture when adding other freelancers.

## 4) Recommended Domain Model
Tables to add:
- `tenants`: `id`, `owner_user_id`, `name`, `slug`, `plan`, timestamps.
- `tenant_memberships`: `id`, `tenant_id`, `user_id`, `role` (`owner|admin|member|viewer`).
- `clients`: `id`, `tenant_id`, `name`, `billing_email`, `phone`, `notes`, `status`.
- `projects`: `id`, `tenant_id`, `client_id`, `name`, `type`, `status`, `budget_total`, `currency`.
- `project_milestones`: `id`, `project_id`, `name`, `due_date`, `amount`.
- `invoices`: `id`, `tenant_id`, `project_id`, `client_id`, `invoice_no`, `total`, `paid`, `due`, `status`, `due_date`.
- `payments`: `id`, `tenant_id`, `invoice_id`, `amount`, `method`, `paid_at`, `reference`.
- `hosting_assets`: `id`, `tenant_id`, `project_id`, `provider`, `server_name`, `domain`, `cost_monthly`, `renewal_date`, `hosted_by_you`.

Existing licensing tables to update:
- `apps`, `licenses`, `activations`, `activation_logs` all get `tenant_id`.
- Index all tenant-scoped queries with `(tenant_id, ...)`.

## 5) Tenant Isolation Rules
- Every authenticated request resolves active tenant context (`tenant_id`).
- API refuses access when user is not a member of the requested tenant.
- All reads/writes are filtered by `tenant_id`.
- If using Postgres RLS later, enforce `tenant_id` checks in DB as a second barrier.
- Internal admin endpoints must still respect tenant scope except platform super-admin tools.

Personal mode:
- Your account auto-creates a default tenant (example: `ahmed-main`).
- Licensing algorithm policy can be configured as:
  - `private_only`: advanced license issuance enabled only for your tenant.
  - `shared`: available to all tenants with per-tenant signing keys and quotas.

## 6) Licensing Security Redesign (Critical)
Important principle: if logic is shipped to users, it can be reverse engineered. Security should depend on secret key custody, not hidden algorithms.

Recommended design:
- Move from simple random key style to signed license documents.
- License format: `base64(payload).base64(signature)` or compact JWT/JWS-like token.
- Use asymmetric signatures (`Ed25519` recommended).
- Keep private signing keys server-side only (prefer KMS/HSM or secured env rotation process).
- Client apps only receive public key(s) for verification.

Payload claims:
- `lic_id`, `tenant_id`, `app_id`, `customer_id`
- `plan`, `max_activations`, `issued_at`, `expires_at`
- optional hardware policy (`machine_lock_mode`)
- optional feature flags

Activation hardening:
- Challenge-response activation with nonce + short TTL.
- Signed activation receipt bound to `machine_id` and license id.
- Rate-limit activation attempts; detect anomaly spikes.
- Store audit trail for issuance, validation failures, revocations.

Anti-cloning strategy:
- Key rotation support (`kid` claim).
- Revoke list or status endpoint for high-risk apps.
- Optional periodic online revalidation for sensitive products.
- Do not expose private signing code/path to tenant-facing customization.

## 7) “Only for me” vs “For all freelancers”
Two safe operating modes:

### Mode 1: Private licensing engine (for your own products)
- Only your tenant can issue “strong signed licenses.”
- Other freelancers can use CRM/Billing/Hosting modules.
- Lowest business and abuse risk.

### Mode 2: Shared licensing engine
- All tenants can issue licenses, but each tenant gets isolated signing key material.
- Enforce per-tenant quotas, abuse controls, and stricter logs.
- More complex operations and support burden.

Recommendation:
- Start with Mode 1.
- Keep code structured so Mode 2 can be enabled by feature flag later.

## 8) Migration Plan from Current App
Phase 1 (schema foundation):
- Add `tenants` + `tenant_memberships`.
- Backfill existing records under your default tenant.
- Add `tenant_id` to current licensing tables.

Phase 2 (freelancer modules):
- Build Clients, Projects, Invoices, Payments, Hosting CRUD.
- Add dashboard metrics: total earned, unpaid balance, hosting liability, project health.

Phase 3 (licensing hardening):
- Introduce signed license payloads and key management.
- Add activation challenge-response and monitoring.
- Migrate legacy keys to new token format with compatibility window.

Phase 4 (multi-tenant enablement):
- Invite members to tenant.
- Optional tenant onboarding + billing for external freelancers.

## 9) API Boundary Proposal
Route groups:
- `/api/tenant/*` tenant switch + membership
- `/api/clients/*`
- `/api/projects/*`
- `/api/invoices/*`
- `/api/payments/*`
- `/api/hosting/*`
- `/api/licensing/*` (tenant-scoped admin)
- `/api/license-public/*` (activation/validation endpoints for distributed apps)

Cross-cutting middleware:
- auth check
- tenant membership guard
- rate limit
- audit logging

## 10) Frontend IA (Information Architecture)
Navigation proposal:
- Overview
- Clients
- Projects
- Billing
- Hosting
- Licensing
- Settings

Overview widgets:
- Revenue this month
- Paid vs unpaid invoices
- VPS-hosted clients count
- Active licenses
- Pending activations
- Upcoming renewals

## 11) Risks and Mitigations
- Risk: Data leakage across tenants.
  - Mitigation: mandatory `tenant_id` filters + tests + optional DB RLS.
- Risk: License forgery attempts.
  - Mitigation: asymmetric signatures, key custody, challenge-response, rate limits.
- Risk: Migration regressions.
  - Mitigation: staged rollout, compatibility mode, migration scripts with rollback plans.
- Risk: Scope explosion.
  - Mitigation: strict MVP boundaries and feature flags.

## 12) Definition of Done (MVP)
- You can create clients/projects/invoices/payments/hosting records per tenant.
- Dashboard shows how much got paid and by which client.
- Hosting panel clearly shows projects hosted on your VPS and monthly cost impact.
- Licensing remains functional under tenant scope.
- New secure license issuance path is active for your tenant.
- Core endpoints are covered by auth + tenant isolation tests.

## 13) Editing + Continuation Instructions
When returning to this file:
1. Update `Status` and add a short “What changed today” note at top.
2. Keep decisions in a changelog block (date, decision, reason).
3. If architecture changes, update sections 3, 4, 5, and 6 first.
4. If implementation starts, create a sibling plan file:
   - `docs/work-done/2026-02-25-freelancer-saas-implementation-plan.md`
5. Track completion by phase checkboxes:
   - [ ] Phase 1
   - [ ] Phase 2
   - [ ] Phase 3
   - [ ] Phase 4

Decision log template:
- `YYYY-MM-DD`: Decision
- Reason
- Impact

## 14) First Concrete Build Sequence
1. Introduce `tenants` and `tenant_memberships` migrations.
2. Add `tenant_id` columns + indexes to existing licensing tables.
3. Implement tenant guard middleware in backend.
4. Add frontend tenant context and pass tenant to API calls.
5. Build Clients + Invoices minimal CRUD.
6. Add revenue summary cards.
7. Implement signed license issuance (`Ed25519`) with server-only private key.
8. Add activation challenge-response endpoint.

## 15) Open Question (single decision needed next)
Choose one to lock implementation direction:
- A) Private licensing engine only for your tenant (recommended for phase 1)
- B) Shared licensing engine for all freelancers from phase 1
