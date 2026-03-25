import type { License } from "../types/dashboard";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Table, TableWrapper, Td, Th } from "../../../shared/ui/table";

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
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{t("licensing.inventoryTitle")}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="bg-primary text-white hover:bg-primary/90"
            onClick={onOpenCreateLockedLicense}
            disabled={appsCount === 0}
          >
            {t("licensing.generateLocked")}
          </Button>
          <Button onClick={onOpenCreateLicense} disabled={appsCount === 0}>
            {t("licensing.newLicense")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TableWrapper>
          <Table>
            <thead className="border-b border-white/5 bg-white/5">
              <tr>
                <Th>{t("licensing.table.app")}</Th>
                <Th>{t("licensing.table.licenseKey")}</Th>
                <Th>{t("licensing.table.type")}</Th>
                <Th>{t("licensing.table.status")}</Th>
                <Th>{t("licensing.table.usage")}</Th>
                <Th>{t("licensing.table.remaining")}</Th>
                <Th>{t("licensing.table.actions")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {licenses.length === 0 ? (
                <tr>
                  <Td colSpan={7} className="py-8 text-center text-text-muted">
                    {t("licensing.noLicenses")}
                  </Td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-bg-light/30">
                    <Td className="text-base font-bold tracking-tight text-text">{license.appName}</Td>
                    <Td className="font-mono text-primary-light">{license.licenseKey}</Td>
                    <Td>
                      <Badge variant={license.licenseType === "machine_id_bound" ? "warning" : "muted"}>
                        {license.licenseType === "machine_id_bound" ? t("licensing.type.machine") : t("licensing.type.dynamic")}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={license.status === "active" ? "success" : "danger"}>
                        {t(`licensing.status.${license.status}`)}
                      </Badge>
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
                          {t("licensing.action.edit")}
                        </Button>
                        {license.status === "active" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={licenseActionLoadingId === license.id}
                            onClick={() => onChangeLicenseStatus(license.id, "revoked")}
                          >
                            {t("licensing.action.revoke")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={licenseActionLoadingId === license.id}
                            onClick={() => onChangeLicenseStatus(license.id, "active")}
                          >
                            {t("licensing.action.activate")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={licenseActionLoadingId === license.id}
                          onClick={() => onRemoveLicense(license.id)}
                        >
                          {t("licensing.action.delete")}
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
