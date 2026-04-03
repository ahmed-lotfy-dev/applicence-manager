# Fawtarly

**A SaaS platform for freelancers - by a freelancer, for freelancers.**

Manage clients, invoices, receipts, payments, and licensing all in one place. Built by a freelancer who struggled with official receipts and money management.

---

## What is Fawtarly?

Fawtarly is a comprehensive platform designed to solve real problems freelancers face:

- **Receipt Management** - Generate official receipts for client payments
- **Invoice Creation** - Professional invoices with PDF generation
- **Client Tracking** - Manage client relationships and history
- **Payment Tracking** - Monitor paid/unpaid amounts, overdue invoices
- **Money Management** - Clear view of your income and outstanding payments
- **Application Licensing** - Protect and license your desktop applications

### Why I Built This

As a freelancer developer, I struggled with:
- Creating official receipts for clients
- Tracking who paid what and when
- Managing multiple clients and their payment history
- Knowing exactly how much money I'm owed
- Licensing my desktop applications without expensive solutions

Fawtarly solves all these problems in one unified platform.

---

## Core Features

### 1. Client Management
- Add and manage clients
- Track client contact info (email, phone, notes)
- Soft delete/archive inactive clients
- Client payment history

### 2. Invoices & Receipts
- Create professional invoices
- Generate PDF receipts automatically
- Track payment status (draft, sent, paid, overdue)
- Multiple currencies support
- Arabic and English invoice templates
- Email invoices directly to clients

### 3. Payment Tracking
- Track partial and full payments
- Payment status dashboard
- Revenue analytics
- Outstanding amount tracking

### 4. Application Licensing (for Desktop Apps)
- License key generation
- Device binding and activation limits
- Manual activation approval workflow
- Activation analytics
- Multi-application support

### 5. Freelancer Branding
- Custom brand name and logo
- Invoice theming (colors)
- Default currency and language settings
- Custom invoice footer text

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Bun + Elysia.js |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Frontend | React 19 + Vite 7 |
| Auth | Better Auth (email + OAuth) |
| Storage | Cloudflare R2 |
| Email | Resend API |
| PDF | PDFKit |

---

## Monorepo Structure

```
fawtarly/
├── apps/
│   ├── backend/          # API server, auth, database
│   └── frontend/         # React web application
├── docs/                 # Documentation
│   ├── PRD.md
│   ├── ERD.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
└── work-done/            # Development notes
```

---

## Quick Start

### Prerequisites
- Bun runtime
- PostgreSQL database (or Neon account)
- Cloudflare R2 account (for file uploads)
- Resend account (for emails)

### Setup

1. **Clone and install:**
```bash
git clone https://github.com/yourusername/fawtarly.git
cd fawtarly
bun install
```

2. **Configure environment:**
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your values
```

3. **Run database migrations:**
```bash
cd apps/backend
bun run db:migrate
```

4. **Start development:**
```bash
bun run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Environment Variables

### Required

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/fawtarly

# Authentication
BETTER_AUTH_SECRET=<generate-with-openssl-rand-hex-32>
BETTER_AUTH_URL=http://localhost:3000

# OAuth (optional but recommended)
GITHUB_CLIENT_ID=<github-client-id>
GITHUB_CLIENT_SECRET=<github-client-secret>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>

# Email
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@yourdomain.com

# Storage
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_NAME=fawtarly-uploads
```

### Optional

```env
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
ACTIVATION_TOKEN_TTL_DAYS=30
```

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment guide.

### Quick Deploy with Docker

```bash
docker-compose up -d
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](docs/PRD.md) | Product Requirements Document |
| [ERD.md](docs/ERD.md) | Entity Relationship Diagram |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System Architecture |
| [API.md](docs/API.md) | API Reference |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment Guide |

---

## Project Status

**Status:** Active Development

Current focus:
- Receipt and invoice generation
- Payment tracking improvements
- Client management enhancements
- Licensing features (used by the creator for their own desktop apps)

---

## License

MIT

---

## Author

Built by a freelancer, for freelancers. Created out of necessity for managing receipts, invoices, and payments efficiently.
