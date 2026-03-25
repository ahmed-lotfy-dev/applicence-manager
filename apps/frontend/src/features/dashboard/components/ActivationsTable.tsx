import type { Activation } from "../types/dashboard";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Badge } from "../../../shared/ui/badge";
import type { BadgeVariant } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Table, TableWrapper, Td, Th } from "../../../shared/ui/table";

interface ActivationsTableProps {
  activations: Activation[];
  loading: boolean;
  actionLoadingId: string | null;
  onApprove: (id: string) => void;
  onRevoke: (id: string) => void;
  onGenerateLockedLicense: (activation: Activation) => void;
}

function statusVariant(status: Activation["status"]): BadgeVariant {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "revoked":
      return "danger";
    default:
      return "muted";
  }
}

export function ActivationsTable({
  activations,
  loading,
  actionLoadingId,
  onApprove,
  onRevoke,
  onGenerateLockedLicense,
}: ActivationsTableProps) {
  const { t } = useI18n();

  return (
    <TableWrapper>
      <Table>
        <thead className="bg-white/5 border-b border-white/5">
          <tr>
            <Th>{t("activations.table.app")}</Th>
            <Th>{t("activations.table.storeName")}</Th>
            <Th>{t("activations.table.phone")}</Th>
            <Th>{t("activations.table.license")}</Th>
            <Th>{t("activations.table.machine")}</Th>
            <Th>{t("activations.table.status")}</Th>
            <Th>{t("activations.table.requestDetails")}</Th>
            <Th>{t("activations.table.action")}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <Td colSpan={8} className="text-center text-text-muted py-8">
                {t("activations.loading")}
              </Td>
            </tr>
          ) : activations.length === 0 ? (
            <tr>
              <Td colSpan={8} className="text-center text-slate-500 py-12 italic">
                {t("activations.empty")}
              </Td>
            </tr>
          ) : (
            activations.map((activation) => (
              <tr key={activation.id} className="hover:bg-white/2 transition-colors">
                <Td>
                  <div className="text-base font-bold tracking-tight text-white">
                    {activation.appName}
                  </div>
                  <div className="text-xs text-slate-500">
                    v{activation.appVersion}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-600">
                    {activation.requestType === "request_only" ? t("activations.requestOnly") : t("activations.licenseActivation")}
                  </div>
                </Td>
                <Td className="text-slate-200">{activation.shopName || "-"}</Td>
                <Td className="text-slate-300">{activation.phone || "-"}</Td>
                <Td className="font-mono text-primary-light/80">
                  {activation.licenseKey || t("activations.noLicense")}
                </Td>
                <Td className="font-mono text-slate-500 text-[10px]">
                  {activation.machineId}
                </Td>
                <Td>
                  <Badge variant={statusVariant(activation.status)} className="rounded-full px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                    {t(`licensing.status.${activation.status}`)}
                  </Badge>
                </Td>
                <Td>
                  <div className="space-y-1">
                    <div className="text-sm text-slate-200">
                      {activation.requestReason || t("activations.noDetails")}
                    </div>
                    {activation.notes ? (
                      <div className="text-xs text-slate-400">
                        {activation.notes}
                      </div>
                    ) : null}
                    {activation.requestPlatform ? (
                      <div className="text-xs uppercase tracking-wider text-slate-500">
                        {activation.requestPlatform}
                      </div>
                    ) : null}
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    {activation.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onApprove(activation.id)}
                          disabled={actionLoadingId === activation.id}
                        >
                          {t("activations.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onGenerateLockedLicense(activation)}
                          disabled={actionLoadingId === activation.id}
                        >
                          {t("activations.createLocked")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoadingId === activation.id}
                          onClick={() => onRevoke(activation.id)}
                        >
                          {t("activations.dismiss")}
                        </Button>
                      </>
                    ) : activation.status === "active" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionLoadingId === activation.id}
                        onClick={() => onRevoke(activation.id)}
                      >
                        {t("licensing.action.revoke")}
                      </Button>
                    ) : (
                      <span className="text-xs text-text-muted">{t("activations.noAction")}</span>
                    )}
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
