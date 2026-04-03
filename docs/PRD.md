# Product Requirements Document (PRD)
# Fawtarly - SaaS Platform for Freelancers

## 1. Product Overview

### 1.1 Product Name
**Fawtarly** - A comprehensive platform for freelancers to manage clients, invoices, receipts, payments, and licensing

### 1.2 Vision Statement
To provide freelancers (especially developers) with a unified platform that solves the daily struggle of managing official receipts, tracking payments, handling client relationships, and licensing software - all in one place.

### 1.3 Origin Story
Fawtarly was built by a freelancer developer who faced real problems:
- Creating official receipts for clients
- Tracking who paid what and when
- Managing outstanding payments across multiple clients
- Knowing exactly how much money is owed at any time
- Licensing desktop applications without expensive enterprise solutions

This platform solves all these problems that every freelancer faces.

### 1.4 Target Users
- **Primary:** Freelance developers and consultants
- **Secondary:** Freelancers in any field needing receipt/invoice management
- **Tertiary:** End-users activating licensed software

---

## 2. Problem Statement

### The Freelancer's Struggle

As a freelancer, I constantly faced these problems:

1. **Receipt Management**
   - Clients asked for official receipts
   - No easy way to generate professional receipts
   - Lost track of which payments had receipts

2. **Money Tracking Chaos**
   - Multiple clients with different payment schedules
   - Hard to know total outstanding amount
   - Forgot to follow up on unpaid invoices
   - No clear picture of monthly/yearly income

3. **Client Management**
   - Scattered client information across emails and notes
   - Lost client contact details
   - No payment history per client

4. **Payment Tracking**
   - Partial payments not tracked properly
   - No overdue reminders
   - Manual calculation of what's owed

5. **Application Licensing** (for developer freelancers)
   - Need to license desktop apps sold to clients
   - Enterprise licensing solutions too expensive
   - No integrated solution with billing

### Why Existing Solutions Don't Work

- Accounting software is complex and expensive
- Invoicing tools don't handle receipts properly
- Licensing platforms cost hundreds per month
- No unified solution for all freelancer needs

---

## 3. Product Goals

### 3.1 Business Goals
1. Solve the freelancer's receipt and money management nightmare
2. Provide clear visibility into income and outstanding payments
3. Streamline client and invoice management
4. Include licensing as an integrated feature for developer freelancers

### 3.2 User Goals
1. Generate official receipts instantly
2. Know exactly how much money is owed at any time
3. Track all client interactions and payment history
4. License desktop applications affordably

---

## 4. Core Features

### 4.1 Client Management
- **Description:** Central hub for all client information
- **Priority:** P0 (MVP) - Core feature for freelancers
- **Capabilities:**
- Client database (name, email, phone, notes)
- Client status tracking (active/inactive)
- Soft delete with restoration
- Payment history per client
- Quick view of outstanding amounts per client

### 4.2 Invoice & Receipt Management
- **Description:** Create invoices and generate official receipts
- **Priority:** P0 (MVP) - Core feature for freelancers
- **Capabilities:**
- Create professional invoices
- Automatic PDF generation
- Official receipt creation
- Multiple currencies (USD, EUR, SAR, etc.)
- Invoice numbering system
- Arabic and English templates
- Email invoices/receipts to clients
- Track payment status (draft, sent, partially_paid, paid, overdue)

### 4.3 Payment Tracking
- **Description:** Complete visibility into money owed and received
- **Priority:** P0 (MVP) - Core feature for freelancers
- **Capabilities:**
- Track partial payments
- Dashboard showing total invoiced, paid, outstanding
- Overdue invoice tracking
- Payment history timeline
- Revenue analytics

### 4.4 Freelancer Branding
- **Description:** Customize invoices and receipts with your brand
- **Priority:** P1
- **Capabilities:**
- Brand name and logo
- Custom colors for invoices
- Default currency setting
- Invoice language (Arabic/English)
- Custom footer text

### 4.5 Application Licensing (For Developer Freelancers)
- **Description:** License your desktop applications to clients
- **Priority:** P1 - Used by the creator for their own apps
- **Capabilities:**
- Generate unique license keys
- Set activation limits per license
- Define expiration dates
- Suspend/revoke licenses
- Device fingerprinting and binding
- Activation request approval workflow
- Manual activation approval (you control who activates)
- Activation analytics
- Multi-application support

