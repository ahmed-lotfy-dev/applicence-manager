import type { License } from "../../types/dashboard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableWrapper, Td, Th } from "../ui/table";

interface LicensesInventoryCardProps {
  appsCount: number;
  licenses: License[];
  licenseActionLoadingId: string | null;
  onOpenCreateLicense: () => void;
  onOpenCreateLockedLicense: () => void;
  onEditLicense: (id: string, maxActivations: number, status: "active" | "revoked") => void;
  onChangeLicenseStatus: (id: string, nextStatus: "active" | "revoked") => void;
  onRemoveLicense: (id: string) => void;
}

export function LicensesInventoryCard({
  appsCount,
  licenses,
  licenseActionLoadingId,
  onOpenCreateLicense,
  onOpenCreateLockedLicense,
  onEditLicense,
  onChangeLicenseStatus,
  onRemoveLicense,
}: LicensesInventoryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>License Inventory</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="bg-primary text-white hover:bg-primary/90"
            onClick={onOpenCreateLockedLicense}
            disabled={appsCount === 0}
          >
            Generate by Machine ID
          </Button>
          <Button onClick={onOpenCreateLicense} disabled={appsCount === 0}>
            New License
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TableWrapper>
          <Table>
            <thead className="border-b border-white/5 bg-white/5">
              <tr>
                <Th>App</Th>
                <Th>License Key</Th>
                <Th>Status</Th>
                <Th>Usage</Th>
                <Th>Remaining</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {licenses.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="py-8 text-center text-text-muted">
                    No licenses found.
                  </Td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-bg-light/30">
                    <Td className="text-base font-bold tracking-tight text-text">{license.appName}</Td>
                    <Td className="font-mono text-primary-light">{license.licenseKey}</Td>
                    <Td>
                      <Badge variant={license.status === "active" ? "success" : "danger"}>{license.status}</Badge>
                    </Td>
                    <Td className="text-text-muted">
                      {license.activeActivations} / {license.maxActivations}
                    </Td>
                    <Td className="text-text-muted">{license.remainingActivations}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={licenseActionLoadingId === license.id}
                          onClick={() => onEditLicense(license.id, license.maxActivations, license.status)}
                        >
                          Edit
                        </Button>
                        {license.status === "active" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={licenseActionLoadingId === license.id}
                            onClick={() => onChangeLicenseStatus(license.id, "revoked")}
                          >
                            Revoke
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={licenseActionLoadingId === license.id}
                            onClick={() => onChangeLicenseStatus(license.id, "active")}
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={licenseActionLoadingId === license.id}
                          onClick={() => onRemoveLicense(license.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </CardContent>
    </Card>
  );
}
