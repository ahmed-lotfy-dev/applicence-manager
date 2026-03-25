CREATE TABLE IF NOT EXISTS "activation_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "app_name" text NOT NULL,
  "app_version" text NOT NULL,
  "machine_id" text NOT NULL,
  "shop_name" text NOT NULL,
  "phone" text NOT NULL,
  "notes" text,
  "platform" text,
  "user_agent" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "activation_requests_user_status_idx"
  ON "activation_requests" ("user_id", "status");

CREATE INDEX IF NOT EXISTS "activation_requests_app_name_idx"
  ON "activation_requests" ("user_id", "app_name");

CREATE INDEX IF NOT EXISTS "activation_requests_machine_id_idx"
  ON "activation_requests" ("machine_id");
