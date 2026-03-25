import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import type { BillingStats } from "../types/dashboard";
import { formatCurrencyCents } from "../../../shared/lib/currency";

interface OverviewPageProps {
  billingStats: BillingStats;
  clientsCount: number;
  invoicesCount: number;
  currency?: string | null;
}

export function OverviewPage({
  billingStats,
  clientsCount,
  invoicesCount,
  currency,
}: OverviewPageProps) {
  const { t } = useI18n();
  const asCount = (value: number) =>
    new Intl.NumberFormat("en-US").format(value);
  const asMoney = (cents: number) => formatCurrencyCents(cents, currency);

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted">{t("overview.clients")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="metric-value text-4xl font-black text-text">{asCount(clientsCount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted">{t("overview.invoices")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="metric-value text-4xl font-black text-text">{asCount(invoicesCount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted">{t("overview.paid")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="metric-value text-4xl font-black text-emerald-300">
              {asMoney(billingStats.totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted">{t("overview.outstanding")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="metric-value text-4xl font-black text-warning">
              {asMoney(billingStats.totalOutstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="min-h-[22rem] overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{t("overview.snapshotTitle")}</CardTitle>
              <p className="mt-2 text-sm text-text-muted">{t("overview.snapshotDescription")}</p>
            </div>
            <div className="rounded-full bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {t("overview.live")}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.6rem] bg-bg-light p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted/70">{t("overview.totalInvoiced")}</p>
              <p className="metric-value mt-4 text-4xl font-black tracking-tight text-text">{asMoney(billingStats.totalInvoiced)}</p>
            </div>
            <div className="rounded-[1.6rem] bg-bg-light p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted/70">{t("overview.paidCashflow")}</p>
              <p className="metric-value mt-4 text-4xl font-black tracking-tight text-emerald-300">{asMoney(billingStats.totalPaid)}</p>
            </div>
            <div className="rounded-[1.6rem] bg-bg-light p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted/70">{t("overview.outstanding")}</p>
              <p className="metric-value mt-4 text-4xl font-black tracking-tight text-warning">{asMoney(billingStats.totalOutstanding)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("overview.notesTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.4rem] bg-bg-light p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted/70">{t("overview.clientBase")}</p>
              <p className="mt-3 text-lg font-semibold text-text">{t("overview.clientBaseValue").replace("{count}", asCount(clientsCount))}</p>
            </div>
            <div className="rounded-[1.4rem] bg-bg-light p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted/70">{t("overview.invoiceThroughput")}</p>
              <p className="mt-3 text-lg font-semibold text-text">{t("overview.invoiceThroughputValue").replace("{count}", asCount(invoicesCount))}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
