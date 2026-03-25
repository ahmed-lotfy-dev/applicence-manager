import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  createLicense,
  createManagedApp,
  deleteActivation,
  deleteLicense,
  deleteManagedApp,
  fetchActivations,
  fetchApps,
  fetchLicenses,
  fetchStats,
  setLicenseStatus,
  updateActivationStatus,
  updateLicense,
  updateManagedApp,
} from "../../../lib/api-client";
import type {
  Activation,
  License,
  ManagedApp,
  Stats,
} from "../types/dashboard";

class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

function requireAuthValue<T>(value: T | null): T {
  if (value === null) throw new UnauthorizedError();
  return value;
}

export function useLicensingData(onUnauthorized: () => void) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [licenseActionLoadingId, setLicenseActionLoadingId] = useState<
    string | null
  >(null);
  const [appActionLoadingId, setAppActionLoadingId] = useState<string | null>(
    null,
  );

  const onQueryError = useCallback(
    (queryError: unknown, fallback: string) => {
      if (queryError instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      if (queryError instanceof Error) {
        setError(queryError.message || fallback);
      } else {
        setError(fallback);
      }
    },
    [onUnauthorized],
  );

  const queryKeys = {
    activations: ["dashboard", "activations"] as const,
    stats: ["dashboard", "stats"] as const,
    apps: ["dashboard", "apps"] as const,
    licenses: (filter: string) => ["dashboard", "licenses", filter] as const,
  };

  const activationsQuery = useQuery({
    queryKey: queryKeys.activations,
    queryFn: async () => requireAuthValue(await fetchActivations()),
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => requireAuthValue(await fetchStats()),
  });

  const appsQuery = useQuery({
    queryKey: queryKeys.apps,
    queryFn: async () => requireAuthValue(await fetchApps()),
  });

  const licensesQuery = useQuery({
    queryKey: queryKeys.licenses(licenseFilter),
    queryFn: async () => requireAuthValue(await fetchLicenses(licenseFilter)),
  });

  const createLicenseMutation = useMutation({ mutationFn: createLicense });
  const createAppMutation = useMutation({ mutationFn: createManagedApp });

  const changeStatus = useCallback(
    async (id: string, action: "approve" | "revoke") => {
      setActionLoadingId(id);
      setError("");
      try {
        const ok = await updateActivationStatus(id, action);
        if (!ok) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.activations }),
          queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
          queryClient.invalidateQueries({
            queryKey: ["dashboard", "licenses"],
          }),
        ]);
      } catch (mutationError) {
        onQueryError(
          mutationError,
          `Could not ${action} activation right now.`,
        );
      } finally {
        setActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  const deleteActivationFn = useCallback(
    async (id: string) => {
      setActionLoadingId(id);
      setError("");
      try {
        const ok = await deleteActivation(id);
        if (!ok) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.activations }),
          queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
        ]);
      } catch (mutationError) {
        onQueryError(mutationError, "Could not delete activation right now.");
      } finally {
        setActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  const createNewLicense = useCallback(
    async (input: {
      appName: string;
      maxActivations: number;
      lockedMachineId?: string;
    }) => {
      setError("");
      try {
        const created = await createLicenseMutation.mutateAsync(input);
        if (!created) throw new UnauthorizedError();
        await queryClient.invalidateQueries({
          queryKey: ["dashboard", "licenses"],
        });
        return created;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not create license right now.");
        return null;
      }
    },
    [createLicenseMutation, onQueryError, queryClient],
  );

  const createNewApp = useCallback(
    async (name: string) => {
      setError("");
      try {
        const ok = await createAppMutation.mutateAsync(name);
        if (!ok) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.apps }),
          queryClient.invalidateQueries({
            queryKey: ["dashboard", "licenses"],
          }),
        ]);
        return true;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not create app right now.");
        return false;
      }
    },
    [createAppMutation, onQueryError, queryClient],
  );

  const updateApp = useCallback(
    async (
      id: string,
      input: { name?: string; status?: "active" | "inactive" },
    ) => {
      setAppActionLoadingId(id);
      setError("");
      try {
        const ok = await updateManagedApp(id, input);
        if (!ok) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.apps }),
          queryClient.invalidateQueries({
            queryKey: ["dashboard", "licenses"],
          }),
        ]);
      } catch (mutationError) {
        onQueryError(mutationError, "Could not update app right now.");
      } finally {
        setAppActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  const removeApp = useCallback(
    async (id: string) => {
      setAppActionLoadingId(id);
      setError("");
      try {
        const ok = await deleteManagedApp(id);
        if (!ok) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.apps }),
          queryClient.invalidateQueries({
            queryKey: ["dashboard", "licenses"],
          }),
        ]);
      } catch (mutationError) {
        onQueryError(mutationError, "Could not delete app right now.");
      } finally {
        setAppActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  const updateExistingLicense = useCallback(
    async (
      id: string,
      input: { maxActivations?: number; status?: "active" | "revoked" },
    ) => {
      setLicenseActionLoadingId(id);
      setError("");
      try {
        const ok = await updateLicense(id, input);
        if (!ok) throw new UnauthorizedError();
        await queryClient.invalidateQueries({
          queryKey: ["dashboard", "licenses"],
        });
      } catch (mutationError) {
        onQueryError(mutationError, "Could not update license right now.");
      } finally {
        setLicenseActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  const removeLicense = useCallback(
    async (id: string) => {
      setLicenseActionLoadingId(id);
      setError("");
      try {
        const ok = await deleteLicense(id);
        if (!ok) throw new UnauthorizedError();
        await queryClient.invalidateQueries({
          queryKey: ["dashboard", "licenses"],
        });
      } catch (mutationError) {
        onQueryError(mutationError, "Could not delete license right now.");
      } finally {
        setLicenseActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  const changeLicenseStatusFn = useCallback(
    async (id: string, nextStatus: "active" | "revoked") => {
      setLicenseActionLoadingId(id);
      setError("");
      try {
        const ok = await setLicenseStatus(id, nextStatus);
        if (!ok) throw new UnauthorizedError();
        await queryClient.invalidateQueries({
          queryKey: ["dashboard", "licenses"],
        });
      } catch (mutationError) {
        onQueryError(mutationError, "Could not change license status.");
      } finally {
        setLicenseActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  return {
    activations: activationsQuery.data || [],
    licenses: licensesQuery.data || [],
    apps: appsQuery.data || [],
    stats: statsQuery.data || { total: 0, active: 0, pending: 0, revoked: 0 },
    loading:
      activationsQuery.isLoading ||
      statsQuery.isLoading ||
      appsQuery.isLoading ||
      licensesQuery.isLoading,
    error,
    setError,
    licenseFilter,
    setLicenseFilter,
    actionLoadingId,
    licenseActionLoadingId,
    appActionLoadingId,
    isCreatingLicense: createLicenseMutation.isPending,
    isCreatingApp: createAppMutation.isPending,
    changeStatus,
    deleteActivation: deleteActivationFn,
    createNewLicense,
    createNewApp,
    updateApp,
    removeApp,
    updateExistingLicense,
    removeLicense,
    changeLicenseStatus: changeLicenseStatusFn,
    activationsQuery,
    statsQuery,
    appsQuery,
    licensesQuery,
  };
}
