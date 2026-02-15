# AppLicence Manager - Case Study

## Project Snapshot
- Project: AppLicence Manager
- Type: Fullstack SaaS-style internal admin platform
- Stack: React, TypeScript, Vite, Bun, Elysia, PostgreSQL, Drizzle, Docker
- Role: Product design + architecture + implementation + deployment hardening

## What I Built
I built a centralized licensing platform for multiple desktop applications. The system has two main parts:

1. Backend API layer for app catalog, license issuance, activation validation, and admin authentication.
2. Frontend dashboard for managing apps and licenses, reviewing activation status, and performing admin actions.

The backend supports public activation endpoints for client apps and protected admin endpoints for dashboard operations. The frontend is a single-page application optimized for quick operational workflows.

## Why I Built It
The licensing workflow was fragmented and difficult to manage across apps. I needed one source of truth that could:

1. Separate licensing data by app.
2. Provide clear activation visibility.
3. Keep the activation path secure by default.
4. Deploy reliably with Docker in a domain-proxied setup.

## The Situation, Task, Action, Result (STAR)
### Situation
Licensing operations needed a single platform instead of ad hoc per-app handling.

### Task
Design and implement a secure, multi-app licensing system that can be deployed quickly and managed through a clear admin UI.

### Action
1. Implemented app, license, and activation data flows in backend services and routes.
2. Built dashboard modules for app creation, license issuance, status management, and activation monitoring.
3. Hardened security posture:
   - secure session cookies
   - CSRF checks for state-changing requests
   - rate limiting on authentication/public activation endpoints
   - stronger key/token generation and validation
   - stricter CORS behavior for proxy-based deployments
4. Improved deployment reliability:
   - multi-service Docker setup
   - Dokploy-friendly internal service networking
   - reverse proxy handling for `/api` routing

### Result
A production-deployable licensing platform that supports multiple apps, simplifies admin operations, and improves security defaults and runtime stability.

## Problems I Needed to Fix
1. Authentication/session patterns that were too permissive for production use.
2. Token and key generation patterns that needed stronger cryptographic handling.
3. Missing abuse protections on sensitive routes.
4. CORS and CSRF edge cases that blocked frontend sign-in in certain environments.
5. Docker/Dokploy deployment friction caused by host-port and env-file assumptions.
6. UI issues affecting dashboard usability (action icon visibility, select readability).

## Key Challenges We Faced
1. Balancing stricter security with smooth local development.
2. Handling same-domain proxy behavior correctly in production.
3. Making Docker Compose portable across local and Dokploy environments.
4. Ensuring multi-app logic is explicit (no hidden fallback behavior).
5. Keeping UX clear while iterating quickly on operational admin screens.

## Technical Decisions
1. Required explicit `appName` in licensing flows to enforce clear multi-app boundaries.
2. Used cookie-based sessions + CSRF for browser clients.
3. Added route-level rate limiting for login and public licensing endpoints.
4. Standardized frontend API access to same-origin `/api` style for deploy simplicity.
5. Shifted compose to internal networking model to avoid host port conflicts.

## Impact
- Better operational visibility for license and activation management.
- Better security posture for auth and public activation flows.
- Smoother deployment process for domain-based Docker hosting.
- Cleaner multi-app behavior with less ambiguity in API contracts.

## What I Would Improve Next
1. Add audit logs for all admin-sensitive actions.
2. Add automated integration tests for auth + activation scenarios.
3. Add observability dashboards (request metrics, error rates, rate-limit events).
4. Add per-app policy templates and role-based access control.

## Links
- Repo: https://github.com/ahmed-lotfy-dev/applicence-manager
- Live: https://activation.ahmedlotfy.site
