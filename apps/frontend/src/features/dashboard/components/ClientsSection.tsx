import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/ui/select";
import { Table, TableWrapper, Td, Th } from "../../../shared/ui/table";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { useFreelanceOpsContext } from "../hooks/FreelanceOpsContext";

export function ClientsSection() {
  const { t } = useI18n();
  const ops = useFreelanceOpsContext();

  return (
    <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
      <CardHeader>
        <CardTitle className="text-lg text-white">{t("clients.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-2" onSubmit={ops.handleCreateClientSubmit}>
          <Input
            placeholder={t("clients.namePlaceholder")}
            value={ops.clientName}
            onChange={(e) => ops.setClientName(e.target.value)}
          />
          <Input
            placeholder={t("clients.emailPlaceholder")}
            value={ops.clientEmail}
            onChange={(e) => ops.setClientEmail(e.target.value)}
          />
          <Input
            placeholder={t("clients.phonePlaceholder")}
            value={ops.clientPhone}
            onChange={(e) => ops.setClientPhone(e.target.value)}
          />
          <Button type="submit" disabled={ops.isCreatingLogo || !ops.clientName.trim()}>
            {t("clients.add")}
          </Button>
        </form>

        <div className="flex justify-end">
          <div className="w-40">
            <Select value={ops.clientFilter} onValueChange={ops.setClientFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("clients.filterAll")}</SelectItem>
                <SelectItem value="active">{t("clients.filterActive")}</SelectItem>
                <SelectItem value="inactive">{t("clients.filterInactive")}</SelectItem>
                <SelectItem value="archived">{t("clients.filterArchived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {ops.clientStatus && (
          <div className={`rounded-lg border p-3 text-sm ${
            ops.clientStatus.tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-danger/40 bg-danger/20 text-danger'
          }`}>
            {ops.clientStatus.message}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <TableWrapper>
            <Table>
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <Th>{t("clients.tableName")}</Th>
                  <Th>{t("clients.tableContact")}</Th>
                  <Th>{t("clients.tableStatus")}</Th>
                  <Th className="text-right">{t("licensing.tableActions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ops.filteredClients.length === 0 ? (
                  <tr>
                    <Td colSpan={4} className="py-8 text-center text-slate-500">
                      {t("clients.noClients")}
                    </Td>
                  </tr>
                ) : (
                  ops.filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors">
                      <Td className="font-medium text-white">{client.name}</Td>
                      <Td className="text-slate-400">
                        <div className="text-xs">{client.email || '-'}</div>
                        <div className="text-[11px] opacity-70">{client.phone || '-'}</div>
                      </Td>
                      <Td>
                        {client.isDeleted ? (
                          <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-400">
                            {t("clients.statusArchived")}
                          </span>
                        ) : (
                          <button
                            onClick={() => ops.handleToggleClientStatus(client)}
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                              client.status === 'active' 
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' 
                                : 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30'
                            }`}
                          >
                            {client.status === 'active' ? t("clients.statusActive") : t("clients.statusInactive")}
                          </button>
                        )}
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-1">
                          {!client.isDeleted ? (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white" onClick={() => ops.openEditClient(client)}>
                                {t("licensing.edit")}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-danger/70 hover:bg-danger/10 hover:text-danger" onClick={() => ops.setClientToArchive(client)}>
                                {t("licensing.archive")}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 text-emerald-400 hover:bg-emerald-500/10" onClick={() => ops.setClientToRestore(client)}>
                                {t("licensing.restore")}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-danger/70 hover:bg-danger/10 hover:text-danger" onClick={() => ops.setClientToDelete(client)}>
                                {t("licensing.delete")}
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
        </div>
      </CardContent>
    </Card>
  );
}
