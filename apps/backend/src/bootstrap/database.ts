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
    rows.rows.map(
      (row) => `${String(row.table_name)}.${String(row.column_name)}`,
    ),
  );

  const required = [
    "sessions.token",
    "sessions.user_id",
    "sessions.expires_at",
    "sessions.created_at",
    "sessions.updated_at",
    "sessions.ip_address",
    "sessions.user_agent",
    "accounts.provider",
    "accounts.provider_account_id",
    "accounts.user_id",
    "accounts.password",
    "accounts.access_token_expires_at",
    "accounts.refresh_token_expires_at",
    "accounts.created_at",
    "accounts.updated_at",
    "verification_tokens.identifier",
    "verification_tokens.token",
    "verification_tokens.expires_at",
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
    console.warn(
      "⚠️  ADMIN_EMAIL and one of ADMIN_PASSWORD/ADMIN_PASSWORD_HASH must be set",
    );
    return null;
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail));
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

  const credentialAccounts = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.userId, user.id), eq(accounts.provider, "credential")),
    );

  const passwordHash = adminPassword
    ? await bcrypt.hash(adminPassword, 10)
    : adminPasswordHash;

  if (credentialAccounts.length === 0) {
    if (!passwordHash) {
      console.warn(
        "⚠️  ADMIN_PASSWORD or ADMIN_PASSWORD_HASH is required to create admin credential login",
      );
    } else {
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
  } else if (passwordHash) {
    await db
      .update(accounts)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(
        and(eq(accounts.userId, user.id), eq(accounts.provider, "credential")),
      );
    console.log(`✅ Admin credential password updated: ${adminEmail}`);
  } else {
    console.log(`✅ Admin credential account exists: ${adminEmail}`);
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
