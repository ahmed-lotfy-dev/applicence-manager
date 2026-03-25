import { useI18n } from "../../../shared/i18n/I18nProvider";
import { useLicensingPanelContext } from "../hooks/LicensingPanelContext";

export function StatsCards() {
  const { t } = useI18n();
  const state = useLicensingPanelContext();
  const { stats } = state.props;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 shadow-soft transition-all hover:bg-white/[0.05]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {t("licensing.stats.totalApps")}
        </p>
        <p className="mt-2 text-3xl font-bold text-white tabular-nums">
          {stats.totalApps}
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 shadow-soft transition-all hover:bg-white/[0.05]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {t("licensing.stats.totalLicenses")}
        </p>
        <p className="mt-2 text-3xl font-bold text-white tabular-nums">
          {stats.totalLicenses}
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 shadow-soft transition-all hover:bg-white/[0.05]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">
          {t("licensing.stats.totalActivations")}
        </p>
        <p className="mt-2 text-3xl font-bold text-emerald-400 tabular-nums">
          {stats.totalActivations}
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 shadow-soft transition-all hover:bg-white/[0.05]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80">
          {t("licensing.stats.activeKeysPercentage")}
        </p>
        <p className="mt-2 text-3xl font-bold text-amber-400 tabular-nums">
          {stats.activeKeysPercentage}%
        </p>
      </div>
    </div>
  );
}
