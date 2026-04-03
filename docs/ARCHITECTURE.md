# System Architecture Document
# Fawtarly - SaaS Platform for Freelancers

## 1. Architecture Overview

Fawtarly is a platform built by a freelancer, for freelancers. It solves the real problems freelancers face: managing clients, invoices, receipts, payments, and licensing desktop applications - all in one place.

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLIENT LAYER │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Desktop Apps │ │ Freelancer Web Interface │ │
│ │ (End Users) │ │ (Freelancers) │ │
│ │ │ │ │ │
│ │ - License validation│ │ - Client management │ │
│ │ - Activation request│ │ - Invoice & receipt creation │ │
│ │ - Token consumption │ │ - Payment tracking │ │
│ └──────────┬──────────┘ │ - Money dashboard │ │
│ │ │ - License management │ │
│ │ └────────────┬────────────────────┘ │
│ │ │ │
└──────────────┼──────────────────────────────────┼────────────────────────────┘
│ │
│ │
▼ ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ API GATEWAY │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Nginx Reverse Proxy │ │
│ │ │ │
│ │ - SSL termination │ │
│ │ - Static file serving (frontend) │ │
│ │ - API proxying (/api/* → backend) │ │
│ │ - Rate limiting (DDoS protection) │ │
│ │ - Gzip compression │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ │
└───────────────────────────────────────────────────────────────────────────────┘
│ │
│ │
▼ ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────┐ ┌───────────────────────────────┐ │
│ │ Backend API Server │ │ Background Workers │ │
│   │    (Bun + Elysia)            │      │    (Bun runtime)              │   │
│   │                              │      │                               │   │
│   │ - REST API endpoints         │      │ - Invoice PDF generation      │   │
│   │ - Authentication middleware  │      │ - Email delivery              │   │
│   │ - Business logic             │      │ - Async job processing        │   │
│   │ - Request validation         │      │ - Retry logic                 │   │
│   │ - OpenAPI documentation      │      │                               │   │
│   └──────────────┬───────────────┘      └───────────────┬───────────────┘   │
│                  │                                      │                    │
│                  │                                      │                    │
│                  └──────────────────┬───────────────────┘                    │
│                                     │                                         │
└─────────────────────────────────────┼─────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│   │   PostgreSQL        │  │  Cloudflare R2   │  │   Resend API        │  │
│   │   Database          │  │  (Object Storage)│  │   (Email Service)   │  │
│   │                     │  │                  │  │                     │  │
│   │ - Users & Auth      │  │ - Logo uploads   │  │ - Invoice emails    │  │
│   │ - Apps & Licenses   │  │ - PDF storage    │  │ - Notifications     │  │
│   │ - Activations       │  │ - Assets         │  │                     │  │
│   │ - Clients/Invoices  │  │                  │  │                     │  │
│   └─────────────────────┘  └──────────────────┘  └─────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 19 | UI component library |
| Build Tool | Vite 7 | Fast bundler with HMR |
| State Management | Zustand | Lightweight global state |
| Data Fetching | TanStack Query | Server state management |
| Routing | React Router v7 | Client-side routing |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| HTTP Client | Native fetch | API communication |
| Type Safety | TypeScript 5.7 | Static typing |

**Key Features:**
- SPA (Single Page Application)
- Hot Module Replacement (HMR)
- Tree-shaking for smaller bundles
- CSS-in-JS with Tailwind
- Type-safe API calls

### 2.2 Backend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Bun 1.2+ | High-performance JS runtime |
| Framework | Elysia.js | Fast web framework |
| ORM | Drizzle ORM | Type-safe SQL queries |
| Auth | Better Auth | Session management |
| Validation | Zod | Schema validation |
| Documentation | OpenAPI | API spec generation |
| Logging | Logixlysia | Request logging |

**Key Features:**
- RESTful API architecture
- OpenAPI documentation at /docs
- Middleware pipeline (auth, CORS, CSRF, rate limiting)
- Connection pooling for PostgreSQL
- Graceful shutdown handling

### 2.3 Infrastructure Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Database | PostgreSQL | Relational data storage |
| Object Storage | Cloudflare R2 | File storage (logos, PDFs) |
| Email | Resend | Transactional emails |
| Reverse Proxy | Nginx | SSL termination, routing |
| Containerization | Docker | Deployment packaging |
| Package Manager | Bun | Workspace management |

---

## 3. Monorepo Architecture

### 3.1 Directory Structure

```
fawtarly-platform/
├── apps/
│   ├── backend/                    # Backend API service
│   │   ├── src/
│   │   │   ├── bootstrap/         # Database initialization
│   │   │   ├── db/                # Database schema & config
│   │   │   ├── lib/               # Utilities (auth, JWT, HTTP)
│   │   │   ├── middleware/        # Request middleware
│   │   │   ├── routes/            # API route handlers
│   │   │   ├── services/          # Business logic layer
│   │   │   └── workers/           # Background job workers
│   │   ├── drizzle/               # Database migrations
│   │   ├── drizzle.config.ts      # Drizzle Kit config
│   │   ├── Dockerfile             # Backend container
│   │   └── package.json           # Backend dependencies
│   │
│   └── frontend/                  # Admin web application
│       ├── src/
│       │   ├── app/              # App configuration
│       │   ├── features/         # Feature-based modules
│       │   │   ├── auth/         # Authentication
│       │   │   └── dashboard/    # Dashboard components
│       │   └── App.tsx           # Root component
│       ├── public/               # Static assets
│       ├── Dockerfile            # Frontend container
│       └── package.json          # Frontend dependencies
│
├── docs/                          # Documentation
│   ├── design-mds/               # Design system
│   ├── portfolio/                # Portfolio assets
│   └── work-done/                # Progress logs
│
├── deploy/                        # Deployment configs
│   └── nginx.activation.conf     # Nginx config
│
├── docker-compose.yml             # Docker orchestration
├── package.json                   # Workspace root
└── bun.lock                       # Lock file
```

### 3.2 Workspace Configuration

**Root package.json:**
```json
{
  "name": "fawtarly-platform",
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "bun run dev:frontend & bun run dev:backend & wait",
    "build": "bun run --filter '*' build",
    "start:backend": "bun run --filter backend start"
  }
}
```

**Benefits:**
- Shared dependencies
- Single lock file
- Cross-package scripts
- Type sharing

---

## 4. Backend Architecture

### 4.1 Application Bootstrap

```typescript
// src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";

const app = new Elysia()
  .use(logger)
  .use(securityHeaders)
  .use(openapi({ path: "/docs" }))
  .use(cors({ origin: trustedOrigins }))
  .use(csrfProtection)
  .use(authMiddleware)
  .use(healthRoutes)
  .use(authRoutes)
  .use(activationRoutes)
  // ... other routes
  .listen(8000);
```

**Initialization Sequence:**
1. Load environment variables (Bun auto-loads .env)
2. Initialize database connection pool
3. Apply middleware pipeline
4. Mount route handlers
5. Start HTTP server

### 4.2 Middleware Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                        REQUEST LIFECYCLE                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Request Received                                            │
│      │                                                            │
│      ▼                                                            │
│   2. Logger Middleware                                            │
│      - Log request method, path, timestamp                        │
│      - Attach request ID                                          │
│      │                                                            │
│      ▼                                                            │
│   3. Security Headers Middleware                                  │
│      - Set X-Content-Type-Options: nosniff                       │
│      - Set X-Frame-Options: DENY                                  │
│      - Set X-XSS-Protection: 1; mode=block                       │
│      │                                                            │
│      ▼                                                            │
│   4. CORS Middleware                                              │
│      - Validate origin                                            │
│      - Set Access-Control-Allow-Origin                            │
│      - Handle preflight requests                                  │
│      │                                                            │
│      ▼                                                            │
│   5. Rate Limiting Middleware                                     │
│      - Check rate limit store                                     │
│      - Return 429 if exceeded                                     │
│      │                                                            │
│      ▼                                                            │
│   6. CSRF Protection Middleware                                   │
│      - Validate x-csrf-token header (state-changing requests)    │
│      - Generate CSRF token for GET                                │
│      │                                                            │
│      ▼                                                            │
│   7. Auth Middleware                                              │
│      - Extract session from cookie                                │
│      - Validate session token                                     │
│      - Attach user to request context                             │
│      │                                                            │
│      ▼                                                            │
│   8. Route Handler                                                │
│      - Execute business logic                                     │
│      - Query database                                             │
│      - Return response                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Route Organization

**Public Routes (No Auth):**
```typescript
// routes/health.ts
app.get("/api/health", () => ({ status: "ok" }));

// routes/license-public.ts
app.post("/api/v1/license/validate", validateLicenseSchema, async (req) => {
  // License validation logic
});
```

**Protected Routes (Auth Required):**
```typescript
// routes/licenses.ts
app.group("/api/admin", (app) =>
  app
    .use(requireAuth)
    .get("/licenses", async () => { /* ... */ })
    .post("/licenses", async () => { /* ... */ })
    .patch("/licenses/:id", async () => { /* ... */ })
    .delete("/licenses/:id", async () => { /* ... */ })
);
```

### 4.4 Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Routes (HTTP Layer)                                            │
│      │                                                            │
│      │ Validation, Request Parsing                               │
│      │                                                            │
│      ▼                                                            │
│   Services (Business Logic)                                      │
│      │                                                            │
│      │ - Business rules                                          │
│      │ - Data transformation                                     │
│      │ - Cross-entity operations                                 │
│      │                                                            │
│      ▼                                                            │
│   Drizzle ORM (Data Access)                                      │
│      │                                                            │
│      │ - Type-safe queries                                       │
│      │ - Connection pooling                                      │
│      │                                                            │
│      ▼                                                            │
│   PostgreSQL Database                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Example Service:**
```typescript
// services/licensing.ts
export async function createLicense(params: CreateLicenseParams) {
  // 1. Validate app exists
  const app = await getApp(params.appName);
  if (!app) throw new Error("App not found");
  
  // 2. Generate license key
  const licenseKey = generateLicenseKey();
  
  // 3. Insert license record
  const [license] = await db
    .insert(licenses)
    .values({ ...params, licenseKey })
    .returning();
  
  // 4. Return created license
  return license;
}
```

---

## 5. Frontend Architecture

### 5.1 Component Structure

```
src/
├── app/
│   └── providers/
│       └── QueryProvider.tsx      # TanStack Query setup
│
├── features/
│   ├── auth/
│   │   └── components/
│   │       ├── LoginPage.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   └── dashboard/
│       ├── components/            # Reusable components
│       │   ├── DashboardHeader.tsx
│       │   ├── LicensesPanel.tsx
│       │   ├── ClientsSection.tsx
│       │   └── InvoicesSection.tsx
│       │
│       ├── pages/                 # Route pages
│       │   ├── DashboardPage.tsx
│       │   ├── OverviewPage.tsx
│       │   ├── ActivationsPage.tsx
│       │   └── SettingsPage.tsx
│       │
│       └── hooks/                 # Data fetching hooks
│           ├── use-licensing-data.ts
│           ├── use-clients-data.ts
│           └── use-invoices-data.ts
│
└── App.tsx                        # Root component with routing
```

### 5.2 State Management

**Global State (Zustand):**
```typescript
// hooks/licensingStore.ts
interface LicensingStore {
  selectedApp: string | null;
  setSelectedApp: (app: string) => void;
  filters: LicenseFilters;
  setFilters: (filters: LicenseFilters) => void;
}

