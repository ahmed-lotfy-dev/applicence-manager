import { Elysia } from "elysia";
import { count, desc, eq } from "drizzle-orm";
import { db } from "../db/db";
import { activationLogs, activations } from "../db/auth-schema";

export const activationRoutes = new Elysia({
  name: "activation-routes",
  prefix: "/api/activations",
})
  .get("/stats", async () => {
    const total = await db.select({ count: count() }).from(activations);
    const active = await db
      .select({ count: count() })
      .from(activations)
      .where(eq(activations.status, "active"));
    const pending = await db
      .select({ count: count() })
      .from(activations)
      .where(eq(activations.status, "pending"));
    const revoked = await db
      .select({ count: count() })
      .from(activations)
      .where(eq(activations.status, "revoked"));

    return {
      stats: {
        total: total[0]?.count || 0,
        active: active[0]?.count || 0,
        pending: pending[0]?.count || 0,
        revoked: revoked[0]?.count || 0,
      },
    };
  })
  .get("/", async () => {
    const allActivations = await db
      .select()
      .from(activations)
      .orderBy(desc(activations.createdAt));
    return { activations: allActivations };
  })
  .get("/:id", async ({ params: { id } }) => {
    const [activation] = await db.select().from(activations).where(eq(activations.id, id));
    if (!activation) {
      return { error: "Activation not found" };
    }

    const logs = await db
      .select()
      .from(activationLogs)
      .where(eq(activationLogs.activationId, id))
      .orderBy(desc(activationLogs.createdAt));

    return { activation, logs };
  })
  .post("/", async ({ body }) => {
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
  .patch("/:id/approve", async ({ params: { id } }) => {
    await db
      .update(activations)
      .set({
        status: "active",
        activatedAt: new Date(),
      })
      .where(eq(activations.id, id));

    await db.insert(activationLogs).values({
      id: crypto.randomUUID(),
      activationId: id,
      action: "approved",
    });

    return { success: true, message: "Activation approved" };
  })
  .patch("/:id/revoke", async ({ params: { id } }) => {
    await db.update(activations).set({ status: "revoked" }).where(eq(activations.id, id));

    await db.insert(activationLogs).values({
      id: crypto.randomUUID(),
      activationId: id,
      action: "revoked",
    });

    return { success: true, message: "Activation revoked" };
  });
