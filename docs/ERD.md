# Entity Relationship Diagram (ERD)
# Fawtarly - Database Schema

## 1. Overview

Fawtarly uses PostgreSQL with Drizzle ORM. The schema supports multi-tenant operations where each user (freelancer) manages their own applications, licenses, clients, and invoices.

---

## 2. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS (Freelancers)                             │
│  - id (PK)                                                                   │
│  - name                                                                      │
│  - email (unique)                                                            │
│  - emailVerified                                                             │
│  - image                                                                     │
│  - createdAt                                                                 │
│  - updatedAt                                                                 │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬─────────────────────┐
        │                   │                   │                     │
        ▼                   ▼                   ▼                     ▼
┌───────────────┐   ┌──────────────┐   ┌─────────────────┐   ┌──────────────────┐
│ MANAGED_APPS  │   │   LICENSES   │   │     CLIENTS     │   │ FREELANCER_      │
│               │   │              │   │                 │   │ PROFILES         │
│ - id (PK)     │   │ - id (PK)    │   │ - id (PK)       │   │                  │
│ - userId (FK) │   │ - userId(FK) │   │ - userId (FK)   │   │ - id (PK)        │
│ - name        │   │ - appName    │   │ - name          │   │ - userId (FK)    │
│ - slug        │   │ - licenseKey │   │ - email         │   │ - businessName   │
│ - status      │   │ - status     │   │ - phone         │   │ - logoUrl        │
│ - metadata    │   │ - maxActivations│ - status      │   │ - contactEmail   │
│ - createdAt   │   │ - expiresAt  │   │ - isDeleted     │   │ - addressLine1   │
│ - updatedAt   │   │ - metadata   │   │ - notes         │   │ - taxId          │
└───────────────┘   │ - createdAt  │   │ - createdAt     │   │ - defaultCurrency│
        │           │ - updatedAt  │   │ - updatedAt     │   │ - createdAt      │
        │           └──────┬───────┘   └────────┬────────┘   │ - updatedAt      │
        │                  │                    │            └──────────────────┘
        │                  │                    │
        │                  ▼                    │
        │          ┌─────────────────┐         │
        │          │  ACTIVATIONS    │         │
        │          │                 │         │
        │          │ - id (PK)       │         │
        │          │ - appName       │         │
        │          │ - appVersion    │         │
        │          │ - licenseKey    │         │
        │          │ - machineId     │         │
        │          │ - shopName      │         │
        │          │ - status        │         │
        │          │ - userId (FK)   │         │
        │          │ - activatedAt   │         │
        │          │ - expiresAt     │         │
        │          │ - metadata      │         │
        │          │ - createdAt     │         │
        │          │ - updatedAt     │         │
        │          └────────┬────────┘         │
        │                   │                  │
        │                   │                  │
        │                   ▼                  ▼
        │          ┌──────────────────────────────┐
        │          │     ACTIVATION_LOGS          │
        │          │                              │
        │          │ - id (PK)                    │
        │          │ - userId (FK)                │
        │          │ - activationId (FK)          │
        │          │ - action                     │
        │          │ - ipAddress                  │
        │          │ - userAgent                  │
        │          │ - metadata                   │
        │          │ - createdAt                  │
        │          └──────────────────────────────┘
        │
        └──────────────┐
                       │
              ┌────────▼─────────┐
              │ ACTIVATION_      │
              │ REQUESTS         │
              │                  │
              │ - id (PK)        │
              │ - userId (FK)    │
              │ - appName        │
              │ - appVersion     │
              │ - machineId      │
              │ - shopName       │
              │ - phone          │
              │ - notes          │
              │ - platform       │
              │ - userAgent      │
              │ - status         │
              │ - resolvedLicenseKey│
              │ - activationId (FK)│
              │ - activationToken│
              │ - tokenExpiresAt │
              │ - approvedAt     │
              │ - createdAt      │
              │ - updatedAt      │
              └──────────────────┘

                            CLIENTS
                              │
                              │
                              ▼
              ┌──────────────────────────┐
              │        INVOICES          │
              │                          │
              │ - id (PK)                │
              │ - userId (FK)            │
              │ - clientId (FK)          │
              │ - invoiceNo              │
              │ - status                 │
              │ - currency               │
              │ - invoiceLanguage        │
              │ - isDeleted              │
              │ - totalAmount            │
              │ - paidAmount             │
              │ - dueDate                │
              │ - issuedAt               │
              │ - notes                  │
              │ - createdAt              │
              │ - updatedAt              │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │    INVOICE_PDF_JOBS      │
              │                          │
              │ - id (PK)                │
              │ - userId (FK)            │
              │ - invoiceId (FK)         │
              │ - status                 │
              │ - attempts               │
              │ - errorMessage           │
              │ - outputPath             │
              │ - createdAt              │
              │ - updatedAt              │
              │ - completedAt            │
              └──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      BETTER_AUTH TABLES                                   │
