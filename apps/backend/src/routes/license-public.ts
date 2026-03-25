import { Elysia, t } from "elysia";
import { activationRequests, activations, managedApps } from "../db/auth-schema";
import { db } from "../db/db";
import {
  activateLicense,
  deactivateActivation,
  validateActivation,
} from "../services/licensing";
import { resolveAppOwnerByIdentifier } from "../services/apps";
import {
  createActivationRequest as submitRequest,
  getActivationRequestStatus,
} from "../services/activation-requests";

async function handleActivationRequest(
  body: {
    appName: string;
    appVersion: string;
    machineId: string;
    shopName: string;
    phone: string;
    notes?: string | null;
    platform?: string | null;
    userAgent?: string | null;
  },
  set: { status?: number | string },
) {
  const ownerApp = await resolveAppOwnerByIdentifier(body.appName);
  if (!ownerApp?.userId) {
    set.status = 404;
    return { 
      success: false, 
      error: "App not found or incomplete backend setup",
    };
  }

  const result = await submitRequest({
    userId: ownerApp.userId,
    appName: ownerApp.name,
    appVersion: body.appVersion,
    machineId: body.machineId,
    shopName: body.shopName,
    phone: body.phone,
    notes: body.notes ?? undefined,
    platform: body.platform ?? undefined,
    userAgent: body.userAgent ?? undefined,
  });

  if (!result.ok) {
    set.status = 500;
    return { success: false, error: result.error };
  }

  return {
    success: true,
    id: result.id,
    status: "pending",
    poll: {
      path: `/api/v1/license/request-status`,
      requestId: result.id,
    },
    message: "Activation request sent successfully.",
  };
}

export const licensePublicRoutes = new Elysia({
  name: "license-public-routes",
  prefix: "/api/v1/license",
})
  .post(
    "/request-activation",
    async ({ body, set }) => handleActivationRequest(body as {
      appName: string;
      appVersion: string;
      machineId: string;
      shopName: string;
      phone: string;
      notes?: string | null;
      platform?: string | null;
      userAgent?: string | null;
    }, set),
    {
      body: t.Object({
        appName: t.String({ minLength: 2, maxLength: 120 }),
        appVersion: t.String({ minLength: 1, maxLength: 64 }),
        machineId: t.String({ minLength: 6, maxLength: 256 }),
        shopName: t.String({ minLength: 2, maxLength: 160 }),
        phone: t.String({ minLength: 6, maxLength: 60 }),
        notes: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        platform: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
        userAgent: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
      }),
    },
  )
  .post(
    "/request-status",
    async ({ body, set }) => {
      const result = await getActivationRequestStatus({
        id: body.requestId,
        appName: body.appName,
        machineId: body.machineId,
      });

      if (!result.ok) {
        set.status = result.status;
        return { success: false, error: result.error };
      }

      return { success: true, ...result.data };
    },
    {
      body: t.Object({
        requestId: t.String({ minLength: 8, maxLength: 128 }),
        appName: t.String({ minLength: 2, maxLength: 120 }),
        machineId: t.String({ minLength: 6, maxLength: 256 }),
      }),
    },
  )
  .post(
    "/activate",
    async ({ body, set }) => {
      const result = await activateLicense(
        body as {
          appName: string;
          licenseKey: string;
          machineId: string;
          appVersion: string;
          metadata?: unknown;
        },
      );

      if (!result.ok) {
        set.status = result.status;
        return { success: false, error: result.error };
      }

      return {
        success: true,
        appName: result.data.activation.appName,
        ...result.data,
      };
    },
    {
      body: t.Object({
        appName: t.String({ minLength: 2, maxLength: 120 }),
        licenseKey: t.String({ minLength: 10, maxLength: 128 }),
        machineId: t.String({ minLength: 6, maxLength: 256 }),
        appVersion: t.String({ minLength: 1, maxLength: 64 }),
        metadata: t.Optional(t.Any()),
      }),
    },
  )
  .post(
    "/validate",
    async ({ body }) => {
      const result = await validateActivation(
        body as {
          appName: string;
          machineId: string;
          activationToken: string;
        },
      );
      if (!result.valid) {
        return {
          success: false,
          isValid: false,
          error: result.reason || "Validation failed",
        };
      }
      return {
        success: true,
        isValid: true,
        ...result,
      };
    },
    {
      body: t.Object({
        appName: t.String({ minLength: 2, maxLength: 120 }),
        machineId: t.String({ minLength: 6, maxLength: 256 }),
        activationToken: t.String({ minLength: 20 }),
      }),
    },
  )
  .post(
    "/deactivate",
    async ({ body, set }) => {
      const result = await deactivateActivation(
        body as {
          appName: string;
          machineId: string;
          activationToken: string;
        },
      );

      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.reason };
      }

      return { success: true, ...(result.data || {}) };
    },
    {
      body: t.Object({
        appName: t.String({ minLength: 2, maxLength: 120 }),
        machineId: t.String({ minLength: 6, maxLength: 256 }),
        activationToken: t.String({ minLength: 20 }),
      }),
    },
  )
  .post(
    "/request",
    async ({ body, set }) => handleActivationRequest(body as {
      appName: string;
      appVersion: string;
      machineId: string;
      shopName: string;
      phone: string;
      notes?: string | null;
      platform?: string | null;
      userAgent?: string | null;
    }, set),
    {
      body: t.Object({
        appName: t.String(),
        appVersion: t.String(),
        machineId: t.String(),
        shopName: t.String(),
        phone: t.String(),
        notes: t.Optional(t.Any()),
        platform: t.Optional(t.Any()),
        userAgent: t.Optional(t.Any()),
      }),
    },
  );
