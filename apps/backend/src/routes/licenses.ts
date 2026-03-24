import { Elysia, t } from "elysia";
import {
  deleteLicenseById,
  getLicenseById,
  issueLicense,
  listLicenses,
  setLicenseStatus,
  updateLicenseById,
} from "../services/licensing";
import { getAuthenticatedUserId } from "../lib/request-auth";

export const licenseAdminRoutes = new Elysia({
  name: "license-admin-routes",
  prefix: "/api/licenses",
})
  .get(
    "/",
    async ({ query, request, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const appName = typeof query.appName === "string" ? query.appName : undefined;
      const data = await listLicenses(userId, appName);
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
    async ({ body, request, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const { appName, maxActivations, lockedMachineId, metadata } = body as {
        appName: string;
        maxActivations?: number;
        lockedMachineId?: string;
        metadata?: unknown;
      };

      let license;
      try {
        license = await issueLicense(userId, {
          appName,
          maxActivations,
          lockedMachineId,
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
        appName: t.String({ minLength: 2, maxLength: 120 }),
        maxActivations: t.Optional(t.Number({ minimum: 1, maximum: 10000 })),
        lockedMachineId: t.Optional(t.String({ minLength: 6, maxLength: 256 })),
        metadata: t.Optional(t.Any()),
      }),
    },
  )
  .get("/:id", async ({ params, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const license = await getLicenseById(userId, params.id);
    if (!license) {
      set.status = 404;
      return { success: false, error: "License not found" };
    }

    return { success: true, license };
  })
  .patch(
    "/:id",
    async ({ params, body, request, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const payload = body as { maxActivations?: number; status?: "active" | "revoked" };
      const result = await updateLicenseById(userId, params.id, payload);
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
  .patch("/:id/revoke", async ({ params: { id }, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    await setLicenseStatus(userId, id, "revoked");
    return { success: true };
  })
  .patch("/:id/activate", async ({ params: { id }, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    await setLicenseStatus(userId, id, "active");
    return { success: true };
  })
  .delete("/:id", async ({ params, request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await deleteLicenseById(userId, params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }

    return { success: true };
  });
