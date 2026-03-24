import { StatsCards } from "../components/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import type { BillingStats, Stats } from "../types/dashboard";

interface OverviewPageProps {
  stats: Stats;
  billingStats: BillingStats;
  clientsCount: number;
  invoicesCount: number;
}

export function OverviewPage({
  stats,
  billingStats,
  clientsCount,
  invoicesCount,
}: OverviewPageProps) {
  const { t } = useI18n();
  const asMoney = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);

  return (
    <section className="space-y-6">
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">{t("overview.clients")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-white">{clientsCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">{t("overview.invoices")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-white">{invoicesCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">{t("overview.paid")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-emerald-300">
              {asMoney(billingStats.totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">{t("overview.outstanding")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-amber-300">
              {asMoney(billingStats.totalOutstanding)}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
