import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  EditAppState,
  EditLicenseState,
  LicensesPanelProps,
  AppSummary,
} from "../components/LicensesPanel.types";

function buildAppSummaries(
  licenses: LicensesPanelProps["licenses"],
): AppSummary[] {
  const map = new Map<string, AppSummary>();
  for (const license of licenses) {
    const current = map.get(license.appName) || {
      appName: license.appName,
      licenses: 0,
      activeActivations: 0,
      maxActivations: 0,
    };
    current.licenses += 1;
    current.activeActivations += license.activeActivations;
    current.maxActivations += license.maxActivations;
    map.set(license.appName, current);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.appName.localeCompare(b.appName),
  );
}

export function useLicensingPanel(props: LicensesPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const urlQuery = searchParams.get("q") || "";

  const {
    activations,
    licenses,
    apps,
    activationFilter,
    onActivationFilterChange,
    onCreateApp,
    onUpdateApp,
    onRemoveApp,
    onCreateLicense,
    onUpdateLicense,
    onRemoveLicense,
    onChangeLicenseStatus,
    onApproveActivation,
    onRevokeActivation,
    onDeleteActivation,
  } = props;

  const summaries = useMemo(() => buildAppSummaries(licenses), [licenses]);
  const [section, setSection] = useState<"licenses" | "activations">(
    urlTab === "activations" ? "activations" : "licenses",
  );
  const [activationQuery, setActivationQuery] = useState(urlQuery);

  const handleSectionChange = (newSection: "licenses" | "activations") => {
    setSection(newSection);
    const params = new URLSearchParams(searchParams);
    params.set("tab", newSection);
    setSearchParams(params);
  };

  const handleFilterChange = (newFilter: string) => {
    onActivationFilterChange(newFilter as typeof activationFilter);
    const params = new URLSearchParams(searchParams);
    if (newFilter && newFilter !== "all") {
      params.set("filter", newFilter);
    } else {
      params.delete("filter");
    }
    setSearchParams(params);
  };

  const handleQueryChange = (newQuery: string) => {
    setActivationQuery(newQuery);
    const params = new URLSearchParams(searchParams);
    if (newQuery) {
      params.set("q", newQuery);
    } else {
      params.delete("q");
    }
    setSearchParams(params);
  };

  const [newAppName, setNewAppName] = useState("");
  const [appFilter, setAppFilter] = useState("");
  const [createLicenseOpen, setCreateLicenseOpen] = useState(false);
  const [createLockedLicenseOpen, setCreateLockedLicenseOpen] = useState(false);
  const [createLicenseAppId, setCreateLicenseAppId] = useState("");
  const [createLicenseMax, setCreateLicenseMax] = useState("1");
  const [createLockedLicenseAppId, setCreateLockedLicenseAppId] = useState("");
  const [lockedMachineId, setLockedMachineId] = useState("");
  const [createLockedLicenseMax, setCreateLockedLicenseMax] = useState("1");
  const [createdLockedLicenseKey, setCreatedLockedLicenseKey] = useState("");
  const [editingApp, setEditingApp] = useState<EditAppState | null>(null);
  const [editingLicense, setEditingLicense] = useState<EditLicenseState | null>(
    null,
  );
  const [appToDelete, setAppToDelete] = useState<
    LicensesPanelProps["apps"][number] | null
  >(null);
  const [licenseToDelete, setLicenseToDelete] = useState<
    LicensesPanelProps["licenses"][number] | null
  >(null);
  const [licenseToRevoke, setLicenseToRevoke] = useState<
    LicensesPanelProps["licenses"][number] | null
  >(null);
  const [activationToRevoke, setActivationToRevoke] = useState<
    LicensesPanelProps["activations"][number] | null
  >(null);
  const [activationToDelete, setActivationToDelete] = useState<
    LicensesPanelProps["activations"][number] | null
  >(null);

  const openLockedLicenseFromActivation = (
    activation: LicensesPanelProps["activations"][number],
  ) => {
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
    const created = await onCreateLicense({
      appName: app.name,
      maxActivations,
    });
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
    if (
      !app ||
      Number.isNaN(maxActivations) ||
      maxActivations < 1 ||
      machineId.length < 6
    )
      return;
    const created = await onCreateLicense({
      appName: app.name,
      maxActivations,
      lockedMachineId: machineId,
    });
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
    await onUpdateLicense(editingLicense.id, {
      maxActivations,
      status: editingLicense.status,
    });
    setEditingLicense(null);
  };

  const filteredActivations = useMemo(() => {
    const query = activationQuery.trim().toLowerCase();
    return activations.filter((activation) => {
      if (activationFilter !== "all" && activation.status !== activationFilter)
        return false;
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
  }, [activationFilter, activationQuery, activations]);

  const filteredApps = useMemo(() => {
    const query = appFilter.trim().toLowerCase();
    if (!query) return apps;
    return apps.filter((app) =>
      app.name.toLowerCase().includes(query),
    );
  }, [appFilter, apps]);

  return {
    summaries,
    section,
    activationQuery,
    filteredActivations,
    filteredApps,
    newAppName,
    createLicenseOpen,
    createLockedLicenseOpen,
    createLicenseAppId,
    createLicenseMax,
    createLockedLicenseAppId,
    lockedMachineId,
    createLockedLicenseMax,
    createdLockedLicenseKey,
    editingApp,
    editingLicense,
    appToDelete,
    licenseToDelete,
    licenseToRevoke,
    activationToRevoke,
    activationToDelete,
    handleSectionChange,
    handleFilterChange,
    handleQueryChange,
    setNewAppName,
    setAppFilter,
    setCreateLicenseOpen,
    setCreateLockedLicenseOpen,
    setCreateLicenseAppId,
    setCreateLicenseMax,
    setCreateLockedLicenseAppId,
    setLockedMachineId,
    setCreateLockedLicenseMax,
    setCreatedLockedLicenseKey,
    setEditingApp,
    setEditingLicense,
    setAppToDelete,
    setLicenseToDelete,
    setLicenseToRevoke,
    setActivationToRevoke,
    setActivationToDelete,
    handleCreateApp,
    handleCreateLicense,
    handleCreateLockedLicense,
    handleSubmitEditApp,
    handleSubmitEditLicense,
    openLockedLicenseFromActivation,
    onApproveActivation,
    onRevokeActivation,
    onRemoveApp,
    onChangeLicenseStatus,
    onRemoveLicense,
    onDeleteActivation,
    props,
  };
}
