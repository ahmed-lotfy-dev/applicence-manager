import { useState, useEffect } from "react";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/ui/select";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { CURRENCY_OPTIONS, type SupportedCurrency } from "../../onboarding/setup";
import type { FreelancerProfile } from "../types/dashboard";

interface SettingsPageProps {
  freelancerProfile: FreelancerProfile | null;
  onSaveFreelancerProfile: (
    data: Partial<Pick<FreelancerProfile, "defaultCurrency" | "defaultInvoiceLanguage" | "appLanguage">>
  ) => Promise<void>;
}

interface SaveStatus {
  currency: "idle" | "saving" | "success" | "error";
  invoiceLanguage: "idle" | "saving" | "success" | "error";
  appLanguage: "idle" | "saving" | "success" | "error";
}

export function SettingsPage({ freelancerProfile, onSaveFreelancerProfile }: SettingsPageProps) {
  const { t } = useI18n();

  const [currency, setCurrency] = useState<SupportedCurrency>(
    (freelancerProfile?.defaultCurrency as SupportedCurrency) ?? "USD"
  );
  const [invoiceLanguage, setInvoiceLanguage] = useState<"en" | "ar">(
    (freelancerProfile?.defaultInvoiceLanguage as "en" | "ar") ?? "en"
  );
  const [appLanguage, setAppLanguage] = useState<"en" | "ar">(
    (freelancerProfile?.appLanguage as "en" | "ar") ?? "en"
  );

  const [status, setStatus] = useState<SaveStatus>({
    currency: "idle",
    invoiceLanguage: "idle",
    appLanguage: "idle",
  });

  useEffect(() => {
    if (freelancerProfile) {
      if (freelancerProfile.defaultCurrency) {
        setCurrency(freelancerProfile.defaultCurrency as SupportedCurrency);
      }
      if (freelancerProfile.defaultInvoiceLanguage) {
        setInvoiceLanguage(freelancerProfile.defaultInvoiceLanguage as "en" | "ar");
      }
      if (freelancerProfile.appLanguage) {
        setAppLanguage(freelancerProfile.appLanguage as "en" | "ar");
      }
    }
  }, [freelancerProfile]);

  const handleCurrencySave = async () => {
    setStatus((s) => ({ ...s, currency: "saving" }));
    try {
      await onSaveFreelancerProfile({ defaultCurrency: currency });
      setStatus((s) => ({ ...s, currency: "success" }));
      setTimeout(() => setStatus((s) => ({ ...s, currency: "idle" })), 2000);
    } catch {
      setStatus((s) => ({ ...s, currency: "error" }));
      setTimeout(() => setStatus((s) => ({ ...s, currency: "idle" })), 3000);
    }
  };

  const handleInvoiceLanguageSave = async () => {
    setStatus((s) => ({ ...s, invoiceLanguage: "saving" }));
    try {
      await onSaveFreelancerProfile({ defaultInvoiceLanguage: invoiceLanguage });
      setStatus((s) => ({ ...s, invoiceLanguage: "success" }));
      setTimeout(() => setStatus((s) => ({ ...s, invoiceLanguage: "idle" })), 2000);
    } catch {
      setStatus((s) => ({ ...s, invoiceLanguage: "error" }));
      setTimeout(() => setStatus((s) => ({ ...s, invoiceLanguage: "idle" })), 3000);
    }
  };

  const handleAppLanguageSave = async () => {
    setStatus((s) => ({ ...s, appLanguage: "saving" }));
    try {
      await onSaveFreelancerProfile({ appLanguage });
      setStatus((s) => ({ ...s, appLanguage: "success" }));
      setTimeout(() => setStatus((s) => ({ ...s, appLanguage: "idle" })), 2000);
    } catch {
      setStatus((s) => ({ ...s, appLanguage: "error" }));
      setTimeout(() => setStatus((s) => ({ ...s, appLanguage: "idle" })), 3000);
    }
  };

  const statusStyles = (s: SaveStatus[keyof SaveStatus]) => {
    if (s === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    if (s === "error") return "border-danger/40 bg-danger/20 text-danger";
    return "hidden";
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white">{t("settings.currency.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={currency} onValueChange={(v) => setCurrency(v as SupportedCurrency)}>
            <SelectTrigger className="w-full md:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {status.currency !== "idle" && (
            <div className={`rounded-lg border p-2 text-sm ${statusStyles(status.currency)}`}>
              {status.currency === "saving" && t("settings.saving")}
              {status.currency === "success" && t("settings.saved")}
              {status.currency === "error" && t("settings.saveError")}
            </div>
          )}
          <div>
            <Button onClick={handleCurrencySave} disabled={status.currency === "saving"}>
              {status.currency === "saving" ? t("settings.saving") : t("settings.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white">{t("settings.defaultInvoiceLanguage.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={invoiceLanguage} onValueChange={(v) => setInvoiceLanguage(v as "en" | "ar")}>
            <SelectTrigger className="w-full md:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("header.lang.en")}</SelectItem>
              <SelectItem value="ar">{t("header.lang.ar")}</SelectItem>
            </SelectContent>
          </Select>
          {status.invoiceLanguage !== "idle" && (
            <div className={`rounded-lg border p-2 text-sm ${statusStyles(status.invoiceLanguage)}`}>
              {status.invoiceLanguage === "saving" && t("settings.saving")}
              {status.invoiceLanguage === "success" && t("settings.saved")}
              {status.invoiceLanguage === "error" && t("settings.saveError")}
            </div>
          )}
          <div>
            <Button onClick={handleInvoiceLanguageSave} disabled={status.invoiceLanguage === "saving"}>
              {status.invoiceLanguage === "saving" ? t("settings.saving") : t("settings.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white">{t("settings.appLanguage.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={appLanguage} onValueChange={(v) => setAppLanguage(v as "en" | "ar")}>
            <SelectTrigger className="w-full md:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("header.lang.en")}</SelectItem>
              <SelectItem value="ar">{t("header.lang.ar")}</SelectItem>
            </SelectContent>
          </Select>
          {status.appLanguage !== "idle" && (
            <div className={`rounded-lg border p-2 text-sm ${statusStyles(status.appLanguage)}`}>
              {status.appLanguage === "saving" && t("settings.saving")}
              {status.appLanguage === "success" && t("settings.saved")}
              {status.appLanguage === "error" && t("settings.saveError")}
            </div>
          )}
          <div>
            <Button onClick={handleAppLanguageSave} disabled={status.appLanguage === "saving"}>
              {status.appLanguage === "saving" ? t("settings.saving") : t("settings.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
