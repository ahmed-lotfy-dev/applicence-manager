import type { Stats } from "../types/dashboard";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Card, CardContent } from "../../../shared/ui/card";

interface StatsCardsProps {
  stats: Stats;
}

const ITEMS = [
  { key: "total", labelKey: "stats.total", tone: "text-primary", accent: "bg-primary" },
  { key: "active", labelKey: "stats.active", tone: "text-emerald-300", accent: "bg-emerald-300" },
  { key: "pending", labelKey: "stats.pending", tone: "text-warning", accent: "bg-warning" },
  { key: "revoked", labelKey: "stats.revoked", tone: "text-danger", accent: "bg-danger" },
] as const;

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useI18n();
  const asCount = (value: number) =>
    new Intl.NumberFormat("en-US").format(value);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 mb-6">
      {ITEMS.map((item) => (
        <Card key={item.key} className="overflow-hidden">
          <CardContent className="relative py-8">
            <div className={`absolute left-8 top-0 h-1.5 w-16 rounded-b-full ${item.accent}`} />
            <p className="mb-3 text-[11px] uppercase font-semibold tracking-[0.18em] text-text-muted/70">{t(item.labelKey)}</p>
            <p className={`metric-value text-5xl font-black tracking-tight ${item.tone}`}>{asCount(stats[item.key])}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
