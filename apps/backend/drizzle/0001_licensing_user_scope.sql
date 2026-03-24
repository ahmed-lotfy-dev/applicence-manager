CREATE TABLE IF NOT EXISTS "apps" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "licenses" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text,
  "app_name" text NOT NULL,
  "license_key" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "max_activations" integer DEFAULT 1 NOT NULL,
  "expires_at" timestamp,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_license_keys" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "kid" text NOT NULL,
  "key_salt" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "user_id" text;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "user_id" text;

UPDATE "apps"
SET "user_id" = (
  SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1
)
WHERE "user_id" IS NULL;

UPDATE "licenses"
SET "user_id" = (
  SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1
)
WHERE "user_id" IS NULL;

UPDATE "activations" AS a
SET "user_id" = l."user_id"
FROM "licenses" AS l
WHERE a."user_id" IS NULL
  AND a."app_name" = l."app_name"
  AND a."license_key" = l."license_key";

UPDATE "activation_logs" AS al
SET "user_id" = a."user_id"
FROM "activations" AS a
WHERE al."user_id" IS NULL
  AND al."activation_id" = a."id";

DROP INDEX IF EXISTS "apps_name_uidx";
DROP INDEX IF EXISTS "apps_slug_uidx";
DROP INDEX IF EXISTS "licenses_app_key_uidx";
DROP INDEX IF EXISTS "licenses_app_status_idx";
DROP INDEX IF EXISTS "activations_app_license_machine_uidx";
DROP INDEX IF EXISTS "activations_app_status_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "apps_user_name_uidx" ON "apps" ("user_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "apps_user_slug_uidx" ON "apps" ("user_id", "slug");
CREATE INDEX IF NOT EXISTS "apps_user_status_idx" ON "apps" ("user_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "licenses_user_app_key_uidx"
  ON "licenses" ("user_id", "app_name", "license_key");
CREATE INDEX IF NOT EXISTS "licenses_user_app_status_idx"
  ON "licenses" ("user_id", "app_name", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "activations_user_app_license_machine_uidx"
  ON "activations" ("user_id", "app_name", "license_key", "machine_id");
CREATE INDEX IF NOT EXISTS "activations_user_app_status_idx"
  ON "activations" ("user_id", "app_name", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "user_license_keys_user_kid_uidx"
  ON "user_license_keys" ("user_id", "kid");
CREATE INDEX IF NOT EXISTS "user_license_keys_user_status_idx"
  ON "user_license_keys" ("user_id", "status");
