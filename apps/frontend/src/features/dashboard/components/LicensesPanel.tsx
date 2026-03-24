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
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
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
  const {
    activations,
    licenses,
    apps,
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
  const [activationQuery, setActivationQuery] = useState("");
  const [activationAppFilter, setActivationAppFilter] = useState<string>("all");
  const [activationLicenseFilter, setActivationLicenseFilter] = useState<string>("all");

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
        (activation.shopName || "").toLowerCase().includes(query)
      );
    });
  }, [activationAppFilter, activationFilter, activationLicenseFilter, activationQuery, activations]);

  return (
    <section className="mb-6 space-y-4">
      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader className="space-y-4 border-b border-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl text-white">Licensing Workspace</CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                Manage products, licenses, and activation activity from one place.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={section === "licenses" ? "default" : "ghost"}
                onClick={() => setSection("licenses")}
                className={section === "licenses" ? "" : "text-slate-300 hover:text-white"}
              >
                Licenses
              </Button>
              <Button
                variant={section === "activations" ? "default" : "ghost"}
                onClick={() => setSection("activations")}
                className={section === "activations" ? "" : "text-slate-300 hover:text-white"}
              >
                Activations
              </Button>
            </div>
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
                onRemoveLicense={(id) => void onRemoveLicense(id)}
              />
            </>
          ) : (
            <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
              <CardHeader className="space-y-3 border-b border-white/5">
                <CardTitle className="text-lg text-white">Activation Requests</CardTitle>
                <p className="text-sm text-slate-400">
                  Review activations across all apps or narrow them by app and license.
                </p>
                {activationError && (
                  <div className="rounded-lg border border-danger/30 bg-danger/20 p-3 text-sm text-danger">
                    {activationError}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    placeholder="Search app, store, machine, or license"
                    value={activationQuery}
                    onChange={(event) => setActivationQuery(event.target.value)}
                  />
                  <Input
                    list="activation-app-options"
                    placeholder="Filter by app or keep all"
                    value={activationAppFilter === "all" ? "" : activationAppFilter}
                    onChange={(event) => setActivationAppFilter(event.target.value.trim() || "all")}
                  />
                  <Input
                    list="activation-license-options"
                    placeholder="Filter by license or keep all"
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
              <CardContent className="p-0">
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
                />
              </CardContent>
            </Card>
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
    </section>
  );
}
