import { useMemo } from "react";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";
import { useLicensingStore } from "../hooks/licensingStore";
import { useLicensingDataContext } from "../hooks/LicensingDataContext";
import type { AppSummary } from "./LicensesPanel.types";

export function LicensesAppManagementCard() {
  const { t } = useI18n();
  const state = useLicensingStore();
  const { apps, licenses, isCreatingApp, appActionLoadingId, createNewApp } = useLicensingDataContext();

  const displayApps = useMemo(
    () =>
      apps.filter((app) =>
        app.name.toLowerCase().includes(state.appFilter.toLowerCase()),
      ),
    [apps, state.appFilter],
  );

  const summaries = useMemo<AppSummary[]>(() => {
    const map = new Map<string, AppSummary>();
    for (const license of licenses) {
      const existing = map.get(license.appName) ?? {
        appName: license.appName,
        licenses: 0,
        activeActivations: 0,
        maxActivations: 0,
      };
      existing.licenses += 1;
      existing.activeActivations += license.activeActivations;
      existing.maxActivations += license.maxActivations;
      map.set(license.appName, existing);
    }
    return Array.from(map.values());
  }, [licenses]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.newAppName.trim()) return;
    const result = await createNewApp(state.newAppName.trim());
    if (result) {
      state.setNewAppName("");
    }
  };

  return (
    <Card className="rounded-[1.5rem] bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
      <CardHeader className="space-y-4 border-b border-white/5 px-8 py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-white">
              {t("licensing.appsTitle")}
            </CardTitle>
            <p className="text-sm text-slate-400">
              {t("licensing.appsSubtitle")}
            </p>
          </div>
          <div className="w-full md:w-64">
            <Input
              placeholder={t("licensing.searchPlaceholder")}
              value={state.appFilter}
              onChange={(e) => state.setAppFilter(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-8 py-6">
        <form className="mb-6 flex gap-2" onSubmit={handleCreateApp}>
          <Input
            placeholder={t("licensing.newAppNamePlaceholder")}
            value={state.newAppName}
            onChange={(e) => state.setNewAppName(e.target.value)}
            disabled={isCreatingApp}
          />
          <Button type="submit" disabled={isCreatingApp || !state.newAppName.trim()}>
            {isCreatingApp ? t("licensing.creatingApp") : t("licensing.createApp")}
          </Button>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayApps.map((app) => (
            <div
              key={app.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04] hover:shadow-lg"
            >
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-semibold text-white">{app.name}</h3>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wider">
                    {app.slug}
                  </span>
                </div>
                <div className="flex gap-4">
                   <div className="text-xs text-slate-400">
                      <span className="font-mono text-white">{summaries.find(s => s.appName === app.name)?.licenses ?? 0}</span> {t("licensing.licenses")}
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="font-mono text-emerald-400">{summaries.find(s => s.appName === app.name)?.activeActivations ?? 0}</span> {t("licensing.active")}
                    </div>
                </div>
              </div>
              <div className="flex gap-2 border-t border-white/5 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-[11px] text-slate-400 hover:bg-primary/10 hover:text-primary"
                    onClick={() => state.setEditingApp({ id: app.id, name: app.name, status: app.status })}
                    disabled={appActionLoadingId === app.id}
                  >
                    {t("licensing.edit")}
                  </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-danger/50 hover:bg-danger/10 hover:text-danger"
                  onClick={() => state.setAppToDelete(app)}
                  disabled={appActionLoadingId === app.id}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
