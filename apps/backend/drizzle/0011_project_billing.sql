CREATE TABLE IF NOT EXISTS "projects" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "client_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "total_amount" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'draft',
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "projects_user_status_idx" ON "projects" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "projects_user_client_idx" ON "projects" ("user_id", "client_id");

CREATE TABLE IF NOT EXISTS "milestones" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "amount" integer NOT NULL DEFAULT 0,
  "due_date" timestamp,
  "invoice_id" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "milestones_project_idx" ON "milestones" ("project_id");
CREATE INDEX IF NOT EXISTS "milestones_project_invoice_idx" ON "milestones" ("project_id", "invoice_id");

CREATE TABLE IF NOT EXISTS "payments" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "invoice_id" text NOT NULL,
  "amount" integer NOT NULL DEFAULT 0,
  "payment_method" text,
  "payment_date" timestamp DEFAULT now() NOT NULL,
  "notes" text,
  "receipt_pdf_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "payments_user_idx" ON "payments" ("user_id");
CREATE INDEX IF NOT EXISTS "payments_invoice_idx" ON "payments" ("invoice_id");

ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "project_id" text;
CREATE INDEX IF NOT EXISTS "invoices_user_project_idx" ON "invoices" ("user_id", "project_id");
