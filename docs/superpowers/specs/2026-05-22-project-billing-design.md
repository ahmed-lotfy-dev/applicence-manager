# Project-Based Billing

## Problem

Current invoicing treats each invoice as an independent billing entity. For fixed-price contracts paid in installments (e.g. a 12,500 EGP website build paid via multiple partial payments), this produces misleading dashboard totals. The sum of all invoices for a client may exceed or fragment the true contract value. The system has no concept of a "project" grouping invoices under a single fixed-price agreement.

## Solution

Introduce a `projects` entity that groups invoices under a fixed-price contract, along with `milestones` for planned billing schedules and `payments` as separate records for each payment event. The project becomes the primary billing unit; invoices are installments against it.

## Schema

### projects

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | UUID |
| user_id | text (FK → users) | |
| client_id | text (FK → clients) | |
| name | text | e.g. "Website Build" |
| description | text | nullable |
| total_amount | integer | in cents |
| status | text | draft → active → completed / cancelled |
| notes | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

Indexes: `(user_id, status)`, `(user_id, client_id)`.

### milestones

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | UUID |
| project_id | text (FK → projects) | |
| name | text | e.g. "50% Advance" |
| description | text | nullable |
| amount | integer | in cents |
| due_date | timestamp | nullable |
| invoice_id | text (FK → invoices) | nullable, set when invoice generated |
| sort_order | integer | |
| created_at | timestamp | |
| updated_at | timestamp | |

Constraint: `SUM(milestones.amount) <= project.total_amount`.

### payments

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | UUID |
| user_id | text (FK → users) | |
| invoice_id | text (FK → invoices) | |
| amount | integer | in cents |
| payment_method | text | cash / bank_transfer / card |
| payment_date | timestamp | |
| notes | text | nullable |
| receipt_pdf_url | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### invoices (changes)

Add one nullable column: `project_id text (FK → projects)`.

Existing invoices get `project_id = NULL` and continue working as standalone invoices. All new invoices require a `project_id`.

## Data Flow

### User → Client → Project → Invoice → Payment

```
User
 └── Clients
      └── Projects
           └── Invoices
                └── Payments
```

### Stats calculations

- **Contract value:** `project.total_amount`
- **Total invoiced:** `SUM(invoices.total_amount)` WHERE invoices.project_id = project.id AND invoices.is_deleted = false
- **Total paid:** `SUM(payments.amount)` WHERE payments.invoice_id IN (invoices on this project)
- **Remaining:** `project.total_amount - total_paid`
- **Progress:** `total_paid / project.total_amount * 100`

### Creation flows

**Flow A: Project with pre-planned milestones**
1. Create project (client, name, total_amount, status = draft)
2. Add milestones (name, amount, due_date) — validates sum <= total
3. Generate invoices from selected milestones → creates invoice per milestone, sets milestone.invoice_id
4. Invoices default to draft, user sends them individually

**Flow B: Ad-hoc invoices against project**
1. Create project without milestones
2. Create invoices directly against the project with any totalAmount
3. System warns if sum of invoices exceeds project total

**Flow C: Record payment**
1. On invoice detail, user clicks "Record Payment"
2. Enters amount, date, method
3. Creates payment record + optionally generates PDF receipt
4. Updates invoice.paidAmount to SUM(payments) on that invoice

## Frontend

### Navigation

| Link | Path | Notes |
|------|------|-------|
| Dashboard | /dashboard | Project + invoice stats |
| Clients | /clients | No change |
| Projects | /projects | NEW — default page after login, project list |
| — [Project] | /projects/:id | NEW — project detail with milestones/invoices/payments |
| Invoices | /invoices | Kept — flat list, each row shows project name |
| Licensing | /licensing | No change |
| Settings | /settings | No change |

### Pages

**/projects** — default landing page
- Table: Project, Client, Contract, Invoiced, Paid, Remaining, Status, Actions
- Default filter: status != completed, status != cancelled (active + draft)
- Filters: status, client
- Actions: View, Archive

**/projects/:id** — project detail
- Header: project name, client, contract value, status badge
- Stats cards: Invoiced, Paid, Remaining, Progress %
- Milestones section (if any): list with generate-invoice action
- Invoices section: table of invoices for this project with amounts, paid, status, dates
- Payments section: table of payments with amount, date, method
- Action buttons: New Invoice, Record Payment

**/invoices** (unchanged layout, enhanced)
- Existing flat list, with added "Project" column
- Default filter: is_deleted = false
- Each invoice row shows project name (clickable)
- Dates displayed: issuedAt, dueDate, updatedAt

### Filters
- Default to only active/non-archived records everywhere
- Show dates (issued, paid, due) in tables so user knows when amounts were paid

## Migration

1. Create `projects`, `milestones`, `payments` tables via drizzle migration
2. Add `project_id` column to `invoices` table
3. Existing invoices get `project_id = NULL` — fully backward compatible
4. No data migration needed for existing records
5. New `getProjectBillingStats()` and `getDashboardStats()` functions
6. Existing `getBillingStats()` kept for backward compat on /invoices page

## Backend API

### New endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project detail with stats |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Archive project |
| POST | /api/projects/:id/milestones | Add milestone |
| DELETE | /api/projects/:id/milestones/:mid | Remove milestone |
| POST | /api/invoices/:id/payments | Record payment against invoice |
| GET | /api/projects/:id/stats | Get project stats |
| GET | /api/dashboard/stats | Dashboard stats (project-level) |

### Existing endpoint changes

- `POST /api/invoices` — accept optional `project_id` (required if project flow)
- `GET /api/invoices` — add `project_name` to joined response
- `GET /api/billing/stats` — add project-level aggregation option

## Out of Scope

- Recurring/subscription billing
- Time tracking / hourly billing
- Expense tracking
- Multi-currency within a single project
