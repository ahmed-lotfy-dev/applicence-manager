import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ActivationsTable } from "./ActivationsTable";
import { FilterTabs } from "./FilterTabs";
import type { AppSummary, EditAppState, EditLicenseState, LicensesPanelProps } from "./LicensesPanel.types";
import { LicensesAppManagementCard } from "./LicensesAppManagementCard";
import { LicensesCreateDialog } from "./LicensesCreateDialog";
import { LicensesCreateLockedDialog } from "./LicensesCreateLockedDialog";
import { LicensesEditAppDialog } from "./LicensesEditAppDialog";
import { LicensesEditLicenseDialog } from "./LicensesEditLicenseDialog";
import { LicensesInventoryCard } from "./LicensesInventoryCard";
import { StatsCards } from "./StatsCards";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Dialog } from "../../../shared/ui/dialog";
import { Input } from "../../../shared/ui/input";

function buildAppSummaries(licenses: LicensesPanelProps["licenses"]): AppSummary[] {
  const map = new Map<string, AppSummary>();
  for (const license of licenses) {
    const current = map.get(license.appName) || { appName: license.appName, licenses: 0, activeActivations: 0, maxActivations: 0 };
    current.licenses += 1;
    current.activeActivations += license.activeActivations;
    current.maxActivations += license.maxActivations;
    map.set(license.appName, current);
  }
  return Array.from(map.values()).sort((a, b) => a.appName.localeCompare(b.appName));
}

