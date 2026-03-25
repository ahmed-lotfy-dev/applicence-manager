import type { Activation } from "../types/dashboard";
import { Badge } from "../../../shared/ui/badge";
import type { BadgeVariant } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Table, TableWrapper, Td, Th } from "../../../shared/ui/table";

interface ActivationsTableProps {
  activations: Activation[];
  loading: boolean;
  actionLoadingId: string | null;
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
  onRevoke,
  onGenerateLockedLicense,
}: ActivationsTableProps) {
  return (
    <TableWrapper>
      <Table>
        <thead className="bg-white/5 border-b border-white/5">
          <tr>
            <Th>App</Th>
            <Th>Store Name</Th>
            <Th>Phone</Th>
            <Th>License</Th>
            <Th>Machine</Th>
            <Th>Status</Th>
            <Th>Request Details</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <Td colSpan={8} className="text-center text-text-muted py-8">
                Loading activations...
              </Td>
            </tr>
          ) : activations.length === 0 ? (
            <tr>
              <Td colSpan={8} className="text-center text-slate-500 py-12 italic">
                No activations found.
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
                    {activation.requestType === "request_only" ? "Request only" : "License activation"}
                  </div>
                </Td>
                <Td className="text-slate-200">{activation.shopName || "-"}</Td>
                <Td className="text-slate-300">{activation.phone || "-"}</Td>
                <Td className="font-mono text-primary-light/80">
                  {activation.licenseKey || "No license yet"}
                </Td>
                <Td className="font-mono text-slate-500 text-[10px]">
                  {activation.machineId}
                </Td>
                <Td>
                  <Badge variant={statusVariant(activation.status)} className="rounded-full px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                    {activation.status}
                  </Badge>
                </Td>
                <Td>
                  <div className="space-y-1">
                    <div className="text-sm text-slate-200">
                      {activation.requestReason || "No additional request details."}
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
                          variant="secondary"
                          onClick={() => onGenerateLockedLicense(activation)}
                        >
                          Create Locked License
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoadingId === activation.id}
                          onClick={() => onRevoke(activation.id)}
                        >
                          Dismiss
                        </Button>
                      </>
                    ) : activation.status === "active" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionLoadingId === activation.id}
                        onClick={() => onRevoke(activation.id)}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <span className="text-xs text-text-muted">No action</span>
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
