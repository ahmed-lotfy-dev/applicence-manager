CREATE TABLE "licenses" (
	"id" text PRIMARY KEY NOT NULL,
	"app_name" text NOT NULL,
	"license_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"max_activations" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "licenses_app_key_uidx" ON "licenses" USING btree ("app_name","license_key");--> statement-breakpoint
CREATE INDEX "licenses_app_status_idx" ON "licenses" USING btree ("app_name","status");--> statement-breakpoint
CREATE UNIQUE INDEX "activations_app_license_machine_uidx" ON "activations" USING btree ("app_name","license_key","machine_id");--> statement-breakpoint
CREATE INDEX "activations_app_status_idx" ON "activations" USING btree ("app_name","status");