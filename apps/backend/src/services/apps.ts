import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db";
import { activationLogs, activations, licenses, managedApps } from "../db/auth-schema";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function listApps() {
  return db.select().from(managedApps).orderBy(asc(managedApps.name));
}

export async function getAppByName(name: string) {
  const normalizedName = name.trim();
  const [app] = await db.select().from(managedApps).where(eq(managedApps.name, normalizedName));
  return app ?? null;
}

function compactIdentifier(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function getAppByIdentifier(identifier: string) {
  const normalized = identifier.trim();
  if (!normalized) return null;

  const slugCandidate = slugify(normalized);
  const compact = compactIdentifier(normalized);

  const apps = await db.select().from(managedApps);
  return (
    apps.find((app) => {
      const appName = app.name.trim();
      const appSlug = app.slug.trim();
      return (
        appName === normalized ||
        appName.toLowerCase() === normalized.toLowerCase() ||
        appSlug === normalized ||
        appSlug === slugCandidate ||
        compactIdentifier(appName) === compact
      );
    }) ?? null
  );
}

export async function getAppById(id: string) {
  const [app] = await db.select().from(managedApps).where(eq(managedApps.id, id));
  return app ?? null;
}

export async function createApp(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return { ok: false as const, error: "App name is required" };
  }

  const existing = await getAppByName(normalizedName);
  if (existing) {
    return { ok: true as const, app: existing };
  }

  const id = crypto.randomUUID();
  const slug = slugify(normalizedName) || `app-${id.slice(0, 8)}`;

  await db.insert(managedApps).values({
    id,
    name: normalizedName,
    slug,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [created] = await db.select().from(managedApps).where(eq(managedApps.id, id));
  if (!created) {
    return { ok: false as const, error: "Failed to create app" };
  }

  return { ok: true as const, app: created };
}

export async function getOrCreateAppByName(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) return null;
  const existing = await getAppByName(normalizedName);
  if (existing) return existing;

  const created = await createApp(normalizedName);
  if (!created.ok) return null;
  return created.app;
}

export async function updateAppById(
  id: string,
  input: { name?: string; status?: "active" | "inactive" },
) {
  const existing = await getAppById(id);
  if (!existing) {
    return { ok: false as const, error: "App not found" };
  }

  const nextName = input.name?.trim() || existing.name;
  const nextStatus = input.status || (existing.status as "active" | "inactive");

  if (nextName !== existing.name) {
    const duplicate = await getAppByName(nextName);
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
      .where(eq(managedApps.id, id));

    if (nextName !== existing.name) {
      await tx
        .update(licenses)
        .set({
          appName: nextName,
          updatedAt: new Date(),
        })
        .where(eq(licenses.appName, existing.name));

      await tx
        .update(activations)
        .set({
          appName: nextName,
          updatedAt: new Date(),
        })
        .where(eq(activations.appName, existing.name));
    }
  });

  const updated = await getAppById(id);
  if (!updated) {
    return { ok: false as const, error: "Failed to update app" };
  }

  return { ok: true as const, app: updated };
}

export async function deleteAppById(id: string) {
  const [existing] = await db.select().from(managedApps).where(eq(managedApps.id, id));
  if (!existing) {
    return { ok: false as const, error: "App not found" };
  }

  const relatedActivations = await db
    .select({ id: activations.id })
    .from(activations)
    .where(eq(activations.appName, existing.name));

  if (relatedActivations.length > 0) {
    const activationIds = relatedActivations.map((activation) => activation.id);
    await db.delete(activationLogs).where(inArray(activationLogs.activationId, activationIds));
  }

  await db.delete(activations).where(eq(activations.appName, existing.name));
  await db.delete(licenses).where(eq(licenses.appName, existing.name));
  await db.delete(managedApps).where(eq(managedApps.id, id));

  return { ok: true as const };
}
