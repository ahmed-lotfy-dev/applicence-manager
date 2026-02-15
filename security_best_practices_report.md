# Security Best Practices Report

## Executive Summary
This codebase has a solid start (typed request validation in multiple routes, explicit security headers middleware, and origin allowlisting), but several high-impact issues remain in authentication/session design, cryptographic primitives, and abuse protection. The most urgent risks are: insecure custom token signing, permissive database TLS validation, and persistent bearer token storage in browser `localStorage`.

## Scope
- Backend: `apps/backend` (Elysia + TypeScript + Drizzle + Postgres)
- Frontend: `apps/frontend` (React + Vite + TypeScript)
- Deployment config: `deploy/nginx.activation.conf`

## Critical Findings

### SBP-001: Insecure custom JWT implementation (non-standard MAC construction)
- Severity: Critical
- Location: `apps/backend/src/lib/jwt.ts:27`, `apps/backend/src/lib/jwt.ts:42`, `apps/backend/src/lib/license-token.ts:35`, `apps/backend/src/lib/license-token.ts:50`
- Evidence:
  - Signature is computed as `sha256(header.body.secret)` via `createHash("sha256")`, not HMAC.
  - Verification uses direct string comparison instead of constant-time comparison.
- Impact: An attacker who can exploit cryptographic weaknesses or implementation mistakes could forge tokens and impersonate authenticated users or valid license activations.
- Fix:
  - Replace custom token code with a vetted JWT library (`jose` or equivalent) using HS256/EdDSA correctly.
  - Use constant-time verification primitives provided by the library.
  - Enforce standard claims (`iss`, `aud`, `iat`, `exp`, `nbf`) and strict validation.
- Mitigation (short-term):
  - If migration cannot happen immediately, switch to Node `createHmac("sha256", secret)` and constant-time comparison as an intermediate step.
- False positive notes:
  - If tokens are never exposed beyond tightly controlled internal channels, exploitability is lower, but this code is used for client-facing auth/license flows.

### SBP-002: Database TLS certificate verification disabled for Neon connections
- Severity: Critical
- Location: `apps/backend/src/db/db.ts:15`
- Evidence:
  - `ssl: useNeonSsl ? { rejectUnauthorized: false } : undefined`
- Impact: A network attacker can potentially intercept/modify database traffic (MITM), exposing credentials and data integrity.
- Fix:
  - Enable certificate validation by default (`rejectUnauthorized: true`) and provide proper CA chain/cert config.
  - Use Neon-recommended secure connection settings without disabling verification.
- Mitigation (short-term):
  - Gate insecure mode behind explicit non-production env flag with startup warning and hard fail in production.
- False positive notes:
  - If transport is guaranteed inside a fully private trusted network with additional controls, risk is reduced but still not best practice.

## High Findings

### SBP-003: Auth bearer token persisted in `localStorage`
- Severity: High
- Location: `apps/frontend/src/lib/auth-client.ts:28`, `apps/frontend/src/lib/auth-client.ts:70`
- Evidence:
  - Reads `auth_token` from `localStorage` and stores auth token there after login.
- Impact: Any XSS in the frontend (or malicious browser extension) can exfiltrate long-lived bearer tokens and take over admin sessions.
- Fix:
  - Move to server-set `HttpOnly`, `Secure`, `SameSite` cookies for session auth.
  - Remove token persistence from `localStorage`; if needed, keep in-memory only.
  - Add CSRF protections aligned with cookie-based auth.
- Mitigation (short-term):
  - Reduce token TTL aggressively and implement token rotation/revocation checks.

### SBP-004: Session secret and license secret silently fallback to ephemeral random values
- Severity: High
- Location: `apps/backend/src/lib/jwt.ts:3`, `apps/backend/src/lib/license-token.ts:4`
- Evidence:
  - `JWT_SECRET` and `LICENSE_TOKEN_SECRET` auto-generate if env vars are missing.
- Impact: Service can start with unmanaged secrets, causing unpredictable auth behavior, unplanned token invalidation, and weak operational security posture.
- Fix:
  - Fail fast on startup when required secrets are missing in non-test environments.
  - Enforce minimum secret length/entropy checks.
- Mitigation (short-term):
  - Emit explicit startup error in production mode and refuse to bind port.

