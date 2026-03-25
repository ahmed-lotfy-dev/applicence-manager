import type { FreelancerProfile } from "../dashboard/types/dashboard";

export const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "EGP", symbol: "E£" },
  { code: "SAR", symbol: "ر.س" },
  { code: "AED", symbol: "د.إ" },
  { code: "GBP", symbol: "£" },
] as const;

export type SupportedCurrency = (typeof CURRENCY_OPTIONS)[number]["code"];

export function isSetupComplete(profile: FreelancerProfile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.businessName?.trim() &&
      profile.defaultCurrency?.trim() &&
      profile.defaultInvoiceLanguage &&
      profile.appLanguage,
  );
}
