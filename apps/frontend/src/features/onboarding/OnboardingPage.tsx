import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { FreelancerProfile } from "../dashboard/types/dashboard";
import { CURRENCY_OPTIONS, type SupportedCurrency } from "./setup";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Button } from "../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/ui/select";

interface OnboardingPageProps {
  profile: FreelancerProfile | null;
  onSaveProfile: (input: {
    businessName?: string;
    contactEmail?: string;
    contactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    defaultCurrency?: SupportedCurrency;
    defaultInvoiceLanguage?: "en" | "ar";
    appLanguage?: "en" | "ar";
  }) => Promise<FreelancerProfile | null>;
  onUploadLogo: (file: File) => Promise<FreelancerProfile | null>;
  onComplete: (profile: FreelancerProfile) => void;
}

export function OnboardingPage({ profile, onSaveProfile, onUploadLogo, onComplete }: OnboardingPageProps) {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(profile?.businessName || "");
  const [contactEmail, setContactEmail] = useState(profile?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(profile?.contactPhone || "");
  const [addressLine1, setAddressLine1] = useState(profile?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(profile?.addressLine2 || "");
  const [defaultCurrency, setDefaultCurrency] = useState<SupportedCurrency>(
    (profile?.defaultCurrency as SupportedCurrency | null) || "USD",
  );
  const [defaultInvoiceLanguage, setDefaultInvoiceLanguage] = useState<"en" | "ar">(
    profile?.defaultInvoiceLanguage || locale,
  );
  const [appLanguage, setAppLanguage] = useState<"en" | "ar">(profile?.appLanguage || locale);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(profile?.logoUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const stepTitle = useMemo(() => {
    if (step === 0) return t("onboarding.step.business");
    if (step === 1) return t("onboarding.step.defaults");
    return t("onboarding.step.language");
  }, [step, t]);

  const handleLogoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedLogoFile(file);
    const nextPreview = URL.createObjectURL(file);
    setLogoPreviewUrl(nextPreview);
    event.target.value = "";
  };

  const nextStep = () => {
    if (step === 0 && !businessName.trim()) {
      setStatus({ tone: "error", message: t("onboarding.businessRequired") });
      return;
    }
    if (step < 2) {
      setStatus(null);
      setStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!businessName.trim()) {
      setStatus({ tone: "error", message: t("onboarding.businessRequired") });
      setStep(0);
      return;
    }
    setIsSaving(true);
    let nextProfile = profile;
    if (selectedLogoFile) {
      const uploaded = await onUploadLogo(selectedLogoFile);
      if (!uploaded) {
        setStatus({ tone: "error", message: t("onboarding.saveError") });
        setIsSaving(false);
        return;
      }
      nextProfile = uploaded;
    }
    const saved = await onSaveProfile({
      businessName: businessName.trim(),
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      addressLine1: addressLine1.trim() || undefined,
      addressLine2: addressLine2.trim() || undefined,
      defaultCurrency,
      defaultInvoiceLanguage,
      appLanguage,
    });
    setIsSaving(false);
    if (!saved) {
      setStatus({ tone: "error", message: t("onboarding.saveError") });
      return;
    }
    setLocale(appLanguage);
    setStatus({ tone: "success", message: t("onboarding.saved") });
    onComplete({ ...saved, logoUrl: saved.logoUrl || nextProfile?.logoUrl || null });
    navigate("/overview", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-border/10 bg-bg-card/92">
          <CardHeader className="space-y-3 border-b border-white/5 pb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/75">Fawtarly</p>
            <CardTitle className="text-3xl font-black tracking-tight text-text">{t("onboarding.title")}</CardTitle>
            <p className="text-sm text-text-muted">{t("onboarding.subtitle")}</p>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-white/10"}`}
                />
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">{t("onboarding.stepLabel")}</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{stepTitle}</h2>
            </div>

            {status && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  status.tone === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-danger/40 bg-danger/20 text-danger"
                }`}
              >
                {status.message}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {step === 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={t("onboarding.businessName")} />
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={t("onboarding.contactEmail")} />
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={t("onboarding.contactPhone")} />
                  <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder={t("onboarding.address1")} />
                  <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder={t("onboarding.address2")} />
                  <div className="space-y-2">
                    <Input type="file" accept="image/*" onChange={handleLogoSelect} />
                    {logoPreviewUrl && (
                      <img src={logoPreviewUrl} alt={t("onboarding.logoAlt")} className="h-16 w-auto rounded-lg border border-white/10 bg-white/5 p-2" />
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Select value={defaultCurrency} onValueChange={(value) => setDefaultCurrency(value as SupportedCurrency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={defaultInvoiceLanguage} onValueChange={(value) => setDefaultInvoiceLanguage(value as "en" | "ar")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("header.lang.en")}</SelectItem>
                      <SelectItem value="ar">{t("header.lang.ar")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    value={appLanguage}
                    onValueChange={(value) => {
                      const next = value as "en" | "ar";
                      setAppLanguage(next);
                      setLocale(next);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("header.lang.en")}</SelectItem>
                      <SelectItem value="ar">{t("header.lang.ar")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="outline" disabled={step === 0 || isSaving} onClick={() => setStep((prev) => Math.max(prev - 1, 0))}>
                  {t("onboarding.back")}
                </Button>
                {step < 2 ? (
                  <Button type="button" onClick={nextStep}>
                    {t("onboarding.next")}
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? t("onboarding.saving") : t("onboarding.finish")}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
