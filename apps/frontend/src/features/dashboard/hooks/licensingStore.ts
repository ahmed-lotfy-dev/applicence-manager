import { create } from "zustand";
import type { FormEvent } from "react";
import type {
  EditAppState,
  EditLicenseState,
} from "../components/LicensesPanel.types";
import type { Activation, ActivationFilter, License, ManagedApp } from "../types/dashboard";

export interface LicensingUI {
  section: "licenses" | "activations";
  activationQuery: string;
  appFilter: string;
  newAppName: string;
  createLicenseOpen: boolean;
  createLockedLicenseOpen: boolean;
  createLicenseAppId: string;
  createLicenseMax: string;
  createLockedLicenseAppId: string;
  lockedMachineId: string;
  createLockedLicenseMax: string;
  createdLockedLicenseKey: string;
  editingApp: EditAppState | null;
  editingLicense: EditLicenseState | null;
  appToDelete: ManagedApp | null;
  licenseToDelete: License | null;
  licenseToRevoke: License | null;
  activationToRevoke: Activation | null;
  activationToDelete: Activation | null;
}

export interface LicensingStore extends LicensingUI {
  setSection: (section: "licenses" | "activations") => void;
  setActivationQuery: (query: string) => void;
  setAppFilter: (filter: string) => void;
  setNewAppName: (name: string) => void;
  setCreateLicenseOpen: (open: boolean) => void;
  setCreateLockedLicenseOpen: (open: boolean) => void;
  setCreateLicenseAppId: (appId: string) => void;
  setCreateLicenseMax: (max: string) => void;
  setCreateLockedLicenseAppId: (appId: string) => void;
  setLockedMachineId: (machineId: string) => void;
  setCreateLockedLicenseMax: (max: string) => void;
  setCreatedLockedLicenseKey: (key: string) => void;
  setEditingApp: (app: EditAppState | null) => void;
  setEditingLicense: (license: EditLicenseState | null) => void;
  setAppToDelete: (app: ManagedApp | null) => void;
  setLicenseToDelete: (license: License | null) => void;
  setLicenseToRevoke: (license: License | null) => void;
  setActivationToRevoke: (activation: Activation | null) => void;
  setActivationToDelete: (activation: Activation | null) => void;
  handleSectionChange: (section: "licenses" | "activations") => void;
  onRemoveApp: (
    removeApp: (id: string) => Promise<void>,
  ) => (id: string) => Promise<void>;
  onChangeLicenseStatus: (
    changeLicenseStatus: (
      id: string,
      nextStatus: "active" | "revoked",
    ) => Promise<void>,
  ) => (id: string, nextStatus: "active" | "revoked") => Promise<void>;
  onApproveActivation: (
    changeStatus: (id: string, action: "approve" | "revoke") => Promise<void>,
  ) => (id: string) => Promise<void>;
  onRevokeActivation: (
    changeStatus: (id: string, action: "approve" | "revoke") => Promise<void>,
  ) => (id: string) => Promise<void>;
  onDeleteActivation: (
    deleteActivation: (id: string) => Promise<void>,
  ) => (id: string) => Promise<void>;
  handleFilterChange: (filter: string, callback: (value: ActivationFilter) => void) => void;
  handleQueryChange: (query: string) => void;
  resetCreateLockedLicense: () => void;
  openLockedLicenseFromActivation: (activation: Activation, apps: ManagedApp[]) => void;
  handleSubmitEditApp: (
    event: FormEvent,
    onUpdateApp: (
      id: string,
      input: { name?: string; status?: "active" | "inactive" },
    ) => Promise<void>,
  ) => Promise<void>;
  handleSubmitEditLicense: (
    event: FormEvent,
    onUpdateLicense: (
      id: string,
      input: { maxActivations?: number; status?: "active" | "revoked" },
    ) => Promise<void>,
  ) => Promise<void>;
  handleCreateApp: (
    createNewApp: (name: string) => Promise<boolean>,
  ) => Promise<void>;
  handleCreateLicense: (
    apps: ManagedApp[],
    createNewLicense: (input: {
      appName: string;
      maxActivations: number;
      lockedMachineId?: string;
    }) => Promise<unknown>,
  ) => Promise<void>;
  handleCreateLockedLicense: (
    apps: ManagedApp[],
    createNewLicense: (input: {
      appName: string;
      maxActivations: number;
      lockedMachineId?: string;
    }) => Promise<unknown>,
  ) => Promise<void>;
}

