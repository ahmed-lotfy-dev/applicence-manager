ALTER TABLE "invoices"
ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "invoices_user_deleted_idx"
ON "invoices" ("user_id", "is_deleted");
