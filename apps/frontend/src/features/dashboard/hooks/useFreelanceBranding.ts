import { useCallback, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import type { FreelancerProfile } from "../types/dashboard";
import { z } from "zod";
import type { SupportedCurrency } from "../../onboarding/setup";

const brandingSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name is required")
    .max(180, "Business name is too long"),
  contactEmail: z
    .string()
    .trim()
    .max(254, "Contact email is too long")
    .refine(
      (value: string) => value.length === 0 || z.email().safeParse(value).success,
      "Invalid contact email",
    ),
  contactPhone: z.string().trim().max(60, "Contact phone is too long"),
  addressLine1: z.string().trim().max(220, "Address line 1 is too long"),
  addressLine2: z.string().trim().max(220, "Address line 2 is too long"),
  taxId: z.string().trim().max(120, "Tax ID is too long"),
});

interface UseFreelanceBrandingProps {
  freelancerProfile: FreelancerProfile | null;
  onSaveFreelancerProfile: (input: {
    businessName?: string;
    contactEmail?: string;
    contactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    taxId?: string;
    defaultCurrency?: SupportedCurrency;
    defaultInvoiceLanguage?: "en" | "ar";
    appLanguage?: "en" | "ar";
  }) => Promise<FreelancerProfile | null>;
  onUploadProfileLogo: (file: File) => Promise<FreelancerProfile | null>;
}

