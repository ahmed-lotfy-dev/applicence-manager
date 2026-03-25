import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db";
import { activationLogs, activations, licenses, managedApps, users } from "../db/auth-schema";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function compactIdentifier(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesIdentifier(
  identifier: string,
  app: { name: string; slug: string },
): boolean {
  const normalized = identifier.trim();
  if (!normalized) return false;

  const slugCandidate = slugify(normalized);
  const compact = compactIdentifier(normalized);
  const appName = app.name.trim();
  const appSlug = app.slug.trim();

  return (
    appName === normalized ||
    appName.toLowerCase() === normalized.toLowerCase() ||
    appSlug === normalized ||
    appSlug === slugCandidate ||
    compactIdentifier(appName) === compact
  );
}

export async function listApps(userId: string) {
  return db
    .select()
    .from(managedApps)
    .where(eq(managedApps.userId, userId))
    .orderBy(asc(managedApps.name));
}

export async function getAppByName(name: string, userId: string) {
  const normalizedName = name.trim();
  if (!normalizedName) return null;
  const [app] = await db
    .select()
    .from(managedApps)
    .where(and(eq(managedApps.userId, userId), eq(managedApps.name, normalizedName)));
  return app ?? null;
}

export async function getAppByIdentifier(identifier: string, userId: string) {
  const normalized = identifier.trim();
  if (!normalized) return null;

  const apps = await db
    .select()
    .from(managedApps)
    .where(eq(managedApps.userId, userId));

  return (
    apps.find((app) => matchesIdentifier(normalized, app)) ?? null
  );
}

export async function resolveAppOwnerByIdentifier(identifier: string) {
  const normalized = identifier.trim();
  if (!normalized) return null;

  const apps = await db.select().from(managedApps);
  const matchedApp = apps.find((app) => matchesIdentifier(normalized, app)) ?? null;
  if (matchedApp) return matchedApp;

  const activationAppName = process.env.ACTIVATION_APP_NAME?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!activationAppName || !adminEmail || !matchesIdentifier(normalized, {
    name: activationAppName,
    slug: slugify(activationAppName),
  })) {
    return null;
  }

  const [adminUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail));

  if (!adminUser?.id) {
    return null;
  }

  return (await getOrCreateAppByName(activationAppName, adminUser.id)) ?? null;
}

export async function getAppById(id: string, userId: string) {
  const [app] = await db
    .select()
    .from(managedApps)
    .where(and(eq(managedApps.id, id), eq(managedApps.userId, userId)));
  return app ?? null;
}

export async function createApp(name: string, userId: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return { ok: false as const, error: "App name is required" };
  }

  const existing = await getAppByName(normalizedName, userId);
  if (existing) {
    return { ok: true as const, app: existing };
  }

  const id = crypto.randomUUID();
  const slug = slugify(normalizedName) || `app-${id.slice(0, 8)}`;

  await db.insert(managedApps).values({
    id,
    userId,
    name: normalizedName,
    slug,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await getAppById(id, userId);
  if (!created) {
    return { ok: false as const, error: "Failed to create app" };
  }

  return { ok: true as const, app: created };
}

export async function getOrCreateAppByName(name: string, userId: string) {
  const normalizedName = name.trim();
  if (!normalizedName) return null;
  const existing = await getAppByName(normalizedName, userId);
  if (existing) return existing;

  const created = await createApp(normalizedName, userId);
  if (!created.ok) return null;
  return created.app;
}

export async function updateAppById(
  id: string,
  userId: string,
  input: { name?: string; status?: "active" | "inactive" },
) {
  const existing = await getAppById(id, userId);
  if (!existing) {
    return { ok: false as const, error: "App not found" };
  }

  const nextName = input.name?.trim() || existing.name;
  const nextStatus = input.status || (existing.status as "active" | "inactive");

  if (nextName !== existing.name) {
    const duplicate = await getAppByName(nextName, userId);
    if (duplicate && duplicate.id !== id) {
      return { ok: false as const, error: "App name already exists" };
    }
  }

  const nextSlug = slugify(nextName) || existing.slug;

  await db.transaction(async (tx) => {
    await tx
      .update(managedApps)
      .set({
        name: nextName,
        slug: nextSlug,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(managedApps.id, id), eq(managedApps.userId, userId)));

    if (nextName !== existing.name) {
      await tx
        .update(licenses)
        .set({
          appName: nextName,
          updatedAt: new Date(),
        })
        .where(and(eq(licenses.userId, userId), eq(licenses.appName, existing.name)));

      await tx
        .update(activations)
        .set({
          appName: nextName,
          updatedAt: new Date(),
        })
        .where(and(eq(activations.userId, userId), eq(activations.appName, existing.name)));
    }
  });

  const updated = await getAppById(id, userId);
  if (!updated) {
    return { ok: false as const, error: "Failed to update app" };
  }

  return { ok: true as const, app: updated };
}

export async function deleteAppById(id: string, userId: string) {
  const existing = await getAppById(id, userId);
  if (!existing) {
    return { ok: false as const, error: "App not found" };
  }

  const relatedActivations = await db
    .select({ id: activations.id })
    .from(activations)
    .where(and(eq(activations.userId, userId), eq(activations.appName, existing.name)));

  if (relatedActivations.length > 0) {
    const activationIds = relatedActivations.map((activation) => activation.id);
    await db.delete(activationLogs).where(inArray(activationLogs.activationId, activationIds));
  }

  await db
    .delete(activations)
    .where(and(eq(activations.userId, userId), eq(activations.appName, existing.name)));
  await db
    .delete(licenses)
    .where(and(eq(licenses.userId, userId), eq(licenses.appName, existing.name)));
  await db
    .delete(managedApps)
    .where(and(eq(managedApps.id, id), eq(managedApps.userId, userId)));

  return { ok: true as const };
}
