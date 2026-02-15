import { Elysia, t } from "elysia";
import {
  activateLicense,
  deactivateActivation,
  validateActivation,
} from "../services/licensing";

export const licensePublicRoutes = new Elysia({
  name: "license-public-routes",
  prefix: "/api/v1/license",
})
  .post(
    "/activate",
    async ({ body, set }) => {
      const result = await activateLicense(
        body as {
          appName?: string;
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
        appName: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
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
          appName?: string;
          machineId: string;
          activationToken: string;
        },
      );
      return result;
    },
    {
      body: t.Object({
        appName: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
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
          appName?: string;
          machineId: string;
          activationToken: string;
        },
      );

      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.reason };
      }

      return { success: true };
    },
    {
      body: t.Object({
        appName: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
        machineId: t.String({ minLength: 6, maxLength: 256 }),
        activationToken: t.String({ minLength: 20 }),
      }),
    },
  );
