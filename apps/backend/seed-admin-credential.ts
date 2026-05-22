import { db } from "./src/db/db";
import { and, eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { users, accounts } from "./src/db/auth-schema";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

if (!adminEmail) {
  console.error("ERROR: ADMIN_EMAIL must be set in the environment.");
  process.exit(1);
}

if (!adminPassword && !adminPasswordHash) {
  console.error(
    "ERROR: ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must be set in the environment.",
  );
  process.exit(1);
}

async function seedAdminCredential() {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail));
  const user = existingUser[0];

  if (!user) {
    console.error(
      `ERROR: user with email ${adminEmail} does not exist. Create the user first or use your app signup flow.`,
    );
    process.exit(1);
  }

  const passwordHash = adminPassword
    ? await bcrypt.hash(adminPassword, 10)
    : adminPasswordHash!;

  const credentialAccount = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.userId, user.id), eq(accounts.provider, "credential")),
    );

  if (credentialAccount.length === 0) {
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: user.id,
      provider: "credential",
      providerAccountId: user.id,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Created credential login for ${adminEmail}`);
  } else {
    await db
      .update(accounts)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(
        and(eq(accounts.userId, user.id), eq(accounts.provider, "credential")),
      );
    console.log(`✅ Updated credential password for ${adminEmail}`);
  }
}

seedAdminCredential().catch((error) => {
  console.error("ERROR seeding admin credential:", error);
  process.exit(1);
});