### 4.6 Activation System
- **Description:** Secure device activation workflow for licensed apps
- **Priority:** P1 - Part of licensing feature
- **Capabilities:**
- Device fingerprinting
- Machine ID binding
- Activation request approval workflow
- Activation token generation (TTL: 30 days)
- Device unbinding/transfer

### 4.7 Dashboard & Analytics
- **Description:** Financial overview and insights
- **Priority:** P0 (MVP)
- **Capabilities:**
- Total invoiced amount
- Total paid amount
- Outstanding payments
- Overdue invoice alerts
- Invoice count by status
- Quick actions (create invoice, add client)

---

## 5. User Stories

### 5.1 Freelancer (Primary User)

**Client Management:**
1. As a freelancer, I want to add clients so I can track who I work with
2. As a freelancer, I want to see a client's payment history so I know our relationship
3. As a freelancer, I want to archive inactive clients so my list stays clean

**Invoices & Receipts:**
4. As a freelancer, I want to create invoices so I can bill my clients
5. As a freelancer, I want to generate official receipts when clients pay
6. As a freelancer, I want to email invoices directly to clients
7. As a freelancer, I want to track partial payments so I know what's still owed
8. As a freelancer, I want to see overdue invoices so I can follow up

**Money Tracking:**
9. As a freelancer, I want to see my total outstanding amount at a glance
10. As a freelancer, I want to know exactly how much I've earned this month/year
11. As a freelancer, I want to see which invoices are overdue so I can chase payments

**Application Licensing (for developer freelancers):**
12. As a developer freelancer, I want to license my desktop apps to clients
13. As a developer freelancer, I want to control who activates my software
14. As a developer freelancer, I want to see activation stats for my apps

### 5.2 End User (License Activator)
1. As a user, I want to activate my license so I can use the software
2. As a user, I want to request activation approval so I can start using the software
3. As a user, I want to see my activation status

---

## 6. Licensing Policies (For Developer Freelancers)

### 6.1 License Device Binding (Recommended)
- **Behavior:** License key bound to specific device
- **Activation Limit:** Configurable per license (default: 1)
- **Security:** High - prevents key sharing
- **Use Case:** Premium software, commercial products sold to clients

### 6.2 License Only
- **Behavior:** License key validation only
- **Activation Limit:** Unlimited devices
- **Security:** Low - key can be shared
- **Use Case:** Beta testing, open-source support

---

## 7. Non-Functional Requirements

### 7.1 Security
- JWT-based license tokens with HMAC signature
- Secure password hashing (bcrypt)
- HTTPS-only in production
- CSRF protection on state-changing requests
- Rate limiting on authentication endpoints
- SQL injection prevention via Drizzle ORM

### 7.2 Performance
- API response time < 200ms (P95)
- Support 1000+ concurrent activations
- Async PDF generation (background worker)
- Database query optimization with indexes

### 7.3 Scalability
- Multi-tenant architecture
- Stateless API design
- Horizontal scaling support (Docker)
- Connection pooling (PostgreSQL)

### 7.4 Reliability
- 99.5% uptime target
- Graceful error handling
- Database connection retry logic
- Background job retry (PDF generation)

### 7.5 Compliance
- GDPR-ready (soft delete)
- Secure credential storage
- Audit logging for activations
- Email opt-out support

---

## 8. Technical Architecture

### 8.1 Monorepo Structure
```
fawtarly-platform/
├── apps/
│   ├── backend/         # Elysia API (Bun runtime)
│   └── frontend/        # React SPA (Vite)
├── docs/                # Documentation
└── deploy/              # Deployment configs
```

### 8.2 Technology Stack
- **Runtime:** Bun 1.2+
- **Backend:** Elysia.js
- **Frontend:** React 19 + Vite
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth
- **Storage:** Cloudflare R2 (S3-compatible)
- **Email:** Resend API
- **PDF:** PDFKit