export function LicensesPanel(props: LicensesPanelProps) {
  const { t } = useI18n();
  const {
    activations,
    licenses,
    apps,
    stats,
    filterValue,
    onFilterChange,
    activationFilter,
    onActivationFilterChange,
    onCreateApp,
    onUpdateApp,
    onRemoveApp,
    onCreateLicense,
    onUpdateLicense,
    onRemoveLicense,
    onChangeLicenseStatus,
    isCreatingLicense,
    isCreatingApp,
    appActionLoadingId,
    licenseActionLoadingId,
    activationActionLoadingId,
    loadingActivations,
    activationError,
    onApproveActivation,
    onRevokeActivation,
  } = props;

  const summaries = useMemo(() => buildAppSummaries(licenses), [licenses]);
  const [section, setSection] = useState<"licenses" | "activations">("licenses");
  const [newAppName, setNewAppName] = useState("");
  const [createLicenseOpen, setCreateLicenseOpen] = useState(false);
  const [createLockedLicenseOpen, setCreateLockedLicenseOpen] = useState(false);
  const [createLicenseAppId, setCreateLicenseAppId] = useState("");
  const [createLicenseMax, setCreateLicenseMax] = useState("1");
  const [createLockedLicenseAppId, setCreateLockedLicenseAppId] = useState("");
  const [lockedMachineId, setLockedMachineId] = useState("");
  const [createLockedLicenseMax, setCreateLockedLicenseMax] = useState("1");
  const [createdLockedLicenseKey, setCreatedLockedLicenseKey] = useState("");
  const [editingApp, setEditingApp] = useState<EditAppState | null>(null);
  const [editingLicense, setEditingLicense] = useState<EditLicenseState | null>(null);
  const [licenseToDelete, setLicenseToDelete] = useState<LicensesPanelProps["licenses"][number] | null>(null);
  const [activationQuery, setActivationQuery] = useState("");
  const [activationAppFilter, setActivationAppFilter] = useState<string>("all");
  const [activationLicenseFilter, setActivationLicenseFilter] = useState<string>("all");

  const openLockedLicenseFromActivation = (activation: LicensesPanelProps["activations"][number]) => {
    const matchingApp = apps.find((app) => app.name === activation.appName);
    setCreateLockedLicenseAppId(matchingApp?.id || "");
    setLockedMachineId(activation.machineId);
    setCreateLockedLicenseMax("1");
    setCreatedLockedLicenseKey("");
    setCreateLockedLicenseOpen(true);
  };

  const handleCreateApp = async (event: FormEvent) => {
    event.preventDefault();
    const name = newAppName.trim();
    if (!name) return;
    const ok = await onCreateApp(name);
    if (ok) setNewAppName("");
  };

  const handleCreateLicense = async (event: FormEvent) => {
    event.preventDefault();
    const app = apps.find((item) => item.id === createLicenseAppId);
    const maxActivations = Number(createLicenseMax);
    if (!app || Number.isNaN(maxActivations) || maxActivations < 1) return;
    const created = await onCreateLicense({ appName: app.name, maxActivations });
    if (created) {
      setCreateLicenseOpen(false);
      setCreateLicenseAppId("");
      setCreateLicenseMax("1");
    }
  };

  const handleCreateLockedLicense = async (event: FormEvent) => {
    event.preventDefault();
    const app = apps.find((item) => item.id === createLockedLicenseAppId);
    const maxActivations = Number(createLockedLicenseMax);
    const machineId = lockedMachineId.trim();
    if (!app || Number.isNaN(maxActivations) || maxActivations < 1 || machineId.length < 6) return;
    const created = await onCreateLicense({ appName: app.name, maxActivations, lockedMachineId: machineId });
    if (created) setCreatedLockedLicenseKey(created.licenseKey);
  };

  const handleSubmitEditApp = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingApp) return;
    const name = editingApp.name.trim();
    if (!name) return;
    await onUpdateApp(editingApp.id, { name, status: editingApp.status });
    setEditingApp(null);
  };

  const handleSubmitEditLicense = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingLicense) return;
    const maxActivations = Number(editingLicense.maxActivations);
    if (Number.isNaN(maxActivations) || maxActivations < 1) return;
    await onUpdateLicense(editingLicense.id, { maxActivations, status: editingLicense.status });
    setEditingLicense(null);
  };

  const activationAppOptions = useMemo(
    () => Array.from(new Set(activations.map((activation) => activation.appName))).sort((a, b) => a.localeCompare(b)),
    [activations],
  );
  const activationLicenseOptions = useMemo(
    () => Array.from(new Set(activations.map((activation) => activation.licenseKey))).sort((a, b) => a.localeCompare(b)),
    [activations],
  );
  const filteredActivations = useMemo(() => {
    const query = activationQuery.trim().toLowerCase();
    return activations.filter((activation) => {
      if (activationFilter !== "all" && activation.status !== activationFilter) return false;
      if (activationAppFilter !== "all" && activation.appName !== activationAppFilter) return false;
      if (activationLicenseFilter !== "all" && activation.licenseKey !== activationLicenseFilter) return false;
      if (!query) return true;
      return (
        activation.appName.toLowerCase().includes(query) ||
        activation.licenseKey.toLowerCase().includes(query) ||
        activation.machineId.toLowerCase().includes(query) ||
        (activation.shopName || "").toLowerCase().includes(query) ||
        (activation.phone || "").toLowerCase().includes(query) ||
        (activation.notes || "").toLowerCase().includes(query) ||
        (activation.requestReason || "").toLowerCase().includes(query) ||
        (activation.requestPlatform || "").toLowerCase().includes(query)
      );
    });
  }, [activationAppFilter, activationFilter, activationLicenseFilter, activationQuery, activations]);

  return (
    <section className="mb-6 space-y-4">
      <Card className="rounded-[1.75rem] bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader className="border-b border-white/5">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={section === "licenses" ? "default" : "ghost"}
              onClick={() => setSection("licenses")}
              className={section === "licenses" ? "rounded-xl" : "rounded-xl text-slate-300 hover:text-white"}
            >
              {t("licensing.section.licenses")}
            </Button>
            <Button
              variant={section === "activations" ? "default" : "ghost"}
              onClick={() => setSection("activations")}
              className={section === "activations" ? "rounded-xl" : "rounded-xl text-slate-300 hover:text-white"}
            >
              {t("licensing.section.activations")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          {section === "licenses" ? (
            <>
              <LicensesAppManagementCard
                apps={apps}
                summaries={summaries}
                filterValue={filterValue}
                newAppName={newAppName}
                isCreatingApp={isCreatingApp}
                appActionLoadingId={appActionLoadingId}
                onFilterChange={onFilterChange}
                onNewAppNameChange={setNewAppName}
                onCreateAppSubmit={handleCreateApp}
                onEditApp={setEditingApp}
                onRemoveApp={(id) => void onRemoveApp(id)}
              />

              <LicensesInventoryCard
                appsCount={apps.length}
                licenses={licenses}
                licenseActionLoadingId={licenseActionLoadingId}
                onOpenCreateLicense={() => setCreateLicenseOpen(true)}
                onOpenCreateLockedLicense={() => {
                  setCreatedLockedLicenseKey("");
                  setCreateLockedLicenseOpen(true);
                }}
                onEditLicense={(id, maxActivations, status) => setEditingLicense({ id, maxActivations: String(maxActivations), status })}
                onChangeLicenseStatus={(id, nextStatus) => void onChangeLicenseStatus(id, nextStatus)}
                onRemoveLicense={(id) => {
                  const target = licenses.find((license) => license.id === id) ?? null;
                  setLicenseToDelete(target);
                }}
              />
            </>
          ) : (
            <>
              <StatsCards stats={stats} />
              <Card className="rounded-[1.5rem] bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
                <CardHeader className="space-y-3 border-b border-white/5 px-8 py-7">
                  <CardTitle className="text-lg text-white">{t("licensing.activationsTitle")}</CardTitle>
                  <p className="text-sm text-slate-400">{t("licensing.activationsSubtitle")}</p>
                  {activationError && (
                    <div className="rounded-lg border border-danger/30 bg-danger/20 p-3 text-sm text-danger">
                      {activationError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Input
                      placeholder={t("licensing.searchPlaceholder")}
                      value={activationQuery}
                      onChange={(event) => setActivationQuery(event.target.value)}
                    />
                    <Input
                      list="activation-app-options"
                      placeholder={t("licensing.filterAppPlaceholder")}
                      value={activationAppFilter === "all" ? "" : activationAppFilter}
                      onChange={(event) => setActivationAppFilter(event.target.value.trim() || "all")}
                    />
                    <Input
                      list="activation-license-options"
                      placeholder={t("licensing.filterLicensePlaceholder")}
                      value={activationLicenseFilter === "all" ? "" : activationLicenseFilter}
                      onChange={(event) => setActivationLicenseFilter(event.target.value.trim() || "all")}
                    />
                    <datalist id="activation-app-options">
                      {activationAppOptions.map((appName) => (
                        <option key={appName} value={appName} />
                      ))}
                    </datalist>
                    <datalist id="activation-license-options">
                      {activationLicenseOptions.map((licenseKey) => (
                        <option key={licenseKey} value={licenseKey} />
                      ))}
                    </datalist>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0">
                  <div className="overflow-hidden rounded-[1.25rem] border border-white/5 bg-white/5">
                    <FilterTabs selectedTab={activationFilter} onSelect={onActivationFilterChange} />
                    <ActivationsTable
                      activations={filteredActivations}
                      loading={loadingActivations}
                      actionLoadingId={activationActionLoadingId}
                      onApprove={(id) => {
                        void onApproveActivation(id);
                      }}
                      onRevoke={(id) => {
                        void onRevokeActivation(id);
                      }}
                      onGenerateLockedLicense={openLockedLicenseFromActivation}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      <LicensesCreateDialog
        open={createLicenseOpen}
        apps={apps}
        appId={createLicenseAppId}
        maxActivations={createLicenseMax}
        isCreating={isCreatingLicense}
        onOpenChange={setCreateLicenseOpen}
        onAppIdChange={setCreateLicenseAppId}
        onMaxActivationsChange={setCreateLicenseMax}
        onSubmit={handleCreateLicense}
      />

      <LicensesCreateLockedDialog
        open={createLockedLicenseOpen}
        apps={apps}
        appId={createLockedLicenseAppId}
        machineId={lockedMachineId}
        maxActivations={createLockedLicenseMax}
        generatedKey={createdLockedLicenseKey}
        isCreating={isCreatingLicense}
        onOpenChange={(open) => {
          setCreateLockedLicenseOpen(open);
          if (!open) {
            setCreateLockedLicenseAppId("");
            setCreateLockedLicenseMax("1");
            setLockedMachineId("");
            setCreatedLockedLicenseKey("");
          }
        }}
        onAppIdChange={setCreateLockedLicenseAppId}
        onMachineIdChange={setLockedMachineId}
        onMaxActivationsChange={setCreateLockedLicenseMax}
        onSubmit={handleCreateLockedLicense}
      />

      <LicensesEditAppDialog
        app={editingApp}
        appActionLoadingId={appActionLoadingId}
        onOpenChange={(open) => !open && setEditingApp(null)}
        onAppChange={setEditingApp}
        onSubmit={handleSubmitEditApp}
      />

      <LicensesEditLicenseDialog
        license={editingLicense}
        licenseActionLoadingId={licenseActionLoadingId}
        onOpenChange={(open) => !open && setEditingLicense(null)}
        onLicenseChange={setEditingLicense}
        onSubmit={handleSubmitEditLicense}
      />

      <Dialog
        open={licenseToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setLicenseToDelete(null);
        }}
        title={t("licensing.deleteTitle")}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-300">{t("licensing.deleteDescription")}</p>
          {licenseToDelete ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <div className="font-semibold text-white">{licenseToDelete.appName}</div>
              <div className="mt-1 font-mono text-xs text-danger">{licenseToDelete.licenseKey}</div>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white"
              onClick={() => setLicenseToDelete(null)}
            >
              {t("clients.archiveCancel")}
            </Button>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90"
              disabled={!licenseToDelete || licenseActionLoadingId === licenseToDelete.id}
              onClick={() => {
                if (!licenseToDelete) return;
                void onRemoveLicense(licenseToDelete.id).finally(() => {
                  setLicenseToDelete(null);
                });
              }}
            >
              {t("licensing.deleteConfirm")}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
