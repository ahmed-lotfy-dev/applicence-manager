import { db } from "../db/db";
import { activationRequests } from "../db/auth-schema";
import { and, eq } from "drizzle-orm";
import { activateLicense, deactivateActivation, issueLicense } from "./licensing";

export interface CreateActivationRequestInput {
  userId: string;
  appName: string;
  appVersion: string;
  machineId: string;
  shopName: string;
  phone: string;
  notes?: string;
  platform?: string;
  userAgent?: string;
}

export async function createActivationRequest(input: CreateActivationRequestInput) {
  const id = crypto.randomUUID();
  const now = new Date();

  try {
    await db.insert(activationRequests).values({
      id,
      userId: String(input.userId).trim(),
      appName: input.appName.trim(),
      appVersion: input.appVersion.trim(),
      machineId: input.machineId.trim(),
      shopName: input.shopName.trim(),
      phone: input.phone.trim(),
      notes: input.notes?.trim() || null,
      platform: input.platform?.trim() || null,
      userAgent: input.userAgent?.trim() || null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create activation request",
    };
  }

  return { ok: true as const, id };
}

export async function getActivationRequestStatus(input: {
  id: string;
  appName: string;
  machineId: string;
}) {
  const [request] = await db
    .select()
    .from(activationRequests)
    .where(eq(activationRequests.id, input.id));

  if (!request) {
    return { ok: false as const, status: 404 as const, error: "Activation request not found" };
  }

  if (
    request.appName.trim().toLowerCase() !== input.appName.trim().toLowerCase() ||
    request.machineId.trim() !== input.machineId.trim()
  ) {
    return { ok: false as const, status: 404 as const, error: "Activation request not found" };
  }

  const normalizedStatus =
    request.status === "approved"
      ? "approved"
      : request.status === "dismissed"
        ? "dismissed"
        : "pending";

  return {
    ok: true as const,
    data: {
      id: request.id,
      status: normalizedStatus,
      activationToken: request.activationToken || null,
      tokenExpiresAt: request.tokenExpiresAt?.toISOString() || null,
      licenseKey: request.resolvedLicenseKey || null,
    },
  };
}

export async function approveActivationRequest(input: {
  id: string;
  userId: string;
}) {
  const [request] = await db
    .select()
    .from(activationRequests)
    .where(
      and(
        eq(activationRequests.id, input.id),
        eq(activationRequests.userId, input.userId),
      ),
    );

  if (!request) {
    return { ok: false as const, status: 404 as const, error: "Activation request not found" };
  }

  if (
    request.status === "approved" &&
    request.activationToken &&
    request.activationId &&
    request.resolvedLicenseKey
  ) {
    return {
      ok: true as const,
      data: {
        activationId: request.activationId,
        activationToken: request.activationToken,
        tokenExpiresAt: request.tokenExpiresAt?.toISOString() || null,
        licenseKey: request.resolvedLicenseKey,
      },
    };
  }

  const licenseKey =
    request.resolvedLicenseKey?.trim() ||
    (
      await issueLicense(input.userId, {
        appName: request.appName,
        maxActivations: 1,
        lockedMachineId: request.machineId,
        metadata: {
          source: "approved_activation_request",
          requestId: request.id,
          shopName: request.shopName,
          phone: request.phone,
        },
      })
    ).licenseKey;

  const activationResult = await activateLicense({
    appName: request.appName,
    licenseKey,
    machineId: request.machineId,
    appVersion: request.appVersion,
    metadata: {
      shopName: request.shopName,
      phone: request.phone,
      notes: request.notes,
      platform: request.platform,
      userAgent: request.userAgent,
      source: "approved_activation_request",
      requestId: request.id,
    },
  });

  if (!activationResult.ok) {
    return {
      ok: false as const,
      status: activationResult.status,
      error: activationResult.error,
    };
  }

  await db
    .update(activationRequests)
    .set({
      status: "approved",
      resolvedLicenseKey: licenseKey,
      activationId: activationResult.data.activation.id,
      activationToken: activationResult.data.activationToken,
      tokenExpiresAt: new Date(activationResult.data.tokenExpiresAt),
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(activationRequests.id, input.id),
        eq(activationRequests.userId, input.userId),
      ),
    );

  return {
    ok: true as const,
    data: {
      activationId: activationResult.data.activation.id,
      activationToken: activationResult.data.activationToken,
      tokenExpiresAt: activationResult.data.tokenExpiresAt,
      licenseKey,
    },
  };
}

export async function revokeActivationRequest(input: {
  id: string;
  userId: string;
}) {
  const [request] = await db
    .select()
    .from(activationRequests)
    .where(
      and(
        eq(activationRequests.id, input.id),
        eq(activationRequests.userId, input.userId),
      ),
    );

  if (!request) {
    return { ok: false as const, status: 404 as const, error: "Activation request not found" };
  }

  if (request.activationToken) {
    const revokeResult = await deactivateActivation({
      appName: request.appName,
      machineId: request.machineId,
      activationToken: request.activationToken,
    });

    if (!revokeResult.ok) {
      return { ok: false as const, status: 409 as const, error: revokeResult.reason };
    }
  }

  await db
    .update(activationRequests)
    .set({
      status: "dismissed",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(activationRequests.id, input.id),
        eq(activationRequests.userId, input.userId),
      ),
    );

  return { ok: true as const };
}
