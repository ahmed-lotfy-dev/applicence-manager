ALTER TABLE "sessions"
ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "sessions"
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "sessions"
ADD COLUMN IF NOT EXISTS "ip_address" text;

ALTER TABLE "sessions"
ADD COLUMN IF NOT EXISTS "user_agent" text;

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_uidx" ON "sessions" ("token");

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "access_token" text;

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "refresh_token" text;

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "id_token" text;

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp;

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp;

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "scope" text;

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "password" text;

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

CREATE INDEX IF NOT EXISTS "accounts_user_idx" ON "accounts" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_account_uidx" ON "accounts" ("provider", "provider_account_id");

ALTER TABLE "verification_tokens"
ADD COLUMN IF NOT EXISTS "id" text;

UPDATE "verification_tokens"
SET "id" = COALESCE("id", md5(random()::text || clock_timestamp()::text))
WHERE "id" IS NULL;

ALTER TABLE "verification_tokens"
ALTER COLUMN "id" SET NOT NULL;

ALTER TABLE "verification_tokens"
ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "verification_tokens"
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verification_tokens_pkey'
  ) THEN
    ALTER TABLE "verification_tokens"
    ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "verification_tokens_identifier_idx" ON "verification_tokens" ("identifier");
