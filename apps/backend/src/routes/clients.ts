import { Elysia, t } from "elysia";
import { getAuthenticatedUserId } from "../lib/request-auth";
import { createClient, deleteClient, listClients, updateClient } from "../services/clients";

export const clientRoutes = new Elysia({
  name: "client-routes",
  prefix: "/api/clients",
})
  .get("/", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const rows = await listClients(userId);
    return { clients: rows };
  })
  .post(
    "/",
    async ({ request, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await createClient(userId, body as {
        name: string;
        email?: string;
        phone?: string;
        notes?: string;
        status?: "active" | "inactive";
      });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, client: result.client };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 140 }),
        email: t.Optional(t.String({ maxLength: 254 })),
        phone: t.Optional(t.String({ maxLength: 60 })),
        notes: t.Optional(t.String({ maxLength: 2000 })),
        status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
      }),
    },
  )
  .patch(
    "/:id",
    async ({ request, params, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await updateClient(userId, params.id, body as {
        name?: string;
        email?: string;
        phone?: string;
        notes?: string;
        status?: "active" | "inactive";
      });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, client: result.client };
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 140 })),
        email: t.Optional(t.String({ maxLength: 254 })),
        phone: t.Optional(t.String({ maxLength: 60 })),
        notes: t.Optional(t.String({ maxLength: 2000 })),
        status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
      }),
    },
  )
  .delete("/:id", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await deleteClient(userId, params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }
    return { success: true };
  });