### SBP-005: No rate limiting / brute-force protection on authentication and activation endpoints
- Severity: High
- Location: `apps/backend/src/routes/auth.ts:9`, `apps/backend/src/routes/license-public.ts:12`, `apps/backend/src/routes/license-public.ts:46`, `apps/backend/src/routes/license-public.ts:66`
- Evidence:
  - Login and public license activation/validation/deactivation endpoints have no request throttling, IP/user lockout, or abuse controls.
- Impact: Attackers can brute-force admin credentials and enumerate/abuse license endpoints at scale.
- Fix:
  - Add per-IP and per-identity rate limits with exponential backoff.
  - Add temporary lockout and monitoring for repeated failures.
  - Consider CAPTCHA/challenge on suspicious login attempts.
- Mitigation (short-term):
  - Enforce rate limiting at reverse proxy (Nginx) immediately while backend controls are added.

### SBP-006: Sensitive session token exposed back to frontend via `/api/auth/me`
- Severity: High
- Location: `apps/backend/src/lib/jwt.ts:8`, `apps/backend/src/routes/auth.ts:102`
- Evidence:
  - JWT payload includes `sessionToken`; `/api/auth/me` returns the entire payload (`user: payload`).
- Impact: Session internals are unnecessarily exposed client-side, expanding blast radius if frontend is compromised.
- Fix:
  - Remove `sessionToken` from client-visible token payload.
  - Return minimal identity claims only (`sub`, `email`, role).
- Mitigation (short-term):
  - Strip sensitive fields before response serialization in `/api/auth/me`.

## Medium Findings

### SBP-007: License key generation uses `Math.random` for security-sensitive values
- Severity: Medium
- Location: `apps/backend/src/services/licensing.ts:37`
- Evidence:
  - `randomGroup` uses `Math.random()` for license key generation.
- Impact: Predictable key generation lowers effective entropy and can aid key guessing/enumeration.
- Fix:
  - Use cryptographically secure randomness (`randomBytes` + unbiased mapping) for all license key characters.
- Mitigation (short-term):
  - Increase key length and enforce strict online attempt throttling.

### SBP-008: Activation token default TTL is effectively permanent
- Severity: Medium
- Location: `apps/backend/src/services/licensing.ts:12`
- Evidence:
  - `DEFAULT_TOKEN_TTL_DAYS = 36500` (~100 years).
- Impact: Stolen activation tokens remain valid for very long periods, increasing long-term account/license takeover risk.
- Fix:
  - Use short-lived tokens (minutes/hours) and refresh via online revalidation.
  - Bind tokens to additional context (device state/version constraints) where possible.
- Mitigation (short-term):
  - Lower default TTL dramatically and add server-side revocation/jti tracking.

### SBP-009: Missing frontend CSP in deployment config
- Severity: Medium
- Location: `deploy/nginx.activation.conf:22`
- Evidence:
  - Nginx sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` but no `Content-Security-Policy` for the SPA.
- Impact: CSP defense-in-depth against XSS is absent for the frontend.
- Fix:
  - Add strict CSP at Nginx for the SPA, explicitly allowing required sources (including Google Fonts if retained).
  - Prefer self-hosting fonts/assets to simplify CSP.
- Mitigation (short-term):
  - Start with report-only CSP and tighten iteratively.

## Positive Observations
- Strong route input shape checks on many endpoints via Elysia `t.Object` schemas (e.g. `apps/backend/src/routes/license-public.ts:37`, `apps/backend/src/routes/licenses.ts:55`, `apps/backend/src/routes/apps.ts:34`).
- Explicit security headers middleware exists (`apps/backend/src/middleware/security-headers.ts:6`).
- CORS allowlist based on configured origins (`apps/backend/src/index.ts:28`).

## Recommended Secure-by-Default Roadmap
1. Replace custom token logic with vetted JWT/session library and rotate secrets.
2. Move auth from bearer-in-localStorage to `HttpOnly` cookie sessions.
3. Enforce startup secret requirements and secure DB TLS validation.
4. Add rate limiting and abuse detection on login and public license endpoints.
5. Reduce token lifetimes and add revocation support.
6. Add CSP for frontend and validate runtime headers in staging/prod.

## Notes and Assumptions
- This review is static (code/config only). Runtime infrastructure controls (WAF/CDN/API gateway) were not observable in repo and should be verified separately.
