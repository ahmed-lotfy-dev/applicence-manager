import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { users } from "../db/auth-schema";

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
    console.warn("⚠️  ADMIN_EMAIL and one of ADMIN_PASSWORD/ADMIN_PASSWORD_HASH must be set");
    return;
  }

  const existingUser = await db.select().from(users).where(eq(users.email, adminEmail));

  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: adminEmail,
      name: "Admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
  }
}

export async function initializeDatabase() {
  try {
    await seedAdminUser();
  } catch (error) {
    throw new Error(
      "Database is not migrated. Run backend migration first: bun run db:generate && bun run db:migrate",
      { cause: error },
    );
  }
}
