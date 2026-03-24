CREATE TABLE IF NOT EXISTS "clients" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "status" text DEFAULT 'active' NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "client_id" text NOT NULL,
  "invoice_no" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "total_amount" integer DEFAULT 0 NOT NULL,
  "paid_amount" integer DEFAULT 0 NOT NULL,
  "due_date" timestamp,
  "issued_at" timestamp,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "freelancer_profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "business_name" text,
  "logo_url" text,
  "contact_email" text,
  "contact_phone" text,
  "address_line_1" text,
  "address_line_2" text,
  "tax_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoice_pdf_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "invoice_id" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "error_message" text,
  "output_path" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "clients_user_name_idx" ON "clients" ("user_id", "name");
CREATE INDEX IF NOT EXISTS "clients_user_status_idx" ON "clients" ("user_id", "status");

CREATE INDEX IF NOT EXISTS "invoices_user_client_idx" ON "invoices" ("user_id", "client_id");
CREATE INDEX IF NOT EXISTS "invoices_user_status_idx" ON "invoices" ("user_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_user_no_uidx" ON "invoices" ("user_id", "invoice_no");

CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_profiles_user_uidx"
  ON "freelancer_profiles" ("user_id");

CREATE INDEX IF NOT EXISTS "invoice_pdf_jobs_user_invoice_idx"
  ON "invoice_pdf_jobs" ("user_id", "invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_pdf_jobs_status_idx"
  ON "invoice_pdf_jobs" ("status");
