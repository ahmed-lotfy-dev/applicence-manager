ALTER TABLE "activation_requests"
  ADD COLUMN IF NOT EXISTS "resolved_license_key" text,
  ADD COLUMN IF NOT EXISTS "activation_id" text,
  ADD COLUMN IF NOT EXISTS "activation_token" text,
  ADD COLUMN IF NOT EXISTS "token_expires_at" timestamp,
  ADD COLUMN IF NOT EXISTS "approved_at" timestamp;
