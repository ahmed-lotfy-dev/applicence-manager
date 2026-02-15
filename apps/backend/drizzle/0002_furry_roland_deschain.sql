CREATE TABLE "apps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "apps_name_uidx" ON "apps" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "apps_slug_uidx" ON "apps" USING btree ("slug");