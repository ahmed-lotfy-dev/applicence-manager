import { db } from "../db/db";
import { activationRequests } from "../db/auth-schema";

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
