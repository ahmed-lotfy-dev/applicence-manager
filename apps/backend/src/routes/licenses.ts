import { Elysia, t } from "elysia";
import {
  deleteLicenseById,
  getLicenseById,
  issueLicense,
  listLicenses,
  setLicenseStatus,
  updateLicenseById,
} from "../services/licensing";

export const licenseAdminRoutes = new Elysia({
  name: "license-admin-routes",
  prefix: "/api/licenses",
})
  .get(
    "/",
    async ({ query }) => {
      const appName = typeof query.appName === "string" ? query.appName : undefined;
      const data = await listLicenses(appName);
      return { licenses: data };
    },
    {
      query: t.Object({
        appName: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
      }),
    },
  )
  .post(
    "/",
    async ({ body, set }) => {
      const { appName, maxActivations, metadata } = body as {
        appName?: string;
        maxActivations?: number;
        metadata?: unknown;
      };

      let license;
      try {
        license = await issueLicense({
          appName,
          maxActivations,
          metadata,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "APP_NOT_FOUND") {
          set.status = 400;
          return { success: false, error: "App does not exist. Add app first." };
        }
        throw error;
      }

      return { success: true, license };
    },
    {
      body: t.Object({
        appName: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
        maxActivations: t.Optional(t.Number({ minimum: 1, maximum: 10000 })),
        metadata: t.Optional(t.Any()),
      }),
    },
  )
  .get("/:id", async ({ params, set }) => {
    const license = await getLicenseById(params.id);
    if (!license) {
      set.status = 404;
      return { success: false, error: "License not found" };
    }

    return { success: true, license };
  })
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const payload = body as { maxActivations?: number; status?: "active" | "revoked" };
      const result = await updateLicenseById(params.id, payload);
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }

      return { success: true, license: result.license };
    },
    {
      body: t.Object({
        maxActivations: t.Optional(t.Number({ minimum: 1, maximum: 10000 })),
        status: t.Optional(t.Union([t.Literal("active"), t.Literal("revoked")])),
      }),
    },
  )
  .patch("/:id/revoke", async ({ params: { id } }) => {
    await setLicenseStatus(id, "revoked");
    return { success: true };
  })
  .patch("/:id/activate", async ({ params: { id } }) => {
    await setLicenseStatus(id, "active");
    return { success: true };
  })
  .delete("/:id", async ({ params, set }) => {
    const result = await deleteLicenseById(params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }

    return { success: true };
  });
