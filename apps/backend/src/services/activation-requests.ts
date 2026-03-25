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
  
  await db.insert(activationRequests).values({
    id,
    userId: input.userId,
    appName: input.appName,
    appVersion: input.appVersion,
    machineId: input.machineId,
    shopName: input.shopName,
    phone: input.phone,
    notes: input.notes || null,
    platform: input.platform || null,
    userAgent: input.userAgent || null,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { ok: true as const, id };
}
