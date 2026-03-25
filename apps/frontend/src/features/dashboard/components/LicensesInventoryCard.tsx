import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Table, TableWrapper, Td, Th } from "../../../shared/ui/table";
import { useLicensingPanelContext } from "../hooks/LicensingPanelContext";
import { Badge } from "../../../shared/ui/badge";

export function LicensesInventoryCard() {
  const { t } = useI18n();
  const state = useLicensingPanelContext();
  const { apps, licenses, licenseActionLoadingId } = state.props;

  return (
    <Card className="rounded-[1.5rem] bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
      <CardHeader className="flex flex-col gap-4 border-b border-white/5 px-8 py-7 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg text-white">
            {t("licensing.inventoryTitle")}
          </CardTitle>
          <p className="text-sm text-slate-400">
            {t("licensing.inventorySubtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => state.setCreateLockedLicenseOpen(true)}
            disabled={apps.length === 0}
            className="border-white/10 text-white"
          >
            {t("licensing.createLocked")}
          </Button>
          <Button
            onClick={() => state.setCreateLicenseOpen(true)}
            disabled={apps.length === 0}
          >
            {t("licensing.createLicense")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-8 py-6">
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
          <TableWrapper>
            <Table>
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                  <Th className="px-6 py-4">{t("licensing.tableKey")}</Th>
                  <Th className="px-6 py-4">{t("licensing.tableApp")}</Th>
                  <Th className="px-6 py-4">{t("licensing.tableUsage")}</Th>
                  <Th className="px-6 py-4">{t("licensing.tableStatus")}</Th>
                  <Th className="px-6 py-4 text-right">{t("licensing.tableActions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {licenses.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="py-12 text-center text-slate-500">
                      {t("licensing.noLicenses")}
                    </Td>
                  </tr>
                ) : (
                  licenses.map((license) => (
                    <tr key={license.id} className="group hover:bg-white/5 transition-colors">
                      <Td className="px-6 py-4 font-mono text-xs text-white">
                        {license.licenseKey}
                      </Td>
                      <Td className="px-6 py-4">
                        <span className="text-xs text-slate-300">
                          {apps.find((a) => a.id === license.appId)?.name || license.appId}
                        </span>
                      </Td>
                      <Td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                            <div 
                              className={`h-full bg-primary transition-all duration-500 ${
                                (license.activationsCount / (license.maxActivations || 1)) >= 1 ? 'bg-amber-400' : ''
                              }`}
                              style={{ width: `${Math.min(100, (license.activationsCount / (license.maxActivations || 1)) * 100)}%` }}
                             />
                          </div>
                          <span className="text-[10px] tabular-nums text-slate-400">
                            {license.activationsCount} / {license.maxActivations}
                          </span>
                        </div>
                      </Td>
                      <Td className="px-6 py-4">
                        <select
                          value={license.status}
                          disabled={licenseActionLoadingId === license.id}
                          className={`rounded-md border-0 bg-transparent py-0.5 pl-0 pr-6 text-xs font-medium focus:ring-0 ${
                            license.status === 'active' ? 'text-emerald-400' : 
                            license.status === 'revoked' ? 'text-danger' : 'text-slate-400'
                          }`}
                          onChange={(e) => {
                            const nextStatus = e.target.value as any;
                             if (nextStatus === "revoked") {
                               state.setLicenseToRevoke(license);
                             } else {
                               void state.onChangeLicenseStatus(license.id, nextStatus);
                             }
                          }}
                        >
                          <option value="active">{t("licensing.status.active")}</option>
                          <option value="revoked">{t("licensing.status.revoked")}</option>
                          <option value="expired">{t("licensing.status.expired")}</option>
                        </select>
                      </Td>
                      <Td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] text-slate-400 hover:text-white"
                            onClick={() => state.setEditingLicense({
                              id: license.id,
                              maxActivations: String(license.maxActivations),
                              status: license.status
                            })}
                            disabled={licenseActionLoadingId === license.id}
                          >
                            {t("licensing.edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-danger/50 hover:bg-danger/10 hover:text-danger"
                            onClick={() => state.setLicenseToDelete(license)}
                            disabled={licenseActionLoadingId === license.id}
                          >
                             <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </div>
      </CardContent>
    </Card>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
