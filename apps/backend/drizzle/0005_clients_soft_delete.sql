ALTER TABLE "clients"
ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "clients_user_deleted_idx"
ON "clients" ("user_id", "is_deleted");
