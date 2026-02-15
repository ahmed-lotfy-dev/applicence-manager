import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AppSummary, EditAppState, EditLicenseState, LicensesPanelProps } from "./LicensesPanel.types";
import { LicensesAppManagementCard } from "./LicensesAppManagementCard";
import { LicensesCreateDialog } from "./LicensesCreateDialog";
import { LicensesCreateLockedDialog } from "./LicensesCreateLockedDialog";
import { LicensesEditAppDialog } from "./LicensesEditAppDialog";
import { LicensesEditLicenseDialog } from "./LicensesEditLicenseDialog";
import { LicensesInventoryCard } from "./LicensesInventoryCard";

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
    licenses,
    apps,
    filterValue,
    onFilterChange,
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
  } = props;

  const summaries = useMemo(() => buildAppSummaries(licenses), [licenses]);
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

  return (
    <section className="mb-6 space-y-4">
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