│                                                                           │
│  SESSIONS                 ACCOUNTS                VERIFICATION_TOKENS   │
│  - id (PK)                - id (PK)               - id (PK)              │
│  - token (unique)         - userId (FK)           - identifier          │
│  - userId (FK)            - provider              - token               │
│  - expiresAt             - providerAccountId      - expiresAt           │
│  - ipAddress             - accessToken            - createdAt           │
│  - userAgent             - refreshToken           - updatedAt           │
│  - createdAt             - idToken                                      │
│  - updatedAt             - accessTokenExpiresAt                         │
│                           - scope                                        │
│                           - password                                     │
│                           - createdAt                                    │
│                           - updatedAt                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      USER_LICENSE_KEYS                                    │
│                                                                           │
│  - id (PK)                                                                │
│  - userId (FK)                                                            │
│  - kid (Key ID)                                                           │
│  - keySalt                                                                │
│  - status                                                                 │
│  - createdAt                                                              │
│  - updatedAt                                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Entity Descriptions

### 3.1 users
**Purpose:** Core user accounts (freelancers)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| name | text | | User's display name |
| email | text | UNIQUE | Email address |
| emailVerified | boolean | DEFAULT false | Email verification status |
| image | text | | Profile image URL |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:** None (email is unique)

---

### 3.2 managed_apps
**Purpose:** Registered desktop applications per user

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Owner (freelancer) |
| name | text | NOT NULL | Application name |
| slug | text | NOT NULL | URL-friendly identifier |
| status | text | DEFAULT 'active' | Application status |
| metadata | text | | JSON metadata |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `apps_user_name_uidx` (userId, name) UNIQUE
- `apps_user_slug_uidx` (userId, slug) UNIQUE
- `apps_user_status_idx` (userId, status)

---

### 3.3 licenses
**Purpose:** License keys for applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Owner (freelancer) |
| appName | text | NOT NULL | Application name |
| licenseKey | text | NOT NULL | License key string |
| status | text | DEFAULT 'active' | License status |
| maxActivations | integer | DEFAULT 1 | Allowed activations |
| expiresAt | timestamp | | Expiration date (nullable = lifetime) |
| metadata | text | | JSON metadata |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `licenses_user_app_key_uidx` (userId, appName, licenseKey) UNIQUE
- `licenses_user_app_status_idx` (userId, appName, status)

---

### 3.4 activations
**Purpose:** Device activations for licenses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| appName | text | NOT NULL | Application name |
| appVersion | text | NOT NULL | Application version |
| licenseKey | text | NOT NULL | License key |
| machineId | text | NOT NULL | Device fingerprint |
| shopName | text | | Shop/business name |
| status | text | DEFAULT 'pending' | Activation status |
| userId | text | FOREIGN KEY → users.id | Owner |
| metadata | text | | JSON metadata |
| activatedAt | timestamp | | Activation timestamp |
| expiresAt | timestamp | | Activation expiration |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `activations_user_app_license_machine_uidx` (userId, appName, licenseKey, machineId) UNIQUE
- `activations_user_app_status_idx` (userId, appName, status)

---

### 3.5 activation_logs
**Purpose:** Audit trail for activations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | User who performed action |
| activationId | text | FOREIGN KEY → activations.id | Related activation |
| action | text | NOT NULL | Action type (approve, revoke, etc.) |
| ipAddress | text | | Client IP address |
| userAgent | text | | Client user agent |
| metadata | text | | JSON metadata |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |

**Indexes:**
- `activation_logs_user_idx` (userId)

---

### 3.6 activation_requests
**Purpose:** Pending activation approval requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Owner |
| appName | text | NOT NULL | Application name |
| appVersion | text | NOT NULL | Application version |
| machineId | text | NOT NULL | Device fingerprint |
| shopName | text | NOT NULL | Shop/business name |
| phone | text | NOT NULL | Contact phone |
| notes | text | | Additional notes |
| platform | text | | OS platform |
| userAgent | text | | Client user agent |
| status | text | DEFAULT 'pending' | Request status |
| resolvedLicenseKey | text | | Assigned license key |
| activationId | text | FOREIGN KEY → activations.id | Created activation |
| activationToken | text | | Generated token |
| tokenExpiresAt | timestamp | | Token expiration |
| approvedAt | timestamp | | Approval timestamp |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `activation_requests_user_status_idx` (userId, status)
- `activation_requests_app_name_idx` (userId, appName)
- `activation_requests_machine_id_idx` (machineId)

