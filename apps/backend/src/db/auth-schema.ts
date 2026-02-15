import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: boolean("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  token: text("token").notNull(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const managedApps = pgTable(
  "apps",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("active"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    appNameUnique: uniqueIndex("apps_name_uidx").on(table.name),
    appSlugUnique: uniqueIndex("apps_slug_uidx").on(table.slug),
  }),
);

export const licenses = pgTable(
  "licenses",
  {
    id: text("id").primaryKey(),
    appName: text("app_name").notNull(),
    licenseKey: text("license_key").notNull(),
    status: text("status").notNull().default("active"),
    maxActivations: integer("max_activations").notNull().default(1),
    expiresAt: timestamp("expires_at"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    licenseAppKeyUnique: uniqueIndex("licenses_app_key_uidx").on(
      table.appName,
      table.licenseKey,
    ),
    licenseAppStatusIdx: index("licenses_app_status_idx").on(
      table.appName,
      table.status,
    ),
  }),
);

export const activations = pgTable(
  "activations",
  {
    id: text("id").primaryKey(),
    appName: text("app_name").notNull(),
    appVersion: text("app_version").notNull(),
    licenseKey: text("license_key").notNull(),
    machineId: text("machine_id").notNull(),
    shopName: text("shop_name"),
    status: text("status").notNull().default("pending"),
    userId: text("user_id"),
    metadata: text("metadata"),
    activatedAt: timestamp("activated_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    activationAppLicenseMachineUnique: uniqueIndex(
      "activations_app_license_machine_uidx",
    ).on(table.appName, table.licenseKey, table.machineId),
    activationAppStatusIdx: index("activations_app_status_idx").on(
      table.appName,
      table.status,
    ),
  }),
);

export const activationLogs = pgTable("activation_logs", {
  id: text("id").primaryKey(),
  activationId: text("activation_id").notNull(),
  action: text("action").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