export const useLicensingStore = create<LicensingStore>((set) => ({
  selectedApp: null,
  setSelectedApp: (app) => set({ selectedApp: app }),
  filters: {},
  setFilters: (filters) => set({ filters }),
}));
```

**Server State (TanStack Query):**
```typescript
// hooks/use-licensing-data.ts
export function useLicenses() {
  return useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/licenses');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });
}

export function useCreateLicense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateLicenseInput) => {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
    },
  });
}
```

### 5.3 Routing Structure

```typescript
// App.tsx
function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="activations" element={<ActivationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Login Request                                               │
│      POST /api/auth/sign-in/email                                │
│      { email, password }                                         │
│      │                                                            │
│      ▼                                                            │
│   2. Better Auth Validates                                       │
│      - Check password hash (bcrypt)                              │
│      - Generate session token                                    │
│      - Create session record                                     │
│      │                                                            │
│      ▼                                                            │
│   3. Response with Cookie                                        │
│      Set-Cookie: session_token=<token>;                          │
│        HttpOnly; Secure; SameSite=Strict; Path=/                 │
│      │                                                            │
│      ▼                                                            │
│   4. Subsequent Requests                                         │
│      Cookie: session_token=<token>                               │
│      │                                                            │
│      ▼                                                            │
│   5. Auth Middleware Extracts                                    │
│      - Validate session token                                    │
│      - Load user from database                                   │
│      - Attach to request context                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 OAuth Flow (Google/GitHub)

```
┌─────────────────────────────────────────────────────────────────┐
│                    OAUTH FLOW                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Redirect to Provider                                        │
│      GET /api/auth/sign-in/social?provider=google               │
│      │                                                            │
│      ▼                                                            │
│   2. User Authenticates                                          │
│      Google/GitHub login page                                    │
│      │                                                            │
│      ▼                                                            │
│   3. Callback with Code                                          │
│      GET /api/auth/callback/google?code=<code>                  │
│      │                                                            │
│      ▼                                                            │
│   4. Better Auth Exchanges Code                                  │
│      - POST to provider token endpoint                           │
│      - Retrieve access token                                     │
│      - Fetch user profile                                        │
│      │                                                            │
│      ▼                                                            │
│   5. Create/Link Account                                         │
│      - Check if user exists                                      │
│      - Create user if new                                        │
│      - Link account to user                                      │
│      │                                                            │
│      ▼                                                            │
│   6. Set Session Cookie                                          │
│      Redirect to dashboard                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Authorization Rules

**Route Protection:**
```typescript
// middleware/auth.ts
export const authMiddleware = new Elysia()
  .derive(({ request }) => {
    const session = getSessionFromCookie(request);
    return { user: session?.user };
  })
  .macro(({ user }) => ({
    requireAuth: () => {
      if (!user) throw new Error('Unauthorized');
    },
  }));
```

**Admin Routes:**
- All `/api/admin/*` routes require authentication
- User ID derived from session, ensuring data isolation
- No role-based access (all authenticated users are admins of their own data)

---

## 7. License & Activation Flow

### 7.1 License Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               LICENSE VALIDATION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Desktop App                                                    │
│      │                                                            │
│      │ 1. Read license key from config                           │
│      │                                                            │
│      ▼                                                            │
│   POST /api/v1/license/validate                                  │
│      { licenseKey, appName, machineId }                          │
│      │                                                            │
│      ▼                                                            │
│   Backend Processing                                             │
│      - Lookup license by key                                     │
│      - Verify app match                                          │
│      - Check status (active/suspended/expired)                   │
│      - Check activation count < maxActivations                   │
│      │                                                            │
│      ▼                                                            │
│   Response: { valid: true, expiresAt: "..." }                   │
│      OR { valid: false, reason: "..." }                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Activation Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              ACTIVATION REQUEST FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Desktop App                                                    │
│      │                                                            │
│      │ 1. User requests activation                               │
│      │    - Enter shop name, phone                               │
│      │                                                            │
│      ▼                                                            │
│   POST /api/v1/activation/request                                │
│      {                                                            │
│        appName,                                                   │
│        appVersion,                                                │
│        machineId,                                                 │
│        shopName,                                                  │
│        phone,                                                     │
│        platform,                                                  │
│        userAgent                                                  │
│      }                                                            │
│      │                                                            │
│      ▼                                                            │
│   Backend Processing                                             │
│      - Create activation_request record                          │
│      - Status: 'pending'                                         │
│      - Return request ID                                         │
│      │                                                            │
│      ▼                                                            │
│   Freelancer Dashboard                                           │
│      - View pending requests                                     │
│      - Approve or reject                                         │
│      │                                                            │
│      ▼                                                            │
│   POST /api/admin/activation-requests/:id/approve               │
│      { licenseKey: "..." }                                        │
│      │                                                            │
│      ▼                                                            │
│   Backend Processing                                             │
│      - Create activation record                                  │
│      - Generate activation token (JWT)                           │
│      - Set token expiration (30 days)                            │
│      - Update request status to 'approved'                       │
│      │                                                            │
│      ▼                                                            │
│   Desktop App Polls                                              │
│      GET /api/v1/activation/request/:id/status                   │
│      │                                                            │
│      ▼                                                            │
│   Response: { status: "approved", activationToken: "..." }      │
│      │                                                            │
│      ▼                                                            │
│   Desktop App                                                    │
│      - Store activation token                                    │
│      - Use token for license validation                          │
│      - Token validated on each app launch                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 License Token Structure

**JWT Claims:**
```json
{
  "sub": "activation_id",
  "app": "application_name",
  "lic": "license_key",
  "mach": "machine_id",
  "exp": 1710000000,
  "iat": 1709913600,
  "iss": "fawtarly"
}
```

**Token Validation:**
```typescript
// lib/license-token.ts
export function verifyLicenseToken(token: string) {
  const payload = jwt.verify(token, LICENSE_TOKEN_SECRET);
  
  // Validate claims
  if (!payload.app || !payload.lic || !payload.mach) {
    throw new Error('Invalid token claims');
  }
  
  return payload;
}
```

---

## 8. Background Job Processing

### 8.1 Invoice PDF Generation

```
┌─────────────────────────────────────────────────────────────────┐
│              INVOICE PDF GENERATION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Freelancer Dashboard                                           │
│      │                                                            │
│      │ Click "Send Invoice"                                       │
│      ▼                                                            │
│   POST /api/admin/invoices/:id/send                              │
│      │                                                            │
│      ▼                                                            │
│   Backend Processing                                             │
│      - Create invoice_pdf_job record                             │
│      - Status: 'pending'                                         │
│      - Return success immediately                                │
│      │                                                            │
│      ▼                                                            │
│   Background Worker (Separate Process)                           │
│      │                                                            │
│      │ Poll pending jobs                                         │
│      ▼                                                            │
│   Worker Processing                                              │
│      - Load invoice data                                         │
│      - Render PDF with PDFKit                                    │
│      - Apply branding (logo, colors)                             │
│      - Upload PDF to R2 storage                                  │
│      - Update job status to 'completed'                          │
│      │                                                            │
│      ▼                                                            │
│   Email Delivery                                                 │
│      - Send PDF via Resend API                                   │
│      - Include invoice details                                   │
│      - Update invoice status to 'sent'                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Worker Implementation

```typescript
// workers/invoice-pdf-worker.ts
async function processJob(job: InvoicePdfJob) {
  try {
    // 1. Load invoice data
    const invoice = await getInvoice(job.invoiceId);
    
    // 2. Render PDF
    const pdfBuffer = await renderInvoicePdf(invoice);
    
    // 3. Upload to R2
    const pdfKey = await uploadToR2(pdfBuffer, `invoices/${invoice.id}.pdf`);
    
    // 4. Send email
    await sendInvoiceEmail(invoice, pdfKey);
    
    // 5. Update job status
    await updateJobStatus(job.id, 'completed');
  } catch (error) {
    await incrementJobAttempts(job.id, error.message);
  }
}

// Poll loop
while (true) {
  const jobs = await getPendingJobs();
  for (const job of jobs) {
    await processJob(job);
  }
  await Bun.sleep(5000);
}
```

---

## 9. API Design

### 9.1 RESTful Conventions

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | /api/admin/licenses | List all licenses |
| POST | /api/admin/licenses | Create new license |
| GET | /api/admin/licenses/:id | Get license details |
| PATCH | /api/admin/licenses/:id | Update license |
| DELETE | /api/admin/licenses/:id | Revoke license |

### 9.2 Request/Response Format

**Success Response:**
```json
{
  "id": "lic_abc123",
  "licenseKey": "FWTL-XXXX-XXXX-XXXX",
  "appName": "business-manager",
  "status": "active",
  "maxActivations": 1,
  "expiresAt": "2024-12-31T23:59:59Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Response:**
```json
{
  "error": {
    "code": "LICENSE_NOT_FOUND",
    "message": "License with ID lic_abc123 not found"
  }
}
```

### 9.3 Query Parameters

**Pagination:**
```
GET /api/admin/licenses?page=1&limit=20
```

**Filtering:**
```
GET /api/admin/licenses?status=active&appName=business-manager
```

**Sorting:**
```
GET /api/admin/licenses?sort=createdAt&order=desc
```

---

## 10. Security Architecture

### 10.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Layer 1: Network Security                                     │
│      - HTTPS (TLS 1.2+)                                         │
│      - Nginx rate limiting                                      │
│      - DDoS protection                                          │
│                                                                  │
│   Layer 2: Application Security                                 │
│      - CORS whitelisting                                        │
│      - CSRF token validation                                    │
│      - Rate limiting (per endpoint)                             │
│      - Security headers                                         │
│                                                                  │
│   Layer 3: Authentication                                       │
│      - Secure password hashing (bcrypt)                         │
│      - HttpOnly cookies                                         │
│      - SameSite=Strict                                         │
│      - Session expiration                                       │
│                                                                  │
│   Layer 4: Authorization                                        │
│      - User context validation                                  │
│      - Resource ownership checks                                │
│      - JWT signature verification                               │
│                                                                  │
│   Layer 5: Data Security                                        │
│      - SQL injection prevention (ORM)                           │
│      - Input validation (Zod)                                   │
│      - XSS prevention (output encoding)                         │
│      - Parameterized queries                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Rate Limiting Rules

| Endpoint | Window | Max Requests | Purpose |
|----------|--------|--------------|---------|
| /api/auth/sign-in/email | 15 min | 10 | Prevent brute force |
| /api/auth/sign-up/email | 15 min | 10 | Prevent abuse |
| /api/auth/sign-in/social | 15 min | 10 | Prevent OAuth abuse |
| /api/v1/license/* | 1 min | 60 | Prevent API abuse |

### 10.3 Security Headers

```typescript
// middleware/security-headers.ts
app.derive(({ set }) => {
  set.headers['X-Content-Type-Options'] = 'nosniff';
  set.headers['X-Frame-Options'] = 'DENY';
  set.headers['X-XSS-Protection'] = '1; mode=block';
  set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  set.headers['Permissions-Policy'] = 'geolocation=(), microphone=()';
});
```

---

## 11. Deployment Architecture

### 11.1 Single Domain Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                 DEPLOYMENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Internet                                                       │
│      │                                                            │
│      │ HTTPS (Port 443)                                          │
│      ▼                                                            │
│   ┌──────────────────────────────┐                               │
│   │      Nginx Reverse Proxy     │                               │
│   │                              │                               │
│   │  SSL Termination            │                               │
│   │  - Let's Encrypt certificate│                               │
│   │                              │                               │
│   │  Static File Serving        │                               │
│   │  - / → Frontend SPA         │                               │
│   │  - /assets/* → Frontend     │                               │
│   │                              │                               │
│   │  API Proxying               │                               │
│   │  - /api/* → Backend:8000    │                               │
│   └──────────────┬───────────────┘                               │
│                  │                                                │
│                  │ HTTP (Port 8000)                              │
│                  ▼                                                │
│   ┌──────────────────────────────┐                               │
│   │    Backend API Server        │                               │
│   │    (Bun Runtime)             │                               │
│   │                              │                               │
│   │  - Port: 8000               │                               │
│   │  - Workers: 4               │                               │
│   │  - Env: production          │                               │
│   └──────────────┬───────────────┘                               │
│                  │                                                │
│                  │ PostgreSQL Protocol                           │
│                  ▼                                                │
│   ┌──────────────────────────────┐                               │
│   │    PostgreSQL Database       │                               │
│   │    (Managed Service)         │                               │
│   │                              │                               │
│   │  - Neon / Supabase / AWS    │                               │
│   │  - SSL Mode: require        │                               │
│   └──────────────────────────────┘                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      NODE_ENV: production
      PORT: 8000
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      # ... other env vars
    expose:
      - "8000"
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    depends_on:
      - backend
    expose:
      - "80"
    restart: unless-stopped
```

### 11.3 Nginx Configuration

```nginx
# deploy/nginx.activation.conf
server {
    listen 443 ssl;
    server_name activation.example.com;

    ssl_certificate /etc/letsencrypt/live/activation.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/activation.example.com/privkey.pem;

    # Frontend SPA
    location / {
        root /var/www/activation/frontend;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/auth {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:8000;
    }
}
```

---

## 12. Monitoring & Observability

### 12.1 Logging

**Structured Logging:**
```typescript
// middleware/logger.ts
app.use(logger({
  format: 'json',
  timestamp: true,
  include: {
    method: true,
    path: true,
    status: true,
    duration: true,
    userAgent: true,
    ip: true,
  },
}));
```

**Log Levels:**
- ERROR: Application errors, exceptions
- WARN: Deprecated usage, rate limit exceeded
- INFO: Request start/end, business events
- DEBUG: Detailed execution flow (disabled in production)

### 12.2 Health Checks

```typescript
// routes/health.ts
app.get('/api/health', async () => {
  const dbHealth = await checkDatabaseConnection();
  
  return {
    status: dbHealth ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealth ? 'connected' : 'disconnected',
  };
});
```

### 12.3 Metrics (Future)

- Request latency (P50, P95, P99)
- Error rate
- Database connection pool usage
- Background job queue length
- API endpoint usage

---

## 13. Scalability Considerations

### 13.1 Horizontal Scaling

**Current:**
- Single backend instance
- Single worker process
- Managed PostgreSQL (auto-scaling)

**Future:**
- Multiple backend containers (Docker Swarm/Kubernetes)
- Worker autoscaling based on queue length
- Redis for rate limiting (shared state)
- CDN for static assets

### 13.2 Database Optimization

**Connection Pooling:**
```typescript
// db/db.ts
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000, // Connection timeout
});
```

**Query Optimization:**
- Indexes on foreign keys
- Composite indexes for filtering
- Avoid N+1 queries
- Use batch inserts

### 13.3 Caching Strategy (Future)

- Cache license validations (Redis)
- Cache user sessions (Redis)
- Cache static assets (CDN)
- Cache API responses (HTTP caching)

---

## 14. Disaster Recovery

### 14.1 Backup Strategy

- PostgreSQL daily backups (managed service)
- R2 object versioning
- Environment variables backup (secure storage)

### 14.2 Failover Plan

1. **Database Failure:** Managed service auto-failover
2. **Backend Failure:** Container restart (health checks)
3. **Worker Failure:** Job retry logic (3 attempts)
4. **Storage Failure:** R2 redundancy (Cloudflare)

### 14.3 Recovery Procedure

1. Restore database from latest backup
2. Redeploy containers from CI/CD
3. Verify data integrity
4. Resume background job processing

---

## 15. Development Workflow

### 15.1 Local Development

```bash
# Install dependencies
bun install

# Start development servers
bun run dev

# Database setup
bun run db:generate
bun run db:migrate

# Run tests (future)
bun test
```

### 15.2 Branch Strategy

```
main (production)
  │
  ├─── develop (staging)
  │      │
  │      ├─── feature/add-payment-integration
  │      ├─── feature/automated-activation
  │      └─── bugfix/pdf-rendering-issue
  │
  └─── hotfix/security-patch
```

### 15.3 CI/CD Pipeline (Future)

1. **Lint & Type Check:** `bun run lint && bun run typecheck`
2. **Tests:** `bun test`
3. **Build:** `bun run build`
4. **Deploy:** Docker image build and push
5. **Migration:** Run database migrations
6. **Restart:** Rolling deployment

---

## 16. Future Architecture Improvements

### 16.1 Short-term (Phase 2)
- WebSocket support for real-time notifications
- Redis for session storage and rate limiting
- Background job queue with priorities
- API versioning strategy

### 16.2 Medium-term (Phase 3)
- Microservices split (auth, billing, licensing)
- Event-driven architecture (webhooks)
- GraphQL API for complex queries
- Multi-region deployment

### 16.3 Long-term (Phase 4)
- Kubernetes orchestration
- Service mesh (Istio)
- Observability stack (Prometheus, Grafana)
- ML-based fraud detection
