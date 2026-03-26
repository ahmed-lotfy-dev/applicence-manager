import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Dialog } from "../../../shared/ui/dialog";
import { Input } from "../../../shared/ui/input";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { useFreelanceOpsContext } from "../hooks/FreelanceOpsContext";

export function BrandingSection() {
  const { t } = useI18n();
  const ops = useFreelanceOpsContext();

  return (
    <>
      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">{t("branding.title")}</CardTitle>
          <Button
            variant="outline"
            className="border-white/10 text-white"
            onClick={() => ops.setIsBrandingModalOpen(true)}
          >
            {t("branding.edit")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="px-3 py-2 text-slate-400">{t("branding.business")}</td>
                  <td className="px-3 py-2 text-white">{ops.profileBusinessName || '-'}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-3 py-2 text-slate-400">{t("branding.email")}</td>
                  <td className="px-3 py-2 text-white">{ops.profileEmail || '-'}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-3 py-2 text-slate-400">{t("branding.phone")}</td>
                  <td className="px-3 py-2 text-white">{ops.profilePhone || '-'}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-3 py-2 text-slate-400">{t("branding.address")}</td>
                  <td className="px-3 py-2 text-white">
                    {[ops.profileAddress1, ops.profileAddress2].filter(Boolean).join(' / ') || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-slate-400">{t("branding.taxId")}</td>
                  <td className="px-3 py-2 text-white">{ops.profileTaxId || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {ops.logoPreviewUrl && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">{t("branding.currentLogo")}</p>
              <img
                src={ops.logoPreviewUrl}
                alt={t('branding.logoAlt')}
                className="max-h-24 w-auto rounded-lg border border-white/10 bg-white/5"
              />
            </div>
          )}

          {ops.brandingStatus && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                ops.brandingStatus.tone === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-danger/40 bg-danger/20 text-danger'
              }`}
            >
              {ops.brandingStatus.message}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={ops.isBrandingModalOpen}
        onOpenChange={ops.setIsBrandingModalOpen}
        title={t("branding.modalTitle")}
        maxWidthClassName="max-w-2xl"
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={ops.handleBrandingSubmit}>
          <Input placeholder={t('branding.placeholder.business')} value={ops.profileBusinessName} onChange={(e) => ops.setProfileBusinessName(e.target.value)} />
          <label className="flex h-11 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200">
            <input
              type="file"
              accept="image/*"
              disabled={ops.isSavingBranding || ops.isUploadingLogo}
              className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white disabled:opacity-50"
              onChange={ops.handleLogoSelect}
            />
          </label>
          <Input placeholder={t('branding.placeholder.email')} value={ops.profileEmail} onChange={(e) => ops.setProfileEmail(e.target.value)} />
          <Input placeholder={t('branding.placeholder.phone')} value={ops.profilePhone} onChange={(e) => ops.setProfilePhone(e.target.value)} />
          <Input placeholder={t('branding.placeholder.address1')} value={ops.profileAddress1} onChange={(e) => ops.setProfileAddress1(e.target.value)} />
          <Input placeholder={t('branding.placeholder.address2')} value={ops.profileAddress2} onChange={(e) => ops.setProfileAddress2(e.target.value)} />
          <Input placeholder={t('branding.placeholder.taxId')} value={ops.profileTaxId} onChange={(e) => ops.setProfileTaxId(e.target.value)} />
          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {ops.selectedLogoFile ? t('branding.logoSelected').replace('{fileName}', ops.selectedLogoFile.name) : t("branding.logoWillUploadOnSave")}
            </p>
            <Button type="submit" disabled={ops.isSavingBranding || ops.isUploadingLogo}>
              {ops.isSavingBranding || ops.isUploadingLogo ? t("branding.saving") : t("branding.save")}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
