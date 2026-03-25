import { Elysia, t } from "elysia";
import {
  activateLicense,
  deactivateActivation,
  validateActivation,
} from "../services/licensing";
import { resolveAppOwnerByIdentifier } from "../services/apps";
import { createActivationRequest as submitRequest } from "../services/activation-requests";

async function handleActivationRequest(
  body: {
    appName: string;
    appVersion: string;
    machineId: string;
    shopName: string;
    phone: string;
    notes?: string;
    platform?: string;
    userAgent?: string;
  },
  set: { status?: number | string },
) {
  const ownerApp = await resolveAppOwnerByIdentifier(body.appName);
  if (!ownerApp?.userId) {
    set.status = 404;
    return { success: false, error: "App not found" };
  }

  const result = await submitRequest({
    ...body,
    userId: ownerApp.userId,
    appName: ownerApp.name,
  });

  if (!result.ok) {
    set.status = 500;
    return { success: false, error: result.error };
  }

  return {
    success: true,
    id: result.id,
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
      notes?: string;
      platform?: string;
      userAgent?: string;
    }, set),
    {
      body: t.Object({
        appName: t.String({ minLength: 2, maxLength: 120 }),
        appVersion: t.String({ minLength: 1, maxLength: 64 }),
        machineId: t.String({ minLength: 6, maxLength: 256 }),
        shopName: t.String({ minLength: 2, maxLength: 160 }),
        phone: t.String({ minLength: 6, maxLength: 60 }),
        notes: t.Optional(t.String({ maxLength: 2000 })),
        platform: t.Optional(t.String({ maxLength: 120 })),
        userAgent: t.Optional(t.String({ maxLength: 500 })),
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
      notes?: string;
      platform?: string;
      userAgent?: string;
    }, set),
    {
      body: t.Object({
        appName: t.String({ minLength: 2, maxLength: 120 }),
        appVersion: t.String({ minLength: 1, maxLength: 64 }),
        machineId: t.String({ minLength: 6, maxLength: 256 }),
        shopName: t.String({ minLength: 2, maxLength: 256 }),
        phone: t.String({ minLength: 5, maxLength: 32 }),
        notes: t.Optional(t.String({ maxLength: 1000 })),
        platform: t.Optional(t.String()),
        userAgent: t.Optional(t.String()),
      }),
    },
  );