---

### 3.7 clients
**Purpose:** Customer/client records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Owner |
| name | text | NOT NULL | Client name |
| email | text | | Client email |
| phone | text | | Client phone |
| status | text | DEFAULT 'active' | Client status |
| isDeleted | boolean | DEFAULT false | Soft delete flag |
| notes | text | | Additional notes |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `clients_user_name_idx` (userId, name)
- `clients_user_status_idx` (userId, status)
- `clients_user_deleted_idx` (userId, isDeleted)

---

### 3.8 invoices
**Purpose:** Billing invoices

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Owner |
| clientId | text | FOREIGN KEY → clients.id | Billed client |
| invoiceNo | text | NOT NULL | Invoice number |
| status | text | DEFAULT 'draft' | Invoice status |
| currency | text | DEFAULT 'USD' | Currency code |
| invoiceLanguage | text | DEFAULT 'en' | Language code |
| isDeleted | boolean | DEFAULT false | Soft delete flag |
| totalAmount | integer | DEFAULT 0 | Total amount (cents) |
| paidAmount | integer | DEFAULT 0 | Paid amount (cents) |
| dueDate | timestamp | | Due date |
| issuedAt | timestamp | | Issue date |
| notes | text | | Additional notes |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `invoices_user_client_idx` (userId, clientId)
- `invoices_user_status_idx` (userId, status)
- `invoices_user_deleted_idx` (userId, isDeleted)
- `invoices_user_no_uidx` (userId, invoiceNo) UNIQUE

---

### 3.9 freelancer_profiles
**Purpose:** Business branding and settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Owner |
| businessName | text | | Business name |
| logoUrl | text | | Logo URL |
| logoObjectKey | text | | R2 storage key |
| contactEmail | text | | Contact email |
| contactPhone | text | | Contact phone |
| addressLine1 | text | | Address line 1 |
| addressLine2 | text | | Address line 2 |
| taxId | text | | Tax identifier |
| defaultCurrency | text | | Default currency |
| defaultInvoiceLanguage | text | | Default language |
| appLanguage | text | | App language |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `freelancer_profiles_user_uidx` (userId) UNIQUE

---

### 3.10 invoice_pdf_jobs
**Purpose:** Async PDF generation jobs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Owner |
| invoiceId | text | FOREIGN KEY → invoices.id | Related invoice |
| status | text | DEFAULT 'pending' | Job status |
| attempts | integer | DEFAULT 0 | Retry count |
| errorMessage | text | | Error message |
| outputPath | text | | PDF file path |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |
| completedAt | timestamp | | Completion time |

**Indexes:**
- `invoice_pdf_jobs_user_invoice_idx` (userId, invoiceId)
- `invoice_pdf_jobs_status_idx` (status)

---

### 3.11 user_license_keys
**Purpose:** License key encryption keys

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Owner |
| kid | text | NOT NULL | Key ID |
| keySalt | text | NOT NULL | Encryption salt |
| status | text | DEFAULT 'active' | Key status |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `user_license_keys_user_kid_uidx` (userId, kid) UNIQUE
- `user_license_keys_user_status_idx` (userId, status)

---

### 3.12 sessions (Better Auth)
**Purpose:** User session management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| token | text | UNIQUE | Session token |
| userId | text | FOREIGN KEY → users.id | Session owner |
| expiresAt | timestamp | NOT NULL | Expiration time |
| ipAddress | text | | Client IP |
| userAgent | text | | Client user agent |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

---

### 3.13 accounts (Better Auth)
**Purpose:** OAuth/social accounts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| userId | text | FOREIGN KEY → users.id | Account owner |
| provider | text | NOT NULL | OAuth provider |
| providerAccountId | text | NOT NULL | Provider account ID |
| accessToken | text | | OAuth access token |
| refreshToken | text | | OAuth refresh token |
| idToken | text | | OAuth ID token |
| accessTokenExpiresAt | timestamp | | Token expiration |
| refreshTokenExpiresAt | timestamp | | Refresh expiration |
| scope | text | | OAuth scopes |
| password | text | | Password hash (email auth) |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `accounts_user_idx` (userId)
- `accounts_provider_account_uidx` (provider, providerAccountId) UNIQUE

---

