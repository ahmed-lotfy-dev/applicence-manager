import { and, eq, sql } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { db } from "../db/db";
import { accounts, users } from "../db/auth-schema";
import { getAppByName, createApp } from "../services/apps";

async function ensureBetterAuthSchema() {
  const rows = await db.execute(sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('sessions', 'accounts', 'verification_tokens')
  `);

  const found = new Set(
    rows.rows.map((row) => `${String(row.table_name)}.${String(row.column_name)}`),
  );

  const required = [
    "sessions.created_at",
    "sessions.updated_at",
    "sessions.ip_address",
    "sessions.user_agent",
    "accounts.password",
    "accounts.created_at",
    "accounts.updated_at",
    "verification_tokens.id",
    "verification_tokens.created_at",
    "verification_tokens.updated_at",
  ];

  const missing = required.filter((key) => !found.has(key));
  if (missing.length > 0) {
    throw new Error(
      `Better Auth database migration is missing required columns: ${missing.join(", ")}. Run: cd apps/backend && bun run db:migrate`,
    );
  }
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
    console.warn("⚠️  ADMIN_EMAIL and one of ADMIN_PASSWORD/ADMIN_PASSWORD_HASH must be set");
    return null;
  }

  const existingUser = await db.select().from(users).where(eq(users.email, adminEmail));
  const user =
    existingUser[0] ??
    (
      await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: adminEmail,
          name: "Admin",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
    )[0];

  if (!user) return null;

  const credentialAccount = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, user.id), eq(accounts.provider, "credential")));

  if (credentialAccount.length === 0) {
    const passwordHash = adminPassword
      ? await bcrypt.hash(adminPassword, 10)
      : adminPasswordHash!;

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: user.id,
      provider: "credential",
      providerAccountId: user.id,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Admin credentials ensured: ${adminEmail}`);
  }

  return { id: user.id, email: user.email ?? adminEmail };
}

async function ensureActivationApp(userId: string) {
  const activationAppName = process.env.ACTIVATION_APP_NAME?.trim();
  if (!activationAppName) return;

  const existingApp = await getAppByName(activationAppName, userId);
  if (existingApp) return;

  const created = await createApp(activationAppName, userId);
  if (created.ok) {
    console.log(`✅ Activation app ensured: ${activationAppName}`);
  }
}

export async function initializeDatabase() {
  try {
    await ensureBetterAuthSchema();
    const adminUser = await seedAdminUser();
    if (adminUser) {
      await ensureActivationApp(adminUser.id);
    }
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Database is not migrated. Run backend migration first: cd apps/backend && bun run db:migrate",
      { cause: error },
    );
  }
}
