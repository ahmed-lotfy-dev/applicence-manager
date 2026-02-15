import { Elysia, t } from "elysia";
import { createApp, deleteAppById, getAppById, listApps, updateAppById } from "../services/apps";

export const appCatalogRoutes = new Elysia({
  name: "app-catalog-routes",
  prefix: "/api/apps",
})
  .get("/", async () => {
    const apps = await listApps();
    return { apps };
  })
  .get("/:id", async ({ params, set }) => {
    const app = await getAppById(params.id);
    if (!app) {
      set.status = 404;
      return { success: false, error: "App not found" };
    }

    return { success: true, app };
  })
  .post(
    "/",
    async ({ body, set }) => {
      const { name } = body as { name: string };
      const result = await createApp(name);
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
    async ({ params, body, set }) => {
      const payload = body as { name?: string; status?: "active" | "inactive" };
      const result = await updateAppById(params.id, payload);
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
  .delete("/:id", async ({ params, set }) => {
    const result = await deleteAppById(params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }

    return { success: true };
  });
