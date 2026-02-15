import type { Activation } from "../../types/dashboard";
import { Badge } from "../ui/badge";
import type { BadgeVariant } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableWrapper, Td, Th } from "../ui/table";

interface ActivationsTableProps {
  activations: Activation[];
  loading: boolean;
  actionLoadingId: string | null;
  onApprove: (id: string) => void;
  onRevoke: (id: string) => void;
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
}: ActivationsTableProps) {
  return (
    <TableWrapper>
      <Table>
        <thead className="bg-white/5 border-b border-white/5">
          <tr>
            <Th>App</Th>
            <Th>Store Name</Th>
            <Th>License</Th>
            <Th>Machine</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <Td colSpan={6} className="text-center text-text-muted py-8">
                Loading activations...
              </Td>
            </tr>
          ) : activations.length === 0 ? (
            <tr>
              <Td colSpan={6} className="text-center text-slate-500 py-12 italic">
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
                </Td>
                <Td className="text-slate-200">{activation.shopName || "-"}</Td>
                <Td className="font-mono text-primary-light/80">
                  {activation.licenseKey}
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
                  {activation.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionLoadingId === activation.id}
                      onClick={() => onApprove(activation.id)}
                    >
                      Approve
                    </Button>
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
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
