CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text,
  "email" text UNIQUE,
  "email_verified" boolean,
  "image" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "token" text NOT NULL,
  "user_id" text NOT NULL,
  "expires_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "activations" (
  "id" text PRIMARY KEY NOT NULL,
  "app_name" text NOT NULL,
  "app_version" text NOT NULL,
  "license_key" text NOT NULL,
  "machine_id" text NOT NULL,
  "shop_name" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "user_id" text,
  "metadata" text,
  "activated_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "activation_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text,
  "activation_id" text NOT NULL,
  "action" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "activations" ADD COLUMN IF NOT EXISTS "shop_name" text;
ALTER TABLE "activation_logs" ADD COLUMN IF NOT EXISTS "user_id" text;

CREATE INDEX IF NOT EXISTS "activation_logs_user_idx" ON "activation_logs" ("user_id");
