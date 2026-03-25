import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Button } from "../../../shared/ui/button";
import { Table, Td, Th } from "../../../shared/ui/table";
import { Badge } from "../../../shared/ui/badge";

import { useLicensingPanelContext } from "../hooks/LicensingPanelContext";

export function ActivationsTable() {
  const { t } = useI18n();
  const state = useLicensingPanelContext();
  const { activationActionLoadingId: actionLoadingId, loadingActivations: loading } = state.props;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-sm text-slate-500">{t("licensing.loadingActivations")}</p>
      </div>
    );
  }

  return (
    <Table>
      <thead>
        <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-slate-500">
          <Th className="px-6 py-4">{t("licensing.tableApp")}</Th>
          <Th className="px-6 py-4">{t("licensing.tableMachine")}</Th>
          <Th className="px-6 py-4">{t("licensing.tableContact")}</Th>
          <Th className="px-6 py-4">{t("licensing.tableStatus")}</Th>
          <Th className="px-6 py-4">{t("licensing.tableDate")}</Th>
          <Th className="px-6 py-4 text-right">{t("licensing.tableActions")}</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {state.filteredActivations.length === 0 ? (
          <tr>
            <Td colSpan={6} className="py-12 text-center text-slate-500">
              {t("licensing.noActivations")}
            </Td>
          </tr>
        ) : (
          state.filteredActivations.map((activation) => (
            <tr key={activation.id} className="group hover:bg-white/5 transition-colors">
              <Td className="px-6 py-4 font-medium text-white text-xs">
                {activation.appName}
              </Td>
              <Td className="px-6 py-4">
                <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                  {activation.machineId}
                </div>
              </Td>
              <Td className="px-6 py-4">
                <div className="space-y-0.5">
                  <div className="text-xs text-white">{activation.shopName || '-'}</div>
                  <div className="text-[10px] text-slate-500">{activation.phone || '-'}</div>
                </div>
              </Td>
              <Td className="px-6 py-4">
                <Badge 
                  variant={
                    activation.status === 'active' ? 'success' : 
                    activation.status === 'pending' ? 'warning' : 'danger'
                  }
                  className="rounded-full px-2 py-0 text-[10px]"
                >
                  {t(`licensing.status.${activation.status}`)}
                </Badge>
              </Td>
              <Td className="px-6 py-4 text-[11px] text-slate-500">
                {new Date(activation.createdAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}
              </Td>
              <Td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  {activation.status === 'pending' && (
                    <Button
                      size="sm"
                      className="h-8 text-[11px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      onClick={() => state.onApproveActivation(activation.id)}
                      disabled={actionLoadingId === activation.id}
                    >
                      {t("licensing.approve")}
                    </Button>
                  )}
                  {activation.status === 'active' && !activation.licenseKey && (
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-8 text-[11px] text-primary"
                       onClick={() => state.openLockedLicenseFromActivation(activation)}
                     >
                       {t("licensing.generateKey")}
                     </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] text-danger/70 hover:bg-danger/10"
                    onClick={() => state.setActivationToDelete(activation)}
                    disabled={actionLoadingId === activation.id}
                  >
                    {t("licensing.delete")}
                  </Button>
                </div>
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
