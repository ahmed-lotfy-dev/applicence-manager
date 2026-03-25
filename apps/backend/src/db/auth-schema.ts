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
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userLicenseKeys = pgTable(
  "user_license_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kid: text("kid").notNull(),
    keySalt: text("key_salt").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userKidUnique: uniqueIndex("user_license_keys_user_kid_uidx").on(
      table.userId,
      table.kid,
    ),
    userStatusIdx: index("user_license_keys_user_status_idx").on(
      table.userId,
      table.status,
    ),
  }),
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    accountsUserIdx: index("accounts_user_idx").on(table.userId),
    accountsProviderAccountUnique: uniqueIndex("accounts_provider_account_uidx").on(
      table.provider,
      table.providerAccountId,
    ),
  }),
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    verificationIdentifierIdx: index("verification_tokens_identifier_idx").on(table.identifier),
  }),
);

export const managedApps = pgTable(
  "apps",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("active"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    appUserNameUnique: uniqueIndex("apps_user_name_uidx").on(
      table.userId,
      table.name,
    ),
    appUserSlugUnique: uniqueIndex("apps_user_slug_uidx").on(
      table.userId,
      table.slug,
    ),
    appUserStatusIdx: index("apps_user_status_idx").on(
      table.userId,
      table.status,
    ),
  }),
);

export const licenses = pgTable(
  "licenses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
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
    licenseUserAppKeyUnique: uniqueIndex("licenses_user_app_key_uidx").on(
      table.userId,
      table.appName,
      table.licenseKey,
    ),
    licenseUserAppStatusIdx: index("licenses_user_app_status_idx").on(
      table.userId,
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
    activationUserAppLicenseMachineUnique: uniqueIndex(
      "activations_user_app_license_machine_uidx",
    ).on(table.userId, table.appName, table.licenseKey, table.machineId),
    activationUserAppStatusIdx: index("activations_user_app_status_idx").on(
      table.userId,
      table.appName,
      table.status,
    ),
  }),
);

export const activationLogs = pgTable(
  "activation_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    activationId: text("activation_id").notNull(),
    action: text("action").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    activationLogsUserIdx: index("activation_logs_user_idx").on(table.userId),
  }),
);

export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    status: text("status").notNull().default("active"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientsUserNameIdx: index("clients_user_name_idx").on(table.userId, table.name),
    clientsUserStatusIdx: index("clients_user_status_idx").on(table.userId, table.status),
    clientsUserDeletedIdx: index("clients_user_deleted_idx").on(table.userId, table.isDeleted),
  }),
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    clientId: text("client_id").notNull(),
    invoiceNo: text("invoice_no").notNull(),
    status: text("status").notNull().default("draft"),
    currency: text("currency").notNull().default("USD"),
    invoiceLanguage: text("invoice_language").notNull().default("en"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    totalAmount: integer("total_amount").notNull().default(0),
    paidAmount: integer("paid_amount").notNull().default(0),
    dueDate: timestamp("due_date"),
    issuedAt: timestamp("issued_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    invoicesUserClientIdx: index("invoices_user_client_idx").on(table.userId, table.clientId),
    invoicesUserStatusIdx: index("invoices_user_status_idx").on(table.userId, table.status),
    invoicesUserDeletedIdx: index("invoices_user_deleted_idx").on(table.userId, table.isDeleted),
    invoicesUserNoUnique: uniqueIndex("invoices_user_no_uidx").on(table.userId, table.invoiceNo),
  }),
);

export const freelancerProfiles = pgTable(
  "freelancer_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    businessName: text("business_name"),
    logoUrl: text("logo_url"),
    logoObjectKey: text("logo_object_key"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    taxId: text("tax_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    profileUserUnique: uniqueIndex("freelancer_profiles_user_uidx").on(table.userId),
  }),
);

export const invoicePdfJobs = pgTable(
  "invoice_pdf_jobs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    invoiceId: text("invoice_id").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    errorMessage: text("error_message"),
    outputPath: text("output_path"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    invoicePdfJobsUserInvoiceIdx: index("invoice_pdf_jobs_user_invoice_idx").on(
      table.userId,
      table.invoiceId,
    ),
    invoicePdfJobsStatusIdx: index("invoice_pdf_jobs_status_idx").on(table.status),
  }),
);

export const activationRequests = pgTable(
  "activation_requests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    appName: text("app_name").notNull(),
    appVersion: text("app_version").notNull(),
    machineId: text("machine_id").notNull(),
    shopName: text("shop_name").notNull(),
    phone: text("phone").notNull(),
    notes: text("notes"),
    platform: text("platform"),
    userAgent: text("user_agent"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    activationRequestsUserStatusIdx: index("activation_requests_user_status_idx").on(
      table.userId,
      table.status,
    ),
    activationRequestsAppNameIdx: index("activation_requests_app_name_idx").on(
      table.userId,
      table.appName,
    ),
    activationRequestsMachineIdIdx: index("activation_requests_machine_id_idx").on(table.machineId),
  }),
);
