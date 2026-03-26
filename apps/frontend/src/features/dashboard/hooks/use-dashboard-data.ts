import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useClientsData } from "./use-clients-data";
import { useInvoicesData } from "./use-invoices-data";
import { useLicensingData } from "./use-licensing-data";
import { useProfileData } from "./use-profile-data";

export function useDashboardData(onUnauthorized: () => void) {
  const queryClient = useQueryClient();

  const licensing = useLicensingData(onUnauthorized);
  const clients = useClientsData(onUnauthorized);
  const invoices = useInvoicesData(onUnauthorized);
  const profile = useProfileData(onUnauthorized);

  const loading = useMemo(
    () =>
      licensing.loading ||
      clients.loading ||
      invoices.loading ||
      profile.loading,
    [licensing.loading, clients.loading, invoices.loading, profile.loading],
  );

  const queryErrors = useMemo(
    () =>
      [
        licensing.licensesQuery?.error,
        licensing.statsQuery?.error,
        licensing.appsQuery?.error,
        licensing.activationsQuery?.error,
        clients.clientsQuery?.error,
        invoices.invoicesQuery?.error,
        invoices.billingStatsQuery?.error,
        profile.freelancerProfileQuery?.error,
        profile.userEmailQuery?.error,
      ].filter(Boolean),
    [licensing, clients, invoices, profile],
  );

  useEffect(() => {
    if (queryErrors.length > 0) {
      const error = queryErrors[0] as Error;
      licensing.setError(error.message || "Failed to fetch dashboard data.");
    }
  }, [licensing, queryErrors]);

  const refreshData = useCallback(async () => {
    licensing.setError("");
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["dashboard", "activations"] }),
      queryClient.refetchQueries({ queryKey: ["dashboard", "stats"] }),
      queryClient.refetchQueries({ queryKey: ["dashboard", "userEmail"] }),
    ]);
  }, [licensing, queryClient]);

  return {
    // State
    ...licensing,
    ...clients,
    ...invoices,
    ...profile,
    loading,
    error: licensing.error || clients.error || invoices.error || profile.error,
    refreshData,

    // Overrides/Aliases for compatibility
    actionLoadingId: licensing.actionLoadingId,
    licenseActionLoadingId: licensing.licenseActionLoadingId,
    appActionLoadingId: licensing.appActionLoadingId,
    isCreatingLicense: licensing.isCreatingLicense,
    isCreatingApp: licensing.isCreatingApp,
    isCreatingClient: clients.isCreatingClient,
    isCreatingInvoice: invoices.isCreatingInvoice,
  };
}
