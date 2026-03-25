import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/db";
import { freelancerProfiles } from "../db/auth-schema";

export async function getFreelancerProfile(userId: string) {
  try {
    const [row] = await db
      .select({
        id: freelancerProfiles.id,
        userId: freelancerProfiles.userId,
        businessName: freelancerProfiles.businessName,
        logoUrl: freelancerProfiles.logoUrl,
        logoObjectKey: freelancerProfiles.logoObjectKey,
        contactEmail: freelancerProfiles.contactEmail,
        contactPhone: freelancerProfiles.contactPhone,
        addressLine1: freelancerProfiles.addressLine1,
        addressLine2: freelancerProfiles.addressLine2,
        taxId: freelancerProfiles.taxId,
        defaultCurrency: freelancerProfiles.defaultCurrency,
        defaultInvoiceLanguage: freelancerProfiles.defaultInvoiceLanguage,
        appLanguage: freelancerProfiles.appLanguage,
        createdAt: freelancerProfiles.createdAt,
        updatedAt: freelancerProfiles.updatedAt,
      })
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId));
    return row ?? null;
  } catch {
    const [row] = await db
      .select({
        id: freelancerProfiles.id,
        userId: freelancerProfiles.userId,
        businessName: freelancerProfiles.businessName,
        logoUrl: freelancerProfiles.logoUrl,
        contactEmail: freelancerProfiles.contactEmail,
        contactPhone: freelancerProfiles.contactPhone,
        addressLine1: freelancerProfiles.addressLine1,
        addressLine2: freelancerProfiles.addressLine2,
        taxId: freelancerProfiles.taxId,
        defaultCurrency: sql<string | null>`null`,
        defaultInvoiceLanguage: sql<string | null>`null`,
        appLanguage: sql<string | null>`null`,
        createdAt: freelancerProfiles.createdAt,
        updatedAt: freelancerProfiles.updatedAt,
      })
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId));
    if (!row) return null;
    return { ...row, logoObjectKey: null };
  }
}

export async function upsertFreelancerProfile(
  userId: string,
  input: {
    businessName?: string;
    contactEmail?: string;
    contactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    taxId?: string;
    defaultCurrency?: string;
    defaultInvoiceLanguage?: "en" | "ar";
    appLanguage?: "en" | "ar";
  },
) {
  const existing = await getFreelancerProfile(userId);
  const normalize = (value: string | undefined) => {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };
  const businessName = normalize(input.businessName);
  const contactEmail = normalize(input.contactEmail);
  const contactPhone = normalize(input.contactPhone);
  const addressLine1 = normalize(input.addressLine1);
  const addressLine2 = normalize(input.addressLine2);
  const taxId = normalize(input.taxId);
  const defaultCurrency = normalize(input.defaultCurrency)?.toUpperCase() || null;
  const defaultInvoiceLanguage = input.defaultInvoiceLanguage === "ar" ? "ar" : input.defaultInvoiceLanguage === "en" ? "en" : null;
  const appLanguage = input.appLanguage === "ar" ? "ar" : input.appLanguage === "en" ? "en" : null;
  const now = new Date();

  if (!existing) {
    const id = crypto.randomUUID();
    await db.execute(
      sql`
        insert into "freelancer_profiles"
          ("id", "user_id", "business_name", "contact_email", "contact_phone", "address_line_1", "address_line_2", "tax_id", "default_currency", "default_invoice_language", "app_language", "created_at", "updated_at")
        values
          (${id}, ${userId}, ${businessName ?? null}, ${contactEmail ?? null}, ${contactPhone ?? null}, ${addressLine1 ?? null}, ${addressLine2 ?? null}, ${taxId ?? null}, ${defaultCurrency}, ${defaultInvoiceLanguage}, ${appLanguage}, ${now}, ${now})
      `,
    );
  } else {
    const payload: {
      updatedAt: Date;
      businessName?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      taxId?: string | null;
      defaultCurrency?: string | null;
      defaultInvoiceLanguage?: string | null;
      appLanguage?: string | null;
    } = {
      updatedAt: now,
    };

    if (input.businessName !== undefined) payload.businessName = businessName ?? null;
    if (input.contactEmail !== undefined) payload.contactEmail = contactEmail ?? null;
    if (input.contactPhone !== undefined) payload.contactPhone = contactPhone ?? null;
    if (input.addressLine1 !== undefined) payload.addressLine1 = addressLine1 ?? null;
    if (input.addressLine2 !== undefined) payload.addressLine2 = addressLine2 ?? null;
    if (input.taxId !== undefined) payload.taxId = taxId ?? null;
    if (input.defaultCurrency !== undefined) payload.defaultCurrency = defaultCurrency;
    if (input.defaultInvoiceLanguage !== undefined) payload.defaultInvoiceLanguage = defaultInvoiceLanguage;
    if (input.appLanguage !== undefined) payload.appLanguage = appLanguage;

    await db
      .update(freelancerProfiles)
      .set(payload)
      .where(and(eq(freelancerProfiles.userId, userId), eq(freelancerProfiles.id, existing.id)));
  }

  return getFreelancerProfile(userId);
}

export async function setFreelancerLogo(
  userId: string,
  input: { logoUrl: string; logoObjectKey: string },
) {
  const existing = await getFreelancerProfile(userId);

  if (!existing) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.execute(
      sql`
        insert into "freelancer_profiles"
          ("id", "user_id", "logo_url", "logo_object_key", "created_at", "updated_at")
        values
          (${id}, ${userId}, ${input.logoUrl}, ${input.logoObjectKey}, ${now}, ${now})
      `,
    );
  } else {
    try {
      await db
        .update(freelancerProfiles)
        .set({
          logoUrl: input.logoUrl,
          logoObjectKey: input.logoObjectKey,
          updatedAt: new Date(),
        })
        .where(and(eq(freelancerProfiles.userId, userId), eq(freelancerProfiles.id, existing.id)));
    } catch {
      await db
        .update(freelancerProfiles)
        .set({
          logoUrl: input.logoUrl,
          updatedAt: new Date(),
        })
        .where(and(eq(freelancerProfiles.userId, userId), eq(freelancerProfiles.id, existing.id)));
    }
  }

  return getFreelancerProfile(userId);
}
