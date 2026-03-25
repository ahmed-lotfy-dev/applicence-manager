import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";
import { useLicensingPanel } from "../hooks/useLicensingPanel";
import { ActivationsTable } from "./ActivationsTable";
import { FilterTabs } from "./FilterTabs";
import type { LicensesPanelProps } from "./LicensesPanel.types";
import { LicensesAppManagementCard } from "./LicensesAppManagementCard";
import { LicensesCreateDialog } from "./LicensesCreateDialog";
import { LicensesCreateLockedDialog } from "./LicensesCreateLockedDialog";
import { LicensesEditAppDialog } from "./LicensesEditAppDialog";
import { LicensesEditLicenseDialog } from "./LicensesEditLicenseDialog";
import { LicensesInventoryCard } from "./LicensesInventoryCard";
import { StatsCards } from "./StatsCards";
import { LicensingDialogs } from "./LicensingDialogs";

export function LicensesPanel(props: LicensesPanelProps) {
  const { t } = useI18n();
  const state = useLicensingPanel(props);

  return (
    <section className="mb-6 space-y-4">
      <Card className="rounded-[1.75rem] bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader className="border-b border-white/5">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={state.section === "licenses" ? "default" : "ghost"}
              onClick={() => state.handleSectionChange("licenses")}
              className={
                state.section === "licenses"
                  ? "rounded-xl"
                  : "rounded-xl text-slate-300 hover:text-white"
              }
            >
              {t("licensing.section.licenses")}
            </Button>
            <Button
              variant={state.section === "activations" ? "default" : "ghost"}
              onClick={() => state.handleSectionChange("activations")}
              className={
                state.section === "activations"
                  ? "rounded-xl"
                  : "rounded-xl text-slate-300 hover:text-white"
              }
            >
              {t("licensing.section.activations")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          {state.section === "licenses" ? (
            <>
              <LicensesAppManagementCard
                apps={props.apps}
                summaries={state.summaries}
                filterValue={props.filterValue}
                newAppName={state.newAppName}
                isCreatingApp={props.isCreatingApp}
                appActionLoadingId={props.appActionLoadingId}
                onFilterChange={props.onFilterChange}
                onNewAppNameChange={state.setNewAppName}
                onCreateAppSubmit={state.handleCreateApp}
                onEditApp={state.setEditingApp}
                onRemoveApp={(id) => {
                  const target =
                    props.apps.find((app) => app.id === id) ?? null;
                  state.setAppToDelete(target);
                }}
              />

              <LicensesInventoryCard
                appsCount={props.apps.length}
                licenses={props.licenses}
                licenseActionLoadingId={props.licenseActionLoadingId}
                onOpenCreateLicense={() => state.setCreateLicenseOpen(true)}
                onOpenCreateLockedLicense={() => {
                  state.setCreatedLockedLicenseKey("");
                  state.setCreateLockedLicenseOpen(true);
                }}
                onEditLicense={(id, maxActivations, status) =>
                  state.setEditingLicense({
                    id,
                    maxActivations: String(maxActivations),
                    status,
                  })
                }
                onChangeLicenseStatus={(id, nextStatus) => {
                  if (nextStatus === "revoked") {
                    const target =
                      props.licenses.find((license) => license.id === id) ??
                      null;
                    state.setLicenseToRevoke(target);
                    return;
                  }
                  void state.onChangeLicenseStatus(id, nextStatus);
                }}
                onRemoveLicense={(id) => {
                  const target =
                    props.licenses.find((license) => license.id === id) ?? null;
                  state.setLicenseToDelete(target);
                }}
              />
            </>
          ) : (
            <>
              <StatsCards stats={props.stats} />
              <Card className="rounded-[1.5rem] bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
                <CardHeader className="space-y-3 border-b border-white/5 px-8 py-7">
                  <CardTitle className="text-lg text-white">
                    {t("licensing.activationsTitle")}
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    {t("licensing.activationsSubtitle")}
                  </p>
                  {props.activationError && (
                    <div className="rounded-lg border border-danger/30 bg-danger/20 p-3 text-sm text-danger">
                      {props.activationError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/70">
                        {t("licensing.filterSearchLabel")}
                      </p>
                      <Input
                        placeholder={t("licensing.searchPlaceholder")}
                        value={state.activationQuery}
                        onChange={(event) =>
                          state.handleQueryChange(event.target.value)
                        }
                      />
                    </div>
                    <FilterTabs
                      selectedTab={props.activationFilter}
                      onSelect={state.handleFilterChange}
                    />
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0">
                  <div className="overflow-hidden rounded-[1.25rem] border border-white/5 bg-white/5">
                    <ActivationsTable
                      activations={state.filteredActivations}
                      loading={props.loadingActivations}
                      actionLoadingId={props.activationActionLoadingId}
                      onApprove={(id) => {
                        void state.onApproveActivation(id);
                      }}
                      onRevoke={(id) => {
                        const target =
                          props.activations.find(
                            (activation) => activation.id === id,
                          ) ?? null;
                        state.setActivationToRevoke(target);
                      }}
                      onDelete={(id) => {
                        const target =
                          props.activations.find(
                            (activation) => activation.id === id,
                          ) ?? null;
                        state.setActivationToDelete(target);
                      }}
                      onGenerateLockedLicense={
                        state.openLockedLicenseFromActivation
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      <LicensesCreateDialog
        open={state.createLicenseOpen}
        apps={props.apps}
        appId={state.createLicenseAppId}
        maxActivations={state.createLicenseMax}
        isCreating={props.isCreatingLicense}
        onOpenChange={state.setCreateLicenseOpen}
        onAppIdChange={state.setCreateLicenseAppId}
        onMaxActivationsChange={state.setCreateLicenseMax}
        onSubmit={state.handleCreateLicense}
      />

      <LicensesCreateLockedDialog
        open={state.createLockedLicenseOpen}
        apps={props.apps}
        appId={state.createLockedLicenseAppId}
        machineId={state.lockedMachineId}
        maxActivations={state.createLockedLicenseMax}
        generatedKey={state.createdLockedLicenseKey}
        isCreating={props.isCreatingLicense}
        onOpenChange={(open) => {
          state.setCreateLockedLicenseOpen(open);
          if (!open) {
            state.setCreateLockedLicenseAppId("");
            state.setCreateLockedLicenseMax("1");
            state.setLockedMachineId("");
            state.setCreatedLockedLicenseKey("");
          }
        }}
        onAppIdChange={state.setCreateLockedLicenseAppId}
        onMachineIdChange={state.setLockedMachineId}
        onMaxActivationsChange={state.setCreateLockedLicenseMax}
        onSubmit={state.handleCreateLockedLicense}
      />

      <LicensesEditAppDialog
        app={state.editingApp}
        appActionLoadingId={props.appActionLoadingId}
        onOpenChange={(open) => !open && state.setEditingApp(null)}
        onAppChange={state.setEditingApp}
        onSubmit={state.handleSubmitEditApp}
      />

      <LicensesEditLicenseDialog
        license={state.editingLicense}
        licenseActionLoadingId={props.licenseActionLoadingId}
        onOpenChange={(open) => !open && state.setEditingLicense(null)}
        onLicenseChange={state.setEditingLicense}
        onSubmit={state.handleSubmitEditLicense}
      />

      <LicensingDialogs
        appToDelete={state.appToDelete}
        licenseToRevoke={state.licenseToRevoke}
        licenseToDelete={state.licenseToDelete}
        activationToRevoke={state.activationToRevoke}
        activationToDelete={state.activationToDelete}
        appActionLoadingId={props.appActionLoadingId}
        licenseActionLoadingId={props.licenseActionLoadingId}
        activationActionLoadingId={props.activationActionLoadingId}
        onAppDeleteCancel={() => state.setAppToDelete(null)}
        onAppDeleteConfirm={(id) => {
          void state.onRemoveApp(id).finally(() => state.setAppToDelete(null));
        }}
        onLicenseRevokeCancel={() => state.setLicenseToRevoke(null)}
        onLicenseRevokeConfirm={(id) => {
          void state
            .onChangeLicenseStatus(id, "revoked")
            .finally(() => state.setLicenseToRevoke(null));
        }}
        onLicenseDeleteCancel={() => state.setLicenseToDelete(null)}
        onLicenseDeleteConfirm={(id) => {
          void state
            .onRemoveLicense(id)
            .finally(() => state.setLicenseToDelete(null));
        }}
        onActivationRevokeCancel={() => state.setActivationToRevoke(null)}
        onActivationRevokeConfirm={(id) => {
          void state
            .onRevokeActivation(id)
            .finally(() => state.setActivationToRevoke(null));
        }}
        onActivationDeleteCancel={() => state.setActivationToDelete(null)}
        onActivationDeleteConfirm={(id) => {
          void state
            .onDeleteActivation(id)
            .finally(() => state.setActivationToDelete(null));
        }}
      />
    </section>
  );
}
