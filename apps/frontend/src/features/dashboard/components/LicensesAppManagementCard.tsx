import type { FormEvent } from "react";
import type { AppSummary, EditAppState } from "./LicensesPanel.types";
import type { ManagedApp } from "../types/dashboard";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader } from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";

interface LicensesAppManagementCardProps {
  apps: ManagedApp[];
  summaries: AppSummary[];
  filterValue: string;
  newAppName: string;
  isCreatingApp: boolean;
  appActionLoadingId: string | null;
  onFilterChange: (value: string) => void;
  onNewAppNameChange: (value: string) => void;
  onCreateAppSubmit: (event: FormEvent) => void;
  onEditApp: (next: EditAppState) => void;
  onRemoveApp: (id: string) => void;
}

export function LicensesAppManagementCard({
  apps,
  summaries,
  filterValue,
  newAppName,
  isCreatingApp,
  appActionLoadingId,
  onFilterChange,
  onNewAppNameChange,
  onCreateAppSubmit,
  onEditApp,
  onRemoveApp,
}: LicensesAppManagementCardProps) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader className="border-b border-white/5 px-8 py-6">
        <form
          onSubmit={onCreateAppSubmit}
          className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_auto] md:items-center"
        >
          <Input
            value={filterValue}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder={t("licensing.appFilterPlaceholder")}
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
          <Input
            value={newAppName}
            onChange={(event) => onNewAppNameChange(event.target.value)}
            placeholder={t("licensing.appNewPlaceholder")}
            className="h-10 border-white/10 bg-white/5"
            required
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={isCreatingApp}
            className="h-10 rounded-xl bg-success px-6 !text-white hover:bg-success/90"
          >
            {isCreatingApp ? t("licensing.appAdding") : t("licensing.addApp")}
          </Button>
        </form>
      </CardHeader>

      <CardContent className="space-y-6 px-8 py-6">
        <div className="flex flex-wrap gap-3">
          {apps.length === 0 && <p className="ml-1 text-sm italic text-text-muted">{t("licensing.noApps")}</p>}
          {apps.map((app) => (
            <div
              key={app.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/5 bg-white/5 px-4 py-4 shadow-soft transition-all hover:bg-white/7"
            >
              <span className="text-sm font-bold text-slate-200">{app.name}</span>
              <Badge
                variant={app.status === "active" ? "success" : "muted"}
                className="rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
              >
                {t(`licensing.status.${app.status}`)}
              </Badge>
              <div className="mx-1 hidden h-4 w-px bg-white/10 md:block" />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg bg-indigo-500/20 px-2.5 text-indigo-100 ring-1 ring-indigo-300/30 hover:bg-indigo-500/30 hover:text-white"
                disabled={appActionLoadingId === app.id}
                onClick={() => onEditApp({ id: app.id, name: app.name, status: app.status })}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="text-xs font-semibold">{t("licensing.action.edit")}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg bg-rose-500/20 px-2.5 text-rose-100 ring-1 ring-rose-300/30 hover:bg-rose-500/30 hover:text-white"
                disabled={appActionLoadingId === app.id}
                onClick={() => onRemoveApp(app.id)}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="text-xs font-semibold">{t("licensing.action.delete")}</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {summaries.length === 0 ? (
            <p className="ml-1 text-sm text-text-muted">{t("licensing.noSummaries")}</p>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.appName}
                className="rounded-xl border border-white/5 bg-white/5 px-4 py-5 text-left transition-all hover:bg-white/10 hover:shadow-soft"
              >
                <p className="text-base font-bold text-white">{summary.appName}</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-400">{t("licensing.totalLicenses")}</span>
                    <span className="font-bold text-slate-200">{summary.licenses}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-400">{t("licensing.seatsUsage")}</span>
                    <span className="font-bold text-slate-200">
                      {summary.activeActivations} / {summary.maxActivations}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000"
                      style={{ width: `${Math.min(100, (summary.activeActivations / summary.maxActivations) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
