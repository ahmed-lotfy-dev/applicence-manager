import { Elysia, t } from "elysia";
import { createApp, deleteAppById, getAppById, listApps, updateAppById } from "../services/apps";
import { getAuthenticatedUserId } from "../lib/request-auth";

export const appCatalogRoutes = new Elysia({
  name: "app-catalog-routes",
  prefix: "/api/apps",
})
  .get("/", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const apps = await listApps(userId);
    return { apps };
  })
  .get("/:id", async ({ params, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const app = await getAppById(params.id, userId);
    if (!app) {
      set.status = 404;
      return { success: false, error: "App not found" };
    }

    return { success: true, app };
  })
  .post(
    "/",
    async ({ body, request, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const { name } = body as { name: string };
      const result = await createApp(name, userId);
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }

      return { success: true, app: result.app };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 120 }),
      }),
    },
  )
  .patch(
    "/:id",
    async ({ params, body, request, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const payload = body as { name?: string; status?: "active" | "inactive" };
      const result = await updateAppById(params.id, userId, payload);
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }

      return { success: true, app: result.app };
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
        status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
      }),
    },
  )
  .delete("/:id", async ({ params, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    const result = await deleteAppById(params.id, userId);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }

    return { success: true };
  });
