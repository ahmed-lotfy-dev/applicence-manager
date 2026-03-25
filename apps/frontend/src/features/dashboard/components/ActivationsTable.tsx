import type { Activation } from "../types/dashboard";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Badge } from "../../../shared/ui/badge";
import type { BadgeVariant } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Table, TableWrapper, Td, Th } from "../../../shared/ui/table";

const ClockIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const DeviceIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const StoreIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

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

function formatActionSet(activation: Activation) {
  if (activation.status === "pending") {
    return "pending";
  }
  if (activation.status === "active") {
    return "active";
  }
  return "revoked";
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
    <TableWrapper className="rounded-none">
      <Table>
        <thead className="border-b border-white/5 bg-transparent">
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
              <Td
                colSpan={8}
                className="text-center text-slate-500 py-12 italic"
              >
                {t("activations.empty")}
              </Td>
            </tr>
          ) : (
            activations.map((activation) => (
              <tr
                key={activation.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <Td className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-100 text-sm leading-tight">
                      {activation.appName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      v{activation.appVersion}
                    </span>
                    <Badge
                      variant="muted"
                      className="text-[9px] px-1.5 py-0 w-fit font-normal"
                    >
                      {activation.requestType === "request_only"
                        ? t("activations.requestOnly")
                        : t("activations.licenseActivation")}
                    </Badge>
                  </div>
                </Td>
                <Td className="py-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <StoreIcon className="text-slate-500" />
                    <span className="truncate max-w-[90px] text-xs">
                      {activation.shopName || "-"}
                    </span>
                  </div>
                </Td>
                <Td className="py-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <DeviceIcon className="text-slate-500" />
                    <span className="font-mono text-xs">
                      {activation.phone || "-"}
                    </span>
                  </div>
                </Td>
                <Td className="py-3">
                  <span
                    className={`font-mono text-xs ${activation.licenseKey ? "text-primary-light/80" : "text-slate-600"}`}
                  >
                    {activation.licenseKey || t("activations.noLicense")}
                  </span>
                </Td>
                <Td className="py-3">
                  <span
                    className="font-mono text-[10px] text-slate-600 max-w-[100px] block truncate"
                    title={activation.machineId}
                  >
                    {activation.machineId}
                  </span>
                </Td>
                <Td className="py-3">
                  <Badge
                    variant={statusVariant(activation.status)}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {t(`licensing.status.${activation.status}`)}
                  </Badge>
                </Td>
                <Td className="py-3">
                  <div className="text-xs text-slate-400 space-y-1">
                    <div
                      className="text-slate-300 line-clamp-1 text-[11px]"
                      title={
                        activation.requestReason || t("activations.noDetails")
                      }
                    >
                      {activation.requestReason || t("activations.noDetails")}
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      {activation.requestPlatform ? (
                        <span className="uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded text-[9px]">
                          {activation.requestPlatform}
                        </span>
                      ) : null}
                      <div className="flex items-center gap-1 text-slate-600">
                        <ClockIcon className="w-2.5 h-2.5" />
                        <span className="text-[9px]">
                          {new Date(activation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Td>
                <Td className="py-3">
                  <div className="flex items-center gap-1">
                    {formatActionSet(activation) === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          className="h-7 px-3 text-[10px]"
                          onClick={() => onApprove(activation.id)}
                          disabled={actionLoadingId === activation.id}
                        >
                          {t("activations.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-3 text-[10px]"
                          onClick={() => onGenerateLockedLicense(activation)}
                          disabled={actionLoadingId === activation.id}
                        >
                          {t("activations.createLocked")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] text-slate-500 hover:text-danger"
                          disabled={actionLoadingId === activation.id}
                          onClick={() => onRevoke(activation.id)}
                        >
                          {t("activations.dismiss")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant={
                            activation.status === "active"
                              ? "destructive"
                              : "default"
                          }
                          className="h-7 px-3 text-[10px]"
                          disabled={actionLoadingId === activation.id}
                          onClick={() =>
                            activation.status === "active"
                              ? onRevoke(activation.id)
                              : onApprove(activation.id)
                          }
                        >
                          {activation.status === "active"
                            ? t("licensing.action.revoke")
                            : t("licensing.action.activate")}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-3 text-[10px]"
                          onClick={() => onGenerateLockedLicense(activation)}
                          disabled={actionLoadingId === activation.id}
                        >
                          {t("activations.createLocked")}
                        </Button>
                      </>
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