### 3.14 verification_tokens (Better Auth)
**Purpose:** Email verification tokens

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique identifier |
| identifier | text | NOT NULL | Email address |
| token | text | NOT NULL | Verification token |
| expiresAt | timestamp | NOT NULL | Expiration time |
| createdAt | timestamp | DEFAULT NOW() | Record creation time |
| updatedAt | timestamp | DEFAULT NOW() | Last update time |

**Indexes:**
- `verification_tokens_identifier_idx` (identifier)

---

## 4. Relationships

### 4.1 User → Apps
- **Type:** One-to-Many
- **Description:** Each user can manage multiple applications
- **Cascade:** DELETE CASCADE (when user deleted)

### 4.2 User → Licenses
- **Type:** One-to-Many
- **Description:** Each user can issue multiple licenses
- **Cascade:** DELETE CASCADE (when user deleted)

### 4.3 User → Clients
- **Type:** One-to-Many
- **Description:** Each user can have multiple clients
- **Cascade:** DELETE CASCADE (when user deleted)

### 4.4 User → Freelancer Profile
- **Type:** One-to-One
- **Description:** Each user has one business profile
- **Cascade:** DELETE CASCADE (when user deleted)

### 4.5 Client → Invoices
- **Type:** One-to-Many
- **Description:** Each client can have multiple invoices
- **Cascade:** RESTRICT (must delete invoices first)

### 4.6 License → Activations
- **Type:** One-to-Many
- **Description:** Each license can have multiple activations (up to maxActivations)
- **Cascade:** DELETE CASCADE (when license revoked)

### 4.7 Activation → Activation Logs
- **Type:** One-to-Many
- **Description:** Each activation has audit trail
- **Cascade:** DELETE CASCADE

### 4.8 Invoice → PDF Jobs
- **Type:** One-to-Many
- **Description:** Each invoice can have multiple PDF generation attempts
- **Cascade:** DELETE CASCADE

---

## 5. Database Migrations

Migration files located in `apps/backend/drizzle/`:

1. **0000_core_auth_activation.sql** - Core auth, apps, licenses, activations
2. **0001_licensing_user_scope.sql** - User scoping, relationships
3. **0002_freelancer_billing_pdf.sql** - Clients, invoices, PDF jobs
4. **0003_logo_object_key.sql** - Logo storage fields
5. **0004_invoice_language.sql** - Invoice language support
6. **0005_clients_soft_delete.sql** - Client soft delete
7. **0006_better_auth_core.sql** - Better Auth tables
8. **0007_activation_requests.sql** - Activation request workflow
9. **0008_invoices_soft_delete.sql** - Invoice soft delete
10. **0009_freelancer_profile_defaults.sql** - Profile defaults
11. **0010_activation_request_resolution.sql** - Request resolution fields

---

## 6. Index Strategy

### 6.1 Primary Indexes
- All tables have `id` as PRIMARY KEY
- UUID v4 format for IDs

### 6.2 Unique Constraints
- User email (global)
- App name per user
- App slug per user
- License key per user/app
- Activation per user/app/license/machine
- Invoice number per user
- Freelancer profile per user

### 6.3 Query Optimization
- User + status indexes for filtering
- User + app indexes for license queries
- Status-only indexes for background workers
- Machine ID index for activation lookup

---

## 7. Data Constraints

### 7.1 Foreign Keys
- All foreign keys reference `users.id`
- Cascade DELETE for user-owned entities
- RESTRICT for cross-entity references (invoices → clients)

### 7.2 Soft Deletes
- `clients.isDeleted` (default: false)
- `invoices.isDeleted` (default: false)
- Allows restoration of deleted records
- Filtered by default in queries

### 7.3 Status Fields
- Apps: 'active', 'inactive'
- Licenses: 'active', 'suspended', 'revoked', 'expired'
- Activations: 'pending', 'active', 'revoked', 'expired'
- Clients: 'active', 'inactive'
- Invoices: 'draft', 'sent', 'paid', 'overdue', 'cancelled'
- Jobs: 'pending', 'processing', 'completed', 'failed'

---

## 8. PostgreSQL-Specific Features

### 8.1 Connection Pooling
- Managed by pg library
- SSL mode configurable (require/disable/insecure)

### 8.2 JSON Metadata
- `metadata` fields store JSON as text
- Application-level parsing (Drizzle doesn't enforce JSON type)

### 8.3 Timestamps
- All timestamps in UTC
- `DEFAULT NOW()` for creation
- Manual update on modification

---

## 9. Migration Best Practices

1. **Always backup** before migration
2. **Test migrations** on staging first
3. **Use transactions** for multi-step migrations
4. **Document schema changes** in migration file comments
5. **Don't modify existing migrations** - create new ones
6. **Index after data load** for better performance
