import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { DatePicker } from "../../../shared/ui/date-picker";
import { Input } from "../../../shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/ui/select";
import { Table, TableWrapper, Td, Th } from "../../../shared/ui/table";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { formatCurrencyCents } from "../../../shared/lib/currency";
import type { Invoice } from "../types/dashboard";
import { useFreelanceOpsContext } from "../hooks/FreelanceOpsContext";

export function InvoicesSection() {
  const { t } = useI18n();
  const ops = useFreelanceOpsContext();
  const { billingStats } = ops;
  const displayCurrency = ops.freelancerProfile?.defaultCurrency || ops.defaultCurrency;

  return (
    <div className="space-y-4">
      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-xl text-white">{t("freelance.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">{t("freelance.invoiced")}</p>
            <p className="mt-2 truncate text-lg font-semibold text-white tabular-nums">{formatCurrencyCents(billingStats.totalInvoiced, displayCurrency)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">{t("freelance.paid")}</p>
            <p className="mt-2 truncate text-lg font-semibold text-emerald-300 tabular-nums">{formatCurrencyCents(billingStats.totalPaid, displayCurrency)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">{t("freelance.outstanding")}</p>
            <p className="mt-2 truncate text-lg font-semibold text-amber-300 tabular-nums">{formatCurrencyCents(billingStats.totalOutstanding, displayCurrency)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg text-white">{t("invoice.title")}</CardTitle>
          <div className="w-36">
            <Select value={ops.invoiceFilter} onValueChange={(v) => ops.setInvoiceFilter(v as "all" | "active" | "archived")}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("invoice.filterAll")}</SelectItem>
                <SelectItem value="active">{t("invoice.filterActive")}</SelectItem>
                <SelectItem value="archived">{t("invoice.filterArchived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={ops.handleCreateInvoiceSubmit}>
             <Select value={ops.invoiceClientId} onValueChange={ops.setInvoiceClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("invoice.selectClient")} />
                </SelectTrigger>
                <SelectContent>
                  {ops.activeClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
             </Select>
             <Input placeholder={t("invoice.totalPlaceholder")} value={ops.invoiceTotal} onChange={(e) => ops.setInvoiceTotal(e.target.value)} />
             <Input placeholder={t("invoice.paidPlaceholder")} value={ops.invoicePaid} onChange={(e) => ops.setInvoicePaid(e.target.value)} />
             <DatePicker value={ops.invoiceDueDate} onChange={ops.setInvoiceDueDate} />
             <div className="md:col-span-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={ops.invoiceLanguage} onValueChange={(v) => ops.setInvoiceLanguage(v as "en" | "ar")}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={ops.sendInvoiceEmailOnCreate} onChange={(e) => ops.setSendInvoiceEmailOnCreate(e.target.checked)} className="rounded border-white/10 bg-white/5" />
                    {t("invoice.sendEmailOnCreate")}
                  </label>
                </div>
                <Button type="submit" disabled={ops.isCreatingInvoice || !ops.invoiceClientId}>
                  {ops.isCreatingInvoice ? t("invoice.creating") : t("invoice.create")}
                </Button>
             </div>
          </form>

          {ops.invoiceCreateStatus && <div className={`rounded-lg border p-3 text-sm ${ops.invoiceCreateStatus.tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-danger/40 bg-danger/20 text-danger'}`}>{ops.invoiceCreateStatus.message}</div>}
          {ops.invoiceRowStatus && <div className={`rounded-lg border p-3 text-sm ${ops.invoiceRowStatus.tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-danger/40 bg-danger/20 text-danger'}`}>{ops.invoiceRowStatus.message}</div>}

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <TableWrapper>
              <Table>
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                    <Th className="w-24">No.</Th>
                    <Th>Client</Th>
                    <Th className="w-28">Total</Th>
                    <Th className="w-28">Paid</Th>
                    <Th className="w-32">Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ops.sortedInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                      <Td className="text-xs font-mono text-slate-300">{inv.invoiceNo}</Td>
                      <Td className="text-sm text-white">{inv.clientName}</Td>
                      <Td><Input className="h-8 py-1 text-xs" value={ops.invoiceTotalMap[inv.id] ?? (inv.totalAmount/100)} onChange={e => ops.setInvoiceTotalMap(prev => ({ ...prev, [inv.id]: e.target.value }))} /></Td>
                      <Td><Input className="h-8 py-1 text-xs" value={ops.invoicePaidMap[inv.id] ?? (inv.paidAmount/100)} onChange={e => ops.setInvoicePaidMap(prev => ({ ...prev, [inv.id]: e.target.value }))} /></Td>
                      <Td>
                        <Select value={ops.invoiceStatusMap[inv.id] ?? inv.status} onValueChange={v => ops.setInvoiceStatusMap(prev => ({ ...prev, [inv.id]: v as Invoice["status"] }))}>
                          <SelectTrigger className="h-8 py-0 select-trigger-compact"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["draft", "sent", "partially_paid", "paid", "overdue"].map(s => <SelectItem key={s} value={s}>{t(`invoice.status.${s}`)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400" onClick={() => ops.handleInvoiceRowSave(inv)}>{t("licensing.save")}</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400" onClick={() => ops.handleSendInvoiceEmail(inv)} disabled={ops.sendingInvoiceEmailId === inv.id}>{t("invoice.send")}</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-400" onClick={() => ops.setInvoiceToArchive(inv)}>{t("licensing.archive")}</Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
