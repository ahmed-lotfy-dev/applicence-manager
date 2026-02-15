import type { FormEvent } from "react";
import type { AppSummary, EditAppState } from "./LicensesPanel.types";
import type { ManagedApp } from "../../types/dashboard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

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
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b border-white/5 px-8 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-xl text-white">Licenses</CardTitle>
          <p className="mt-1 text-sm text-slate-400">Manage products, seats, and generated license keys.</p>
        </div>
        <div className="w-full md:w-auto">
          <Input
            value={filterValue}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Filter by app name"
            className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 md:w-72"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <form
          onSubmit={onCreateAppSubmit}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-white/5 bg-white/2 p-4 md:grid-cols-[1fr_auto]"
        >
          <Input
            value={newAppName}
            onChange={(event) => onNewAppNameChange(event.target.value)}
            placeholder="Add new app (example: deep-store)"
            className="border-white/10 bg-white/5"
            required
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={isCreatingApp}
            className="rounded-xl bg-success px-6 !text-white hover:bg-success/90"
          >
            {isCreatingApp ? "Adding..." : "Add App"}
          </Button>
        </form>

        <div className="flex flex-wrap gap-3">
          {apps.length === 0 && <p className="ml-1 text-sm italic text-text-muted">No apps created yet.</p>}
          {apps.map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-2 shadow-soft transition-all hover:scale-[1.02]"
            >
              <span className="text-sm font-bold text-slate-200">{app.name}</span>
              <Badge
                variant={app.status === "active" ? "success" : "muted"}
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              >
                {app.status}
              </Badge>
              <div className="mx-1 h-4 w-px bg-white/10" />
              <Button
                size="sm"
                variant="ghost"
                className="h-10 w-10 rounded-xl bg-indigo-500/20 p-0 text-indigo-100 ring-1 ring-indigo-300/30 hover:bg-indigo-500/30 hover:text-white"
                disabled={appActionLoadingId === app.id}
                onClick={() => onEditApp({ id: app.id, name: app.name, status: app.status })}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-10 w-10 rounded-xl bg-rose-500/20 p-0 text-rose-100 ring-1 ring-rose-300/30 hover:bg-rose-500/30 hover:text-white"
                disabled={appActionLoadingId === app.id}
                onClick={() => onRemoveApp(app.id)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {summaries.length === 0 ? (
            <p className="ml-1 text-sm text-text-muted">No license summaries available yet.</p>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.appName}
                className="rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:shadow-soft"
              >
                <p className="text-base font-bold text-white">{summary.appName}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-400">Total Licenses</span>
                    <span className="font-bold text-slate-200">{summary.licenses}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-400">Seats Usage</span>
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
