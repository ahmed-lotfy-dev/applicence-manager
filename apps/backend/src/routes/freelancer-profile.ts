import { Elysia, t } from "elysia";
import { z } from "zod";
import { getAuthenticatedUserId } from "../lib/request-auth";
import { createFreelancerLogoService } from "../services/freelancer-logo";
import {
  getFreelancerProfile,
  upsertFreelancerProfile,
} from "../services/freelancer-profile";

let logoService: ReturnType<typeof createFreelancerLogoService> | null = null;
const profileInputSchema = z.object({
  businessName: z.string().trim().max(180).optional(),
  contactEmail: z.string().trim().email().max(254).optional(),
  contactPhone: z.string().trim().max(60).optional(),
  addressLine1: z.string().trim().max(220).optional(),
  addressLine2: z.string().trim().max(220).optional(),
  taxId: z.string().trim().max(120).optional(),
  defaultCurrency: z.enum(["USD", "EUR", "EGP", "SAR", "AED", "GBP"]).optional(),
  defaultInvoiceLanguage: z.enum(["en", "ar"]).optional(),
  appLanguage: z.enum(["en", "ar"]).optional(),
});

export const freelancerProfileRoutes = new Elysia({
  name: "freelancer-profile-routes",
  prefix: "/api/freelancer-profile",
})
  .get("/", async ({ request, set }) => {
    try {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const profile = await getFreelancerProfile(userId);
      return { profile };
    } catch (error) {
      set.status = 500;
      return {
        error:
          error instanceof Error ? error.message : "Failed to fetch freelancer profile",
      };
    }
  })
  .put(
    "/",
    async ({ request, body, set }) => {
      try {
        const validated = profileInputSchema.safeParse(body);
        if (!validated.success) {
          set.status = 400;
          return {
            success: false,
            error: validated.error.issues[0]?.message || "Invalid profile data",
          };
        }
        const userId = await getAuthenticatedUserId(request);
        if (!userId) {
          set.status = 401;
          return { success: false, error: "Unauthorized" };
        }
        const profile = await upsertFreelancerProfile(userId, validated.data);
        return { success: true, profile };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to update freelancer profile",
        };
      }
    },
    {
      body: t.Object({
        businessName: t.Optional(t.String({ maxLength: 180 })),
        contactEmail: t.Optional(t.String({ maxLength: 254 })),
        contactPhone: t.Optional(t.String({ maxLength: 60 })),
        addressLine1: t.Optional(t.String({ maxLength: 220 })),
        addressLine2: t.Optional(t.String({ maxLength: 220 })),
        taxId: t.Optional(t.String({ maxLength: 120 })),
        defaultCurrency: t.Optional(
          t.Union([
            t.Literal("USD"),
            t.Literal("EUR"),
            t.Literal("EGP"),
            t.Literal("SAR"),
            t.Literal("AED"),
            t.Literal("GBP"),
          ]),
        ),
        defaultInvoiceLanguage: t.Optional(t.Union([t.Literal("en"), t.Literal("ar")])),
        appLanguage: t.Optional(t.Union([t.Literal("en"), t.Literal("ar")])),
      }),
    },
  )
  .post("/logo", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      set.status = 400;
      return { success: false, error: "Missing file" };
    }

    try {
      if (!logoService) logoService = createFreelancerLogoService();
      const result = await logoService.uploadAndSet(userId, file);
      return {
        success: true,
        logoUrl: result.logoUrl,
        profile: result.profile,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "LOGO_UPLOAD_FAILED";
      if (message === "LOGO_MUST_BE_IMAGE") {
        set.status = 400;
        return { success: false, error: "Logo must be an image file" };
      }
      if (message === "LOGO_TOO_LARGE") {
        set.status = 400;
        return { success: false, error: "Logo file is too large (max 8MB)" };
      }
      if (message.includes("R2 config missing")) {
        set.status = 500;
        return { success: false, error: "Storage is not configured" };
      }

      set.status = 500;
      return {
        success: false,
        error: message || "Failed to upload logo",
      };
    }
  });
