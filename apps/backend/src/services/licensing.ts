import { and, count, eq, ilike, inArray } from "drizzle-orm";
import { randomBytes, randomInt } from "node:crypto";
import { db } from "../db/db";
import { activationLogs, activations, licenses } from "../db/auth-schema";
import { activationTokenTtlDays } from "../lib/env";
import {
  signLicenseActivationToken,
  verifyLicenseActivationToken,
} from "../lib/license-token";
import { getAppByIdentifier, getOrCreateAppByName } from "./apps";

const DEFAULT_TOKEN_TTL_DAYS = activationTokenTtlDays;
type ActivationType = "machine_id_bound" | "pre_generated";

function normalizeRequestedAppName(appName: string): string {
  const normalized = appName.trim();
  if (!normalized) {
    throw new Error("APP_NAME_REQUIRED");
  }
  return normalized;
}

function randomGroup(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += alphabet[randomInt(alphabet.length)] || "X";
  }
  return output;
}

function generateLicenseKey(): string {
  return `${randomGroup(5)}-${randomGroup(5)}-${randomGroup(5)}-${randomGroup(5)}-${randomGroup(5)}`;
}

async function createUniqueLicenseKey(userId: string, appName: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateLicenseKey();
    const existing = await db
      .select({ id: licenses.id })
      .from(licenses)
      .where(
        and(
          eq(licenses.userId, userId),
          eq(licenses.appName, appName),
          eq(licenses.licenseKey, candidate),
        ),
      );
    if (existing.length === 0) {
      return candidate;
    }
  }

  return `${generateLicenseKey()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

async function findPublicLicense(appName: string, licenseKey: string) {
  const exactRows = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.appName, appName), eq(licenses.licenseKey, licenseKey)));

  if (exactRows.length === 1) {
    return exactRows[0] ?? null;
  }
  if (exactRows.length > 1) {
    return null;
  }

  const keyOnlyRows = await db
    .select()
    .from(licenses)
    .where(eq(licenses.licenseKey, licenseKey));

  if (keyOnlyRows.length === 1) {
    return keyOnlyRows[0] ?? null;
  }

  const normalized = appName.toLowerCase();
  const matched = keyOnlyRows.filter(
    (row) => row.appName.toLowerCase() === normalized,
  );
  if (matched.length === 1) {
    return matched[0] ?? null;
  }

  return null;
}

export async function issueLicense(
  userId: string,
  input: {
    appName: string;
    maxActivations?: number;
    lockedMachineId?: string;
    metadata?: unknown;
  },
) {
  const requestedAppName = normalizeRequestedAppName(input.appName);
  const app = await getAppByIdentifier(requestedAppName, userId);
  const ensuredApp = app || (await getOrCreateAppByName(requestedAppName, userId));
  if (!ensuredApp) throw new Error("APP_NOT_FOUND");
  const appName = ensuredApp.name;
  const maxActivations = Math.max(1, input.maxActivations || 1);
  const expiresAt = null;

  const licenseKey = await createUniqueLicenseKey(userId, appName);
  const id = crypto.randomUUID();

  const lockedMachineId = input.lockedMachineId?.trim() || undefined;
  const mergedMetadata = {
    ...(input.metadata && typeof input.metadata === "object"
      ? (input.metadata as Record<string, unknown>)
      : {}),
    ...(lockedMachineId ? { lockedMachineId } : {}),
  };

  await db.insert(licenses).values({
    id,
    userId,
    appName,
    licenseKey,
    status: "active",
    maxActivations,
    expiresAt,
    metadata: Object.keys(mergedMetadata).length ? JSON.stringify(mergedMetadata) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    id,
    appName,
    licenseKey,
    status: "active",
    maxActivations,
    expiresAt,
  };
}

export async function listLicenses(userId: string, appName?: string) {
  const normalizedAppName = appName?.trim();
  const rows = normalizedAppName
    ? await db
        .select()
        .from(licenses)
        .where(and(eq(licenses.userId, userId), ilike(licenses.appName, `%${normalizedAppName}%`)))
    : await db.select().from(licenses).where(eq(licenses.userId, userId));

  if (rows.length === 0) {
    return [];
  }

  const licensesWithUsage = await Promise.all(
    rows.map(async (license) => {
      const activeCount = await db
        .select({ count: count() })
        .from(activations)
        .where(
          and(
            eq(activations.userId, userId),
            eq(activations.appName, license.appName),
            eq(activations.licenseKey, license.licenseKey),
            eq(activations.status, "active"),
          ),
        );

      return {
        ...license,
        activeActivations: activeCount[0]?.count || 0,
        remainingActivations: Math.max(
          license.maxActivations - (activeCount[0]?.count || 0),
          0,
        ),
      };
    }),
  );

  return licensesWithUsage;
}

export async function setLicenseStatus(
  userId: string,
  licenseId: string,
  status: "active" | "revoked",
) {
  await db
    .update(licenses)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(licenses.id, licenseId), eq(licenses.userId, userId)));
}

export async function getLicenseById(userId: string, licenseId: string) {
  const [license] = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.id, licenseId), eq(licenses.userId, userId)));
  return license ?? null;
}

export async function updateLicenseById(
  userId: string,
  licenseId: string,
  input: { maxActivations?: number; status?: "active" | "revoked" },
) {
  const existing = await getLicenseById(userId, licenseId);
  if (!existing) {
    return { ok: false as const, error: "License not found" };
  }

  const nextMaxActivations = Math.max(1, input.maxActivations || existing.maxActivations);
  const nextStatus = input.status || (existing.status as "active" | "revoked");

  await db
    .update(licenses)
    .set({
      maxActivations: nextMaxActivations,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(and(eq(licenses.id, licenseId), eq(licenses.userId, userId)));

  const updated = await getLicenseById(userId, licenseId);
  if (!updated) {
    return { ok: false as const, error: "Failed to update license" };
  }

  return { ok: true as const, license: updated };
}

export async function deleteLicenseById(userId: string, licenseId: string) {
  const existing = await getLicenseById(userId, licenseId);
  if (!existing) {
    return { ok: false as const, error: "License not found" };
  }

  const relatedActivations = await db
    .select({ id: activations.id })
    .from(activations)
    .where(
      and(
        eq(activations.userId, userId),
        eq(activations.appName, existing.appName),
        eq(activations.licenseKey, existing.licenseKey),
      ),
    );

  if (relatedActivations.length > 0) {
    const activationIds = relatedActivations.map((row) => row.id);
    await db.delete(activationLogs).where(inArray(activationLogs.activationId, activationIds));
  }

  await db
    .delete(activations)
    .where(
      and(
        eq(activations.userId, userId),
        eq(activations.appName, existing.appName),
        eq(activations.licenseKey, existing.licenseKey),
      ),
    );

  await db
    .delete(licenses)
    .where(and(eq(licenses.id, licenseId), eq(licenses.userId, userId)));
  return { ok: true as const };
}

export async function activateLicense(input: {
  appName: string;
  licenseKey: string;
  machineId: string;
  appVersion: string;
  metadata?: unknown;
}) {
  const requestedAppName = normalizeRequestedAppName(input.appName);
  const license = await findPublicLicense(requestedAppName, input.licenseKey);

  const metadata = input.metadata as
    | { shopName?: string; platform?: string; userAgent?: string }
    | undefined;
  const shopName = metadata?.shopName || null;

  if (!license || !license.userId) {
    return { ok: false as const, status: 404, error: "License not found" };
  }
  if (license.status !== "active") {
    return { ok: false as const, status: 403, error: "License is not active" };
  }
  if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, status: 403, error: "License expired" };
  }

  let lockedMachineId: string | undefined;
  if (license.metadata) {
    try {
      const parsed = JSON.parse(license.metadata) as { lockedMachineId?: string };
      lockedMachineId = parsed.lockedMachineId?.trim();
    } catch {
      lockedMachineId = undefined;
    }
  }

  if (lockedMachineId && lockedMachineId !== input.machineId) {
    return {
      ok: false as const,
      status: 403,
      error: "License is locked to another machine",
    };
  }
  const activationType: ActivationType = lockedMachineId
    ? "machine_id_bound"
    : "pre_generated";

  const [existingActivation] = await db
    .select()
    .from(activations)
    .where(
      and(
        eq(activations.userId, license.userId),
        eq(activations.appName, license.appName),
        eq(activations.licenseKey, input.licenseKey),
        eq(activations.machineId, input.machineId),
      ),
    );

  const currentActiveCount = await db
    .select({ count: count() })
    .from(activations)
    .where(
      and(
        eq(activations.userId, license.userId),
        eq(activations.appName, license.appName),
        eq(activations.licenseKey, input.licenseKey),
        eq(activations.status, "active"),
      ),
    );

  const activeCount = currentActiveCount[0]?.count || 0;
  const hasSeat = !!existingActivation || activeCount < license.maxActivations;
  if (!hasSeat) {
    return {
      ok: false as const,
      status: 409,
      error: "Activation limit reached",
    };
  }

  const activationId = existingActivation?.id || crypto.randomUUID();
  if (existingActivation) {
    await db
      .update(activations)
      .set({
        appVersion: input.appVersion,
        shopName,
        status: "active",
        metadata: input.metadata ? JSON.stringify(input.metadata) : existingActivation.metadata,
        activatedAt: new Date(),
        expiresAt: license.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(activations.id, existingActivation.id));
  } else {
    await db.insert(activations).values({
      id: activationId,
      userId: license.userId,
      appName: license.appName,
      appVersion: input.appVersion,
      licenseKey: input.licenseKey,
      machineId: input.machineId,
      shopName,
      status: "active",
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      activatedAt: new Date(),
      expiresAt: license.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db.insert(activationLogs).values({
    id: crypto.randomUUID(),
    userId: license.userId,
    activationId,
    action: existingActivation ? "reactivated" : "activated",
    metadata: JSON.stringify({ appVersion: input.appVersion }),
    createdAt: new Date(),
  });

  const tokenExpiry =
    license.expiresAt ||
    new Date(Date.now() + DEFAULT_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const activationToken = signLicenseActivationToken({
    licenseId: license.id,
    appName: license.appName,
    machineId: input.machineId,
    expiresAt: tokenExpiry,
  });
  const postActivationCount = await db
    .select({ count: count() })
    .from(activations)
    .where(
      and(
        eq(activations.userId, license.userId),
        eq(activations.appName, license.appName),
        eq(activations.licenseKey, input.licenseKey),
        eq(activations.status, "active"),
      ),
    );
  const usedActivations = postActivationCount[0]?.count || 0;

  return {
    ok: true as const,
    data: {
      activationToken,
      tokenExpiresAt: tokenExpiry.toISOString(),
      activation: {
        id: activationId,
        appName: license.appName,
        machineId: input.machineId,
        status: "active",
      },
      license: {
        id: license.id,
        appName: license.appName,
        maxActivations: license.maxActivations,
        expiresAt: license.expiresAt?.toISOString() || null,
      },
      activationType,
      maxActivations: license.maxActivations,
      usedActivations,
      remainingActivations: Math.max(license.maxActivations - usedActivations, 0),
    },
  };
}

export async function validateActivation(input: {
  appName: string;
  machineId: string;
  activationToken: string;
}) {
  const requestedAppName = normalizeRequestedAppName(input.appName);
  const payload = verifyLicenseActivationToken(input.activationToken);
  if (!payload) {
    return {
      valid: false as const,
      reason: "Invalid or expired activation token",
    };
  }

  if (
    payload.appName.toLowerCase() !== requestedAppName.toLowerCase() ||
    payload.machineId !== input.machineId
  ) {
    return {
      valid: false as const,
      reason: "Activation token does not match app or machine",
    };
  }

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, payload.licenseId));
  if (!license || !license.userId || license.status !== "active") {
    return { valid: false as const, reason: "License is not active" };
  }
  let lockedMachineId: string | undefined;
  if (license.metadata) {
    try {
      const parsed = JSON.parse(license.metadata) as { lockedMachineId?: string };
      lockedMachineId = parsed.lockedMachineId?.trim();
    } catch {
      lockedMachineId = undefined;
    }
  }
  const activationType: ActivationType = lockedMachineId
    ? "machine_id_bound"
    : "pre_generated";

  if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
    return { valid: false as const, reason: "License expired" };
  }

  const [activation] = await db
    .select()
    .from(activations)
    .where(
      and(
        eq(activations.userId, license.userId),
        eq(activations.appName, payload.appName),
        eq(activations.licenseKey, license.licenseKey),
        eq(activations.machineId, payload.machineId),
      ),
    );

  if (!activation || activation.status !== "active") {
    return { valid: false as const, reason: "Activation not active" };
  }
  const activeCountRows = await db
    .select({ count: count() })
    .from(activations)
    .where(
      and(
        eq(activations.userId, license.userId),
        eq(activations.appName, payload.appName),
        eq(activations.licenseKey, license.licenseKey),
        eq(activations.status, "active"),
      ),
    );
  const usedActivations = activeCountRows[0]?.count || 0;

  return {
    valid: true as const,
    license: {
      id: license.id,
      appName: license.appName,
      expiresAt: license.expiresAt?.toISOString() || null,
    },
    activation: {
      id: activation.id,
      status: activation.status,
      expiresAt: activation.expiresAt?.toISOString() || null,
    },
    activationType,
    maxActivations: license.maxActivations,
    usedActivations,
    remainingActivations: Math.max(license.maxActivations - usedActivations, 0),
  };
}

export async function deactivateActivation(input: {
  appName: string;
  machineId: string;
  activationToken: string;
}) {
  const requestedAppName = normalizeRequestedAppName(input.appName);
  const payload = verifyLicenseActivationToken(input.activationToken);
  if (!payload)
    return {
      ok: false as const,
      reason: "Invalid or expired activation token",
    };
  if (
    payload.appName.toLowerCase() !== requestedAppName.toLowerCase() ||
    payload.machineId !== input.machineId
  ) {
    return {
      ok: false as const,
      reason: "Activation token does not match app or machine",
    };
  }

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, payload.licenseId));
  if (!license || !license.userId) return { ok: false as const, reason: "License not found" };
  let lockedMachineId: string | undefined;
  if (license.metadata) {
    try {
      const parsed = JSON.parse(license.metadata) as { lockedMachineId?: string };
      lockedMachineId = parsed.lockedMachineId?.trim();
    } catch {
      lockedMachineId = undefined;
    }
  }
  const activationType: ActivationType = lockedMachineId
    ? "machine_id_bound"
    : "pre_generated";

  await db
    .update(activations)
    .set({
      status: "revoked",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(activations.userId, license.userId),
        eq(activations.appName, license.appName),
        eq(activations.licenseKey, license.licenseKey),
        eq(activations.machineId, input.machineId),
      ),
    );
  const activeCountRows = await db
    .select({ count: count() })
    .from(activations)
    .where(
      and(
        eq(activations.userId, license.userId),
        eq(activations.appName, license.appName),
        eq(activations.licenseKey, license.licenseKey),
        eq(activations.status, "active"),
      ),
    );
  const usedActivations = activeCountRows[0]?.count || 0;
  return {
    ok: true as const,
    data: {
      activationType,
      maxActivations: license.maxActivations,
      usedActivations,
      remainingActivations: Math.max(license.maxActivations - usedActivations, 0),
    },
  };
}
