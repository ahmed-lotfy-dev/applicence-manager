ALTER TABLE "invoices"
ADD COLUMN IF NOT EXISTS "invoice_language" text NOT NULL DEFAULT 'en';
