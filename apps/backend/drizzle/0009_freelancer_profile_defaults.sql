ALTER TABLE "freelancer_profiles"
ADD COLUMN IF NOT EXISTS "default_currency" text;

ALTER TABLE "freelancer_profiles"
ADD COLUMN IF NOT EXISTS "default_invoice_language" text;

ALTER TABLE "freelancer_profiles"
ADD COLUMN IF NOT EXISTS "app_language" text;