export function useFreelanceBranding(props: UseFreelanceBrandingProps) {
  const { t, locale } = useI18n();
  const { freelancerProfile, onSaveFreelancerProfile, onUploadProfileLogo } = props;

  const [profileBusinessName, setProfileBusinessName] = useState(
    freelancerProfile?.businessName || "",
  );
  const [profileEmail, setProfileEmail] = useState(
    freelancerProfile?.contactEmail || "",
  );
  const [profilePhone, setProfilePhone] = useState(
    freelancerProfile?.contactPhone || "",
  );
  const [profileAddress1, setProfileAddress1] = useState(
    freelancerProfile?.addressLine1 || "",
  );
  const [profileAddress2, setProfileAddress2] = useState(
    freelancerProfile?.addressLine2 || "",
  );
  const [profileTaxId, setProfileTaxId] = useState(
    freelancerProfile?.taxId || "",
  );

  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    freelancerProfile?.logoUrl || null,
  );
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const [brandingStatus, setBrandingStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [defaultCurrency, setDefaultCurrency] = useState<SupportedCurrency>(
    (freelancerProfile?.defaultCurrency as SupportedCurrency | null) || "USD",
  );
  const [defaultInvoiceLanguage, setDefaultInvoiceLanguage] = useState<
    "en" | "ar"
  >(freelancerProfile?.defaultInvoiceLanguage || (locale === "ar" ? "ar" : "en"));
  const [appLanguagePreference, setAppLanguagePreference] = useState<
    "en" | "ar"
  >(freelancerProfile?.appLanguage || (locale === "ar" ? "ar" : "en"));

  const translateValidationMessage = useCallback(
    (message: string) => {
      const map: Record<string, string> = {
        "Business name is required": t("validation.businessRequired"),
        "Business name is too long": t("validation.businessTooLong"),
        "Contact email is too long": t("validation.emailTooLong"),
        "Invalid contact email": t("validation.invalidEmail"),
        "Contact phone is too long": t("validation.phoneTooLong"),
        "Address line 1 is too long": t("validation.address1TooLong"),
        "Address line 2 is too long": t("validation.address2TooLong"),
        "Tax ID is too long": t("validation.taxIdTooLong"),
      };
      return map[message] || message;
    },
    [t],
  );

  const toOptional = (value: string): string | undefined => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const handleLogoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const nextPreview = URL.createObjectURL(nextFile);
    setSelectedLogoFile(nextFile);
    setLocalPreviewUrl(nextPreview);
    setLogoPreviewUrl(nextPreview);
    event.target.value = "";
  };

  const handleBrandingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBrandingStatus(null);
    const parsed = brandingSchema.safeParse({
      businessName: profileBusinessName,
      contactEmail: profileEmail,
      contactPhone: profilePhone,
      addressLine1: profileAddress1,
      addressLine2: profileAddress2,
      taxId: profileTaxId,
    });
    if (!parsed.success) {
      setBrandingStatus({
        tone: "error",
        message:
          translateValidationMessage(parsed.error.issues[0]?.message || "") ||
          t("branding.validationCheck"),
      });
      return;
    }
    setIsSavingBranding(true);
    if (selectedLogoFile) {
      setIsUploadingLogo(true);
      const uploadResult = await onUploadProfileLogo(selectedLogoFile);
      setIsUploadingLogo(false);
      if (!uploadResult) {
        setIsSavingBranding(false);
        return;
      }
      if (uploadResult.logoUrl) {
        setLogoPreviewUrl(uploadResult.logoUrl);
      }
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
      setSelectedLogoFile(null);
    }
    const result = await onSaveFreelancerProfile({
      businessName: toOptional(parsed.data.businessName),
      contactEmail: toOptional(parsed.data.contactEmail),
      contactPhone: toOptional(parsed.data.contactPhone),
      addressLine1: toOptional(parsed.data.addressLine1),
      addressLine2: toOptional(parsed.data.addressLine2),
      taxId: toOptional(parsed.data.taxId),
      defaultCurrency,
      defaultInvoiceLanguage,
      appLanguage: appLanguagePreference,
    });
    if (result) {
      setBrandingStatus({ tone: "success", message: t("branding.saved") });
      setIsBrandingModalOpen(false);
    } else {
      setBrandingStatus({ tone: "error", message: t("branding.saveError") });
    }
    setIsSavingBranding(false);
  };

  // Sync profile effects
  const syncFromProfile = useCallback(() => {
    setProfileBusinessName(freelancerProfile?.businessName || "");
    setProfileEmail(freelancerProfile?.contactEmail || "");
    setProfilePhone(freelancerProfile?.contactPhone || "");
    setProfileAddress1(freelancerProfile?.addressLine1 || "");
    setProfileAddress2(freelancerProfile?.addressLine2 || "");
    setProfileTaxId(freelancerProfile?.taxId || "");
    setDefaultCurrency(
      (freelancerProfile?.defaultCurrency as SupportedCurrency | null) || "USD",
    );
    setDefaultInvoiceLanguage(
      freelancerProfile?.defaultInvoiceLanguage ||
      (locale === "ar" ? "ar" : "en"),
    );
    setAppLanguagePreference(
      freelancerProfile?.appLanguage || (locale === "ar" ? "ar" : "en"),
    );
    if (!localPreviewUrl) {
      setLogoPreviewUrl(freelancerProfile?.logoUrl || null);
    }
  }, [freelancerProfile, locale, localPreviewUrl]);

  const cleanupPreviewUrl = useCallback(() => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
  }, [localPreviewUrl]);

  return {
    // Form Fields
    profileBusinessName, setProfileBusinessName,
    profileEmail, setProfileEmail,
    profilePhone, setProfilePhone,
    profileAddress1, setProfileAddress1,
    profileAddress2, setProfileAddress2,
    profileTaxId, setProfileTaxId,

    // Modal State
    isBrandingModalOpen, setIsBrandingModalOpen,
    selectedLogoFile,
    logoPreviewUrl,
    localPreviewUrl,

    // Status
    brandingStatus,
    isSavingBranding,
    isUploadingLogo,

    // Currency/Language
    defaultCurrency, setDefaultCurrency,
    defaultInvoiceLanguage, setDefaultInvoiceLanguage,
    appLanguagePreference, setAppLanguagePreference,

    // Handlers
    handleBrandingSubmit,
    handleLogoSelect,
    syncFromProfile,
    cleanupPreviewUrl,
  };
}