export const useLicensingStore = create<LicensingStore>((set) => ({
  section: "licenses",
  activationQuery: "",
  appFilter: "",
  newAppName: "",
  createLicenseOpen: false,
  createLockedLicenseOpen: false,
  createLicenseAppId: "",
  createLicenseMax: "1",
  createLockedLicenseAppId: "",
  lockedMachineId: "",
  createLockedLicenseMax: "1",
  createdLockedLicenseKey: "",
  editingApp: null,
  editingLicense: null,
  appToDelete: null,
  licenseToDelete: null,
  licenseToRevoke: null,
  activationToRevoke: null,
  activationToDelete: null,


  setSection: (section) => set({ section }),
  setActivationQuery: (query) => set({ activationQuery: query }),
  setAppFilter: (filter) => set({ appFilter: filter }),
  setNewAppName: (name) => set({ newAppName: name }),
  setCreateLicenseOpen: (open) => set({ createLicenseOpen: open }),
  setCreateLockedLicenseOpen: (open) => set({ createLockedLicenseOpen: open }),
  setCreateLicenseAppId: (appId) => set({ createLicenseAppId: appId }),
  setCreateLicenseMax: (max) => set({ createLicenseMax: max }),
  setCreateLockedLicenseAppId: (appId) => set({ createLockedLicenseAppId: appId }),
  setLockedMachineId: (machineId) => set({ lockedMachineId: machineId }),
  setCreateLockedLicenseMax: (max) => set({ createLockedLicenseMax: max }),
  setCreatedLockedLicenseKey: (key) => set({ createdLockedLicenseKey: key }),
  setEditingApp: (app) => set({ editingApp: app }),
  setEditingLicense: (license) => set({ editingLicense: license }),
  setAppToDelete: (app) => set({ appToDelete: app }),
  setLicenseToDelete: (license) => set({ licenseToDelete: license }),
  setLicenseToRevoke: (license) => set({ licenseToRevoke: license }),
  setActivationToRevoke: (activation) => set({ activationToRevoke: activation }),
  setActivationToDelete: (activation) => set({ activationToDelete: activation }),

  handleSectionChange: (section) => set({ section }),

  onRemoveApp: (removeApp) => async (id) => {
    await removeApp(id);
    set({ appToDelete: null });
  },

  onChangeLicenseStatus: (changeLicenseStatus) => async (id, nextStatus) => {
    await changeLicenseStatus(id, nextStatus);
    set({ licenseToRevoke: null });
  },

  onApproveActivation: (changeStatus) => async (id) => {
    await changeStatus(id, "approve");
    set({ activationToRevoke: null });
  },

  onRevokeActivation: (changeStatus) => async (id) => {
    await changeStatus(id, "revoke");
    set({ activationToRevoke: null });
  },

  onDeleteActivation: (deleteActivation) => async (id) => {
    await deleteActivation(id);
    set({ activationToDelete: null });
  },

  handleFilterChange: (newFilter, callback) => {
    callback(newFilter as ActivationFilter);
  },

  handleQueryChange: (newQuery) => {
    set({ activationQuery: newQuery });
  },

  resetCreateLockedLicense: () => {
    set({
      createLockedLicenseAppId: "",
      createLockedLicenseMax: "1",
      lockedMachineId: "",
      createdLockedLicenseKey: "",
    });
  },

  openLockedLicenseFromActivation: (activation, apps) => {
    const matchingApp = apps.find((app) => app.name === activation.appName);
    set({
      createLockedLicenseAppId: matchingApp?.id || "",
      lockedMachineId: activation.machineId,
      createLockedLicenseMax: "1",
      createdLockedLicenseKey: "",
      createLockedLicenseOpen: true,
    });
  },

  handleSubmitEditApp: async (event, onUpdateApp) => {
    event.preventDefault();
    const { editingApp } = useLicensingStore.getState();
    if (!editingApp) return;
    const name = editingApp.name.trim();
    if (!name) return;
    await onUpdateApp(editingApp.id, { name, status: editingApp.status });
    set({ editingApp: null });
  },

  handleSubmitEditLicense: async (event, onUpdateLicense) => {
    event.preventDefault();
    const { editingLicense } = useLicensingStore.getState();
    if (!editingLicense) return;
    const maxActivations = Number(editingLicense.maxActivations);
    if (Number.isNaN(maxActivations) || maxActivations < 1) return;
    await onUpdateLicense(editingLicense.id, {
      maxActivations,
      status: editingLicense.status,
    });
    set({ editingLicense: null });
  },

  handleCreateApp: async (_createNewApp) => {
    const { newAppName } = useLicensingStore.getState();
    if (!newAppName.trim()) return;
    const result = await _createNewApp(newAppName.trim());
    if (result) {
      set({ newAppName: "" });
    }
  },

  handleCreateLicense: async (apps, createNewLicense) => {
    const { createLicenseAppId, createLicenseMax } = useLicensingStore.getState();
    const app = apps.find((a: ManagedApp) => a.id === createLicenseAppId);
    if (!app || !createLicenseAppId) return;
    const max = Number(createLicenseMax);
    if (Number.isNaN(max) || max < 1) return;
    await createNewLicense({ appName: app.name, maxActivations: max });
    set({ createLicenseOpen: false });
  },

  handleCreateLockedLicense: async (apps, createNewLicense) => {
    const {
      createLockedLicenseAppId,
      createLockedLicenseMax,
      lockedMachineId,
    } = useLicensingStore.getState();
    const app = apps.find((a: ManagedApp) => a.id === createLockedLicenseAppId);
    if (!app || !createLockedLicenseAppId || !lockedMachineId.trim()) return;
    const max = Number(createLockedLicenseMax);
    if (Number.isNaN(max) || max < 1) return;
    await createNewLicense({
      appName: app.name,
      maxActivations: max,
      lockedMachineId: lockedMachineId.trim(),
    });
    set({ createLockedLicenseOpen: false });
  },
}));

export function useLicensingStoreInitFilter(
  _onActivationFilterChange: (value: ActivationFilter) => void,
): void {
  // No-op: the callback is now passed directly to handleFilterChange,
  // avoiding any store state updates that could trigger setState-during-render.
}