### 8.3 API Architecture
- RESTful endpoints
- OpenAPI documentation (/docs)
- Versioned public API (/api/v1/*)
- Admin API (/api/admin/*)
- Public license validation (/api/v1/license/*)

---

## 9. Data Models

### 9.1 Core Entities
- **Users** - Freelancer accounts
- **Managed Apps** - Registered applications
- **Licenses** - License keys with metadata
- **Activations** - Device activations
- **Activation Requests** - Pending approvals
- **Clients** - Customer records
- **Invoices** - Billing records
- **Freelancer Profiles** - Business settings

### 9.2 Relationships
- User → Many Apps
- User → Many Licenses
- User → Many Clients
- User → One Freelancer Profile
- Client → Many Invoices
- App → Many Licenses
- License → Many Activations

---

## 10. API Endpoints

### 10.1 Public API
```
POST   /api/v1/license/validate       # Validate license key
POST   /api/v1/activation/request     # Request activation
POST   /api/v1/activation/activate    # Activate with token
```

### 10.2 Admin API
```
POST   /api/auth/sign-in/email        # Email login
POST   /api/auth/sign-up/email        # Registration
GET    /api/auth/session              # Current session
POST   /api/auth/sign-out             # Logout

GET    /api/admin/apps                # List apps
POST   /api/admin/apps                # Create app
GET    /api/admin/apps/:id            # Get app
PATCH  /api/admin/apps/:id            # Update app
DELETE /api/admin/apps/:id            # Delete app

GET    /api/admin/licenses            # List licenses
POST   /api/admin/licenses            # Create license
GET    /api/admin/licenses/:id        # Get license
PATCH  /api/admin/licenses/:id        # Update license
DELETE /api/admin/licenses/:id        # Revoke license

GET    /api/admin/activations         # List activations
GET    /api/admin/activations/:id     # Get activation
POST   /api/admin/activations/:id/approve  # Approve activation

GET    /api/admin/clients             # List clients
POST   /api/admin/clients             # Create client
GET    /api/admin/clients/:id         # Get client
PATCH  /api/admin/clients/:id         # Update client
DELETE /api/admin/clients/:id         # Soft delete client

GET    /api/admin/invoices            # List invoices
POST   /api/admin/invoices            # Create invoice
GET    /api/admin/invoices/:id        # Get invoice
PATCH  /api/admin/invoices/:id        # Update invoice
DELETE /api/admin/invoices/:id        # Soft delete invoice
POST   /api/admin/invoices/:id/send   # Send invoice email

GET    /api/admin/profile             # Get profile
PATCH  /api/admin/profile             # Update profile
POST   /api/admin/profile/logo        # Upload logo

GET    /api/admin/activation-requests # List requests
POST   /api/admin/activation-requests/:id/approve  # Approve request
```

---

## 11. Deployment Architecture

### 11.1 Single Domain Setup
```
https://activation.example.com/           # Frontend SPA
https://activation.example.com/api/*      # Backend API
https://activation.example.com/docs       # API documentation
```

### 11.2 Infrastructure
- **Reverse Proxy:** Nginx
- **Application Server:** Bun runtime
- **Database:** Managed PostgreSQL (Neon, Supabase, etc.)
- **Storage:** Cloudflare R2
- **Email:** Resend

### 11.3 Containerization
- Docker Compose for deployment
- Multi-stage builds
- Environment-based configuration
- Health checks

---

## 12. Security Measures

### 12.1 Authentication Security
- Secure password hashing (bcrypt, cost 12)
- HttpOnly cookies
- SameSite=Strict
- Secure flag in production HTTPS

### 12.2 API Security
- CORS origin whitelisting
- CSRF token validation
- Rate limiting (auth: 10/15min, public: 60/min)
- Security headers middleware
- Input validation (Zod)

### 12.3 Data Security
- Encrypted license tokens (HMAC-SHA256)
- SSL/TLS database connections
- Environment variable secrets
- No secrets in git

---

## 13. Success Metrics

### 13.1 Business Metrics
- Monthly Active Freelancers (MAF)
- Total Licenses Managed
- Activation Success Rate
- Invoice Conversion Rate

### 13.2 Technical Metrics
- API Availability (target: 99.5%)
- Mean Response Time (target: <200ms)
- Error Rate (target: <0.5%)
- Background Job Success Rate (target: >95%)

---

## 14. Future Roadmap

### Phase 2 (Post-MVP)
- Automated activation (auto-approve rules)
- Payment integration (Stripe)
- Advanced analytics dashboard
- Webhook notifications
- Team accounts (multi-user)

### Phase 3 (Future)
- White-label solution
- Mobile app for freelancers
- Subscription billing
- Usage-based licensing
- API for third-party integrations

---

## 15. Glossary

- **License Key:** Unique identifier for a software license
- **Activation:** Process of binding a license to a device
- **Machine ID:** Unique device fingerprint
- **Device Binding:** License locked to specific hardware
- **Freelancer:** Software developer using the platform
- **End User:** Person activating and using licensed software
- **Soft Delete:** Marking record as deleted without removal
- **TTL:** Time To Live (expiration period)
