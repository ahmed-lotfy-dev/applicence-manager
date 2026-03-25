import { Elysia } from "elysia";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/db";
import { activationLogs, activationRequests, activations } from "../db/auth-schema";
import { getAuthenticatedUserId } from "../lib/request-auth";

function mapActivationRequest(request: typeof activationRequests.$inferSelect) {
  return {
    id: request.id,
    requestType: "request_only" as const,
    appName: request.appName,
    appVersion: request.appVersion,
    licenseKey: "",
    machineId: request.machineId,
    shopName: request.shopName,
    phone: request.phone,
    notes: request.notes,
    status: request.status === "revoked" ? "revoked" : "pending",
    metadata: JSON.stringify({
      source: "request_only",
      reason: request.notes?.trim() || "Activation request received without a license key.",
      platform: request.platform,
    }),
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    activatedAt: null,
  };
}

function mapActivationRecord(activation: typeof activations.$inferSelect) {
  return {
    ...activation,
    requestType: "license_activation" as const,
    phone: null,
    notes: null,
  };
}

export const activationRoutes = new Elysia({
  name: "activation-routes",
  prefix: "/api/activations",
})
  .get("/stats", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const total = await db
      .select({ count: count() })
      .from(activations)
      .where(eq(activations.userId, userId));
    const requestTotal = await db
      .select({ count: count() })
      .from(activationRequests)
      .where(eq(activationRequests.userId, userId));
    const active = await db
      .select({ count: count() })
      .from(activations)
      .where(and(eq(activations.userId, userId), eq(activations.status, "active")));
    const pending = await db
      .select({ count: count() })
      .from(activations)
      .where(and(eq(activations.userId, userId), eq(activations.status, "pending")));
    const revoked = await db
      .select({ count: count() })
      .from(activations)
      .where(and(eq(activations.userId, userId), eq(activations.status, "revoked")));
    const pendingRequests = await db
      .select({ count: count() })
      .from(activationRequests)
      .where(and(eq(activationRequests.userId, userId), eq(activationRequests.status, "pending")));
    const dismissedRequests = await db
      .select({ count: count() })
      .from(activationRequests)
      .where(and(eq(activationRequests.userId, userId), eq(activationRequests.status, "dismissed")));

    return {
      stats: {
        total: (total[0]?.count || 0) + (requestTotal[0]?.count || 0),
        active: active[0]?.count || 0,
        pending: (pending[0]?.count || 0) + (pendingRequests[0]?.count || 0),
        revoked: (revoked[0]?.count || 0) + (dismissedRequests[0]?.count || 0),
      },
    };
  })
  .get("/", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const allActivations = await db
      .select()
      .from(activations)
      .where(eq(activations.userId, userId))
      .orderBy(desc(activations.createdAt));
    const allRequests = await db
      .select()
      .from(activationRequests)
      .where(eq(activationRequests.userId, userId))
      .orderBy(desc(activationRequests.createdAt));

    const items = [...allActivations.map(mapActivationRecord), ...allRequests.map(mapActivationRequest)]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { activations: items };
  })
  .get("/:id", async ({ params: { id }, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const [activation] = await db
      .select()
      .from(activations)
      .where(eq(activations.id, id));
    if (!activation) {
      return { error: "Activation not found" };
    }
    if (activation.userId !== userId) {
      set.status = 404;
      return { error: "Activation not found" };
    }

    const logs = await db
      .select()
      .from(activationLogs)
      .where(and(eq(activationLogs.userId, userId), eq(activationLogs.activationId, id)))
      .orderBy(desc(activationLogs.createdAt));

    return { activation, logs };
  })
  .post("/", async ({ body, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const { appName, appVersion, licenseKey, machineId, metadata } = body as {
      appName: string;
      appVersion: string;
      licenseKey: string;
      machineId: string;
      metadata?: unknown;
    };

    const id = crypto.randomUUID();
    await db.insert(activations).values({
      id,
      userId,
      appName,
      appVersion,
      licenseKey,
      machineId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: "pending",
    });

    return {
      success: true,
      activation: { id, appName, appVersion, licenseKey, machineId, status: "pending" },
    };
  })
  .patch("/:id/approve", async ({ params: { id }, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    await db
      .update(activations)
      .set({
        status: "active",
        activatedAt: new Date(),
      })
      .where(and(eq(activations.id, id), eq(activations.userId, userId)));

    await db.insert(activationLogs).values({
      id: crypto.randomUUID(),
      userId,
      activationId: id,
      action: "approved",
    });

    return { success: true, message: "Activation approved" };
  })
  .patch("/:id/revoke", async ({ params: { id }, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const [activationRequest] = await db
      .select()
      .from(activationRequests)
      .where(and(eq(activationRequests.id, id), eq(activationRequests.userId, userId)));

    if (activationRequest) {
      await db
        .update(activationRequests)
        .set({ status: "dismissed", updatedAt: new Date() })
        .where(and(eq(activationRequests.id, id), eq(activationRequests.userId, userId)));
      return { success: true, message: "Activation request dismissed" };
    }

    await db
      .update(activations)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(and(eq(activations.id, id), eq(activations.userId, userId)));

    await db.insert(activationLogs).values({
      id: crypto.randomUUID(),
      userId,
      activationId: id,
      action: "revoked",
    });

    return { success: true, message: "Activation revoked" };
  });
