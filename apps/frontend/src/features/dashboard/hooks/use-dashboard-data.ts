import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  archiveClient,
  archiveInvoice,
  buildInvoicePdfUrl,
  createClient,
  createInvoice,
  createLicense,
  createManagedApp,
  deleteClient,
  deleteInvoice,
  deleteLicense,
  deleteManagedApp,
  deleteActivation,
  fetchActivations,
  fetchApps,
  fetchBillingStats,
  fetchClients,
  fetchFreelancerProfile,
  fetchInvoicePdfStatus,
  fetchInvoices,
  fetchLicenses,
  fetchStats,
  fetchUserEmail,
  queueInvoicePdf,
  restoreClient,
  restoreInvoice,
  sendInvoiceEmail,
  setLicenseStatus,
  uploadFreelancerLogo,
  updateFreelancerProfile,
  updateInvoice,
  updateLicense,
  updateManagedApp,
  updateActivationStatus,
  updateClient,
} from "../../../lib/api-client";
import type {
  Activation,
  BillingStats,
  Client,
  FreelancerProfile,
  Invoice,
  InvoicePdfJob,
  License,
  ManagedApp,
  Stats,
} from "../types/dashboard";

interface UseDashboardDataResult {
  activations: Activation[];
  licenses: License[];
  apps: ManagedApp[];
  clients: Client[];
  invoices: Invoice[];
  freelancerProfile: FreelancerProfile | null;
  invoicePdfJobs: Record<string, InvoicePdfJob | null>;
  getInvoicePdfUrl: (invoiceId: string) => string;
  billingStats: BillingStats;
  stats: Stats;
  userEmail: string;
  nextInvoiceNo: string;
  loading: boolean;
  error: string;
  actionLoadingId: string | null;
  licenseActionLoadingId: string | null;
  isCreatingLicense: boolean;
  isCreatingApp: boolean;
  isCreatingClient: boolean;
  isCreatingInvoice: boolean;
  appActionLoadingId: string | null;
  licenseFilter: string;
  setLicenseFilter: (value: string) => void;
  refreshData: () => Promise<void>;
  changeStatus: (id: string, action: "approve" | "revoke") => Promise<void>;
  deleteActivation: (id: string) => Promise<void>;
  createNewLicense: (input: {
    appName: string;
    maxActivations: number;
    lockedMachineId?: string;
  }) => Promise<License | null>;
  createNewApp: (name: string) => Promise<boolean>;
  createNewClient: (input: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => Promise<Client | null>;
  removeClient: (id: string) => Promise<boolean>;
  restoreExistingClient: (id: string) => Promise<Client | null>;
  hardDeleteClient: (id: string) => Promise<{ ok: boolean; error?: string }>;
  updateExistingClient: (
    id: string,
    input: {
      name?: string;
      email?: string;
      phone?: string;
      notes?: string;
      status?: "active" | "inactive";
    },
  ) => Promise<Client | null>;
  createNewInvoice: (input: {
    clientId: string;
    invoiceNo: string;
    totalAmount: number;
    paidAmount?: number;
    currency?: string;
    dueDate?: string;
    notes?: string;
    invoiceLanguage?: "en" | "ar";
  }) => Promise<Invoice | null>;
  updateExistingInvoice: (
    id: string,
    input: {
      status?: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
      totalAmount?: number;
      paidAmount?: number;
    },
  ) => Promise<void>;
  removeInvoice: (id: string) => Promise<boolean>;
  restoreExistingInvoice: (id: string) => Promise<Invoice | null>;
  hardDeleteInvoice: (id: string) => Promise<{ ok: boolean; error?: string }>;
  saveFreelancerProfile: (input: {
    businessName?: string;
    contactEmail?: string;
    contactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    taxId?: string;
    defaultCurrency?: "USD" | "EUR" | "EGP" | "SAR" | "AED" | "GBP";
    defaultInvoiceLanguage?: "en" | "ar";
    appLanguage?: "en" | "ar";
  }) => Promise<FreelancerProfile | null>;
  uploadProfileLogo: (file: File) => Promise<FreelancerProfile | null>;
  queueInvoicePdfGeneration: (invoiceId: string) => Promise<void>;
  refreshInvoicePdfJob: (invoiceId: string) => Promise<void>;
  sendInvoiceToEmail: (invoiceId: string) => Promise<void>;
  updateApp: (
    id: string,
    input: { name?: string; status?: "active" | "inactive" },
  ) => Promise<void>;
  removeApp: (id: string) => Promise<void>;
  updateExistingLicense: (
    id: string,
    input: { maxActivations?: number; status?: "active" | "revoked" },
  ) => Promise<void>;
  removeLicense: (id: string) => Promise<void>;
  changeLicenseStatus: (
    id: string,
    nextStatus: "active" | "revoked",
  ) => Promise<void>;
}

class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

const EMPTY_STATS: Stats = { total: 0, active: 0, pending: 0, revoked: 0 };
const EMPTY_BILLING: BillingStats = {
  totalInvoiced: 0,
  totalPaid: 0,
  totalOutstanding: 0,
  totalCount: 0,
};

const queryKeys = {
  activations: ["dashboard", "activations"] as const,
  stats: ["dashboard", "stats"] as const,
  userEmail: ["dashboard", "userEmail"] as const,
  apps: ["dashboard", "apps"] as const,
  licenses: (filter: string) => ["dashboard", "licenses", filter] as const,
  clients: ["dashboard", "clients"] as const,
  invoices: ["dashboard", "invoices"] as const,
  billingStats: ["dashboard", "billingStats"] as const,
  freelancerProfile: ["dashboard", "freelancerProfile"] as const,
};

function requireAuthValue<T>(value: T | null): T {
  if (value === null) throw new UnauthorizedError();
  return value;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof UnauthorizedError) return "";
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useDashboardData(
  onUnauthorized: () => void,
): UseDashboardDataResult {
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
  const [invoicePdfJobs, setInvoicePdfJobs] = useState<
    Record<string, InvoicePdfJob | null>
  >({});
  const initializedPdfStatusRef = useRef<Set<string>>(new Set());

  const onQueryError = useCallback(
    (queryError: unknown, fallback: string) => {
      if (queryError instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      setError(getErrorMessage(queryError, fallback));
    },
    [onUnauthorized],
  );

  const activationsQuery = useQuery({
    queryKey: queryKeys.activations,
    queryFn: async () => requireAuthValue(await fetchActivations()),
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => requireAuthValue(await fetchStats()),
  });

  const userEmailQuery = useQuery({
    queryKey: queryKeys.userEmail,
    queryFn: async () => (await fetchUserEmail()) || "",
  });

  const appsQuery = useQuery({
    queryKey: queryKeys.apps,
    queryFn: async () => requireAuthValue(await fetchApps()),
  });

  const licensesQuery = useQuery({
    queryKey: queryKeys.licenses(licenseFilter),
    queryFn: async () => requireAuthValue(await fetchLicenses(licenseFilter)),
  });

  const clientsQuery = useQuery({
    queryKey: queryKeys.clients,
    queryFn: async () => requireAuthValue(await fetchClients()),
  });

  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices,
    queryFn: async () => requireAuthValue(await fetchInvoices()),
  });

  const billingStatsQuery = useQuery({
    queryKey: queryKeys.billingStats,
    queryFn: async () => requireAuthValue(await fetchBillingStats()),
  });

  const freelancerProfileQuery = useQuery({
    queryKey: queryKeys.freelancerProfile,
    queryFn: async () => await fetchFreelancerProfile(),
  });

  const createLicenseMutation = useMutation({ mutationFn: createLicense });
  const createAppMutation = useMutation({ mutationFn: createManagedApp });
  const createClientMutation = useMutation({ mutationFn: createClient });
  const createInvoiceMutation = useMutation({ mutationFn: createInvoice });
  const uploadProfileLogoMutation = useMutation({
    mutationFn: uploadFreelancerLogo,
  });
  const saveProfileMutation = useMutation({
    mutationFn: updateFreelancerProfile,
  });

  const pollInvoicePdfUntilTerminal = useCallback(
    async (invoiceId: string) => {
      for (let attempt = 0; attempt < 45; attempt += 1) {
        try {
          const job = await fetchInvoicePdfStatus(invoiceId);
          setInvoicePdfJobs((prev) => ({ ...prev, [invoiceId]: job }));
          if (!job || job.status === "completed" || job.status === "failed") {
            return;
          }
        } catch (pollError) {
          onQueryError(pollError, "Could not refresh invoice PDF status.");
          return;
        }
        await wait(2000);
      }
    },
    [onQueryError],
  );

  useEffect(() => {
    const rows = invoicesQuery.data || [];
    for (const invoice of rows) {
      if (initializedPdfStatusRef.current.has(invoice.id)) continue;
      initializedPdfStatusRef.current.add(invoice.id);
      void (async () => {
        try {
          const job = await fetchInvoicePdfStatus(invoice.id);
          setInvoicePdfJobs((prev) => ({ ...prev, [invoice.id]: job }));
          if (
            job &&
            (job.status === "pending" || job.status === "processing")
          ) {
            await pollInvoicePdfUntilTerminal(invoice.id);
          }
        } catch {
          // Ignore startup status failures for individual invoices.
        }
      })();
    }
  }, [invoicesQuery.data, pollInvoicePdfUntilTerminal]);

  const loading = useMemo(
    () =>
      activationsQuery.isLoading ||
      statsQuery.isLoading ||
      userEmailQuery.isLoading ||
      appsQuery.isLoading ||
      licensesQuery.isLoading ||
      clientsQuery.isLoading ||
      invoicesQuery.isLoading ||
      billingStatsQuery.isLoading ||
      freelancerProfileQuery.isLoading,
    [
      activationsQuery.isLoading,
      appsQuery.isLoading,
      billingStatsQuery.isLoading,
      clientsQuery.isLoading,
      freelancerProfileQuery.isLoading,
      invoicesQuery.isLoading,
      licensesQuery.isLoading,
      statsQuery.isLoading,
      userEmailQuery.isLoading,
    ],
  );

  const queryErrors = useMemo(
    () =>
      [
        activationsQuery.error,
        statsQuery.error,
        appsQuery.error,
        licensesQuery.error,
        clientsQuery.error,
        invoicesQuery.error,
        billingStatsQuery.error,
        freelancerProfileQuery.error,
      ].filter(Boolean),
    [
      activationsQuery.error,
      appsQuery.error,
      billingStatsQuery.error,
      clientsQuery.error,
      freelancerProfileQuery.error,
      invoicesQuery.error,
      licensesQuery.error,
      statsQuery.error,
    ],
  );

  useEffect(() => {
    if (queryErrors.length > 0) {
      onQueryError(queryErrors[0], "Failed to fetch dashboard data.");
    }
  }, [onQueryError, queryErrors]);

  const refreshData = useCallback(async () => {
    setError("");
    await Promise.all([
      queryClient.refetchQueries({ queryKey: queryKeys.activations }),
      queryClient.refetchQueries({ queryKey: queryKeys.stats }),
      queryClient.refetchQueries({ queryKey: queryKeys.userEmail }),
    ]);
  }, [queryClient]);

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

  const createNewClient = useCallback(
    async (input: {
      name: string;
      email?: string;
      phone?: string;
      notes?: string;
    }) => {
      setError("");
      try {
        const created = await createClientMutation.mutateAsync(input);
        if (!created) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return created;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not create client right now.");
        return null;
      }
    },
    [createClientMutation, onQueryError, queryClient],
  );

  const removeClient = useCallback(
    async (id: string) => {
      setError("");
      try {
        const ok = await archiveClient(id);
        if (!ok) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return true;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not archive client right now.");
        return false;
      }
    },
    [onQueryError, queryClient],
  );

  const restoreExistingClient = useCallback(
    async (id: string) => {
      setError("");
      try {
        const restored = await restoreClient(id);
        if (!restored) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return restored;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not restore client right now.");
        return null;
      }
    },
    [onQueryError, queryClient],
  );

  const hardDeleteExistingClient = useCallback(
    async (id: string) => {
      setError("");
      try {
        const ok = await deleteClient(id);
        if (!ok) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return { ok: true as const };
      } catch (mutationError) {
        const message =
          mutationError instanceof Error && mutationError.message
            ? mutationError.message
            : "Could not permanently delete client right now.";
        onQueryError(mutationError, message);
        return { ok: false as const, error: message };
      }
    },
    [onQueryError, queryClient],
  );

  const updateExistingClient = useCallback(
    async (
      id: string,
      input: {
        name?: string;
        email?: string;
        phone?: string;
        notes?: string;
        status?: "active" | "inactive";
      },
    ) => {
      setError("");
      try {
        const updated = await updateClient(id, input);
        if (!updated) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return updated;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not update client right now.");
        return null;
      }
    },
    [onQueryError, queryClient],
  );

  const createNewInvoice = useCallback(
    async (input: {
      clientId: string;
      invoiceNo: string;
      totalAmount: number;
      paidAmount?: number;
      currency?: string;
      dueDate?: string;
      notes?: string;
      invoiceLanguage?: "en" | "ar";
    }) => {
      setError("");
      try {
        const created = await createInvoiceMutation.mutateAsync(input);
        if (!created) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
          queryClient.invalidateQueries({ queryKey: queryKeys.billingStats }),
        ]);
        const job = await queueInvoicePdf(created.id);
        if (job) {
          setInvoicePdfJobs((prev) => ({ ...prev, [created.id]: job }));
          void pollInvoicePdfUntilTerminal(created.id);
        }
        return created;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not create invoice right now.");
        return null;
      }
    },
    [
      createInvoiceMutation,
      onQueryError,
      pollInvoicePdfUntilTerminal,
      queryClient,
    ],
  );

  const updateExistingInvoice = useCallback(
    async (
      id: string,
      input: {
        status?: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
        totalAmount?: number;
        paidAmount?: number;
      },
    ) => {
      setError("");
      try {
        const ok = await updateInvoice(id, input);
        if (!ok) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
          queryClient.invalidateQueries({ queryKey: queryKeys.billingStats }),
        ]);
      } catch (mutationError) {
        onQueryError(mutationError, "Could not update invoice right now.");
      }
    },
    [onQueryError, queryClient],
  );

  const removeInvoice = useCallback(
    async (id: string) => {
      setError("");
      try {
        const ok = await archiveInvoice(id);
        if (!ok) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
          queryClient.invalidateQueries({ queryKey: queryKeys.billingStats }),
        ]);
        return true;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not archive invoice right now.");
        return false;
      }
    },
    [onQueryError, queryClient],
  );

  const restoreExistingInvoice = useCallback(
    async (id: string) => {
      setError("");
      try {
        const restored = await restoreInvoice(id);
        if (!restored) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
          queryClient.invalidateQueries({ queryKey: queryKeys.billingStats }),
        ]);
        return restored;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not restore invoice right now.");
        return null;
      }
    },
    [onQueryError, queryClient],
  );

  const hardDeleteExistingInvoice = useCallback(
    async (id: string) => {
      setError("");
      try {
        const ok = await deleteInvoice(id);
        if (!ok) throw new UnauthorizedError();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
          queryClient.invalidateQueries({ queryKey: queryKeys.billingStats }),
        ]);
        return { ok: true as const };
      } catch (mutationError) {
        const message =
          mutationError instanceof Error && mutationError.message
            ? mutationError.message
            : "Could not permanently delete invoice right now.";
        onQueryError(mutationError, message);
        return { ok: false as const, error: message };
      }
    },
    [onQueryError, queryClient],
  );

  const saveFreelancerProfile = useCallback(
    async (input: {
      businessName?: string;
      contactEmail?: string;
      contactPhone?: string;
      addressLine1?: string;
      addressLine2?: string;
      taxId?: string;
      defaultCurrency?: "USD" | "EUR" | "EGP" | "SAR" | "AED" | "GBP";
      defaultInvoiceLanguage?: "en" | "ar";
      appLanguage?: "en" | "ar";
    }) => {
      setError("");
      try {
        const profile = await saveProfileMutation.mutateAsync(input);
        if (!profile) throw new Error("Profile save returned empty response.");
        queryClient.setQueryData(queryKeys.freelancerProfile, profile);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.freelancerProfile,
        });
        return profile;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not save profile right now.");
        return null;
      }
    },
    [onQueryError, queryClient, saveProfileMutation],
  );

  const uploadProfileLogo = useCallback(
    async (file: File) => {
      setError("");
      try {
        const profile = await uploadProfileLogoMutation.mutateAsync(file);
        if (!profile) throw new Error("Logo upload returned empty response.");
        queryClient.setQueryData(queryKeys.freelancerProfile, profile);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.freelancerProfile,
        });
        return profile;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not upload logo right now.");
        return null;
      }
    },
    [onQueryError, queryClient, uploadProfileLogoMutation],
  );

  const queueInvoicePdfGeneration = useCallback(
    async (invoiceId: string) => {
      setError("");
      try {
        const job = await queueInvoicePdf(invoiceId);
        if (!job) throw new UnauthorizedError();
        setInvoicePdfJobs((prev) => ({ ...prev, [invoiceId]: job }));
        void pollInvoicePdfUntilTerminal(invoiceId);
      } catch (mutationError) {
        onQueryError(mutationError, "Could not queue invoice PDF job.");
      }
    },
    [onQueryError, pollInvoicePdfUntilTerminal],
  );

  const refreshInvoicePdfJob = useCallback(
    async (invoiceId: string) => {
      setError("");
      try {
        const job = await fetchInvoicePdfStatus(invoiceId);
        setInvoicePdfJobs((prev) => ({ ...prev, [invoiceId]: job }));
      } catch (mutationError) {
        onQueryError(mutationError, "Could not refresh invoice PDF status.");
      }
    },
    [onQueryError],
  );

  const sendInvoiceToEmail = useCallback(
    async (invoiceId: string) => {
      setError("");
      try {
        const ok = await sendInvoiceEmail(invoiceId);
        if (!ok) throw new UnauthorizedError();
      } catch (mutationError) {
        onQueryError(mutationError, "Could not send invoice email.");
        throw mutationError;
      }
    },
    [onQueryError],
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
          queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
          queryClient.invalidateQueries({ queryKey: queryKeys.activations }),
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
          queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
          queryClient.invalidateQueries({ queryKey: queryKeys.activations }),
        ]);
      } catch (mutationError) {
        onQueryError(mutationError, "Could not remove app right now.");
      } finally {
        setAppActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  const changeLicenseStatus = useCallback(
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
        onQueryError(mutationError, `Could not set license to ${nextStatus}.`);
      } finally {
        setLicenseActionLoadingId(null);
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
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["dashboard", "licenses"],
          }),
          queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
          queryClient.invalidateQueries({ queryKey: queryKeys.activations }),
        ]);
      } catch (mutationError) {
        onQueryError(mutationError, "Could not remove license right now.");
      } finally {
        setLicenseActionLoadingId(null);
      }
    },
    [onQueryError, queryClient],
  );

  const nextInvoiceNo = useMemo(() => {
    const rows = invoicesQuery.data || [];
    let max = 0;
    for (const row of rows) {
      const match = row.invoiceNo?.trim().match(/(\d+)$/);
      if (!match) continue;
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > max) max = parsed;
    }
    return String(max + 1).padStart(3, "0");
  }, [invoicesQuery.data]);

  return {
    activations: activationsQuery.data || [],
    stats: statsQuery.data || EMPTY_STATS,
    licenses: licensesQuery.data || [],
    apps: appsQuery.data || [],
    clients: clientsQuery.data || [],
    invoices: invoicesQuery.data || [],
    freelancerProfile: freelancerProfileQuery.data || null,
    invoicePdfJobs,
    getInvoicePdfUrl: buildInvoicePdfUrl,
    billingStats: billingStatsQuery.data || EMPTY_BILLING,
    userEmail: userEmailQuery.data || "",
    nextInvoiceNo,
    loading,
    error,
    actionLoadingId,
    licenseActionLoadingId,
    isCreatingLicense: createLicenseMutation.isPending,
    isCreatingApp: createAppMutation.isPending,
    isCreatingClient: createClientMutation.isPending,
    isCreatingInvoice: createInvoiceMutation.isPending,
    appActionLoadingId,
    licenseFilter,
    setLicenseFilter,
    refreshData,
    changeStatus,
    deleteActivation: deleteActivationFn,
    createNewLicense,
    createNewApp,
    createNewClient,
    removeClient,
    restoreExistingClient,
    hardDeleteClient: hardDeleteExistingClient,
    updateExistingClient,
    createNewInvoice,
    updateExistingInvoice,
    removeInvoice,
    restoreExistingInvoice,
    hardDeleteInvoice: hardDeleteExistingInvoice,
    saveFreelancerProfile,
    uploadProfileLogo,
    queueInvoicePdfGeneration,
    refreshInvoicePdfJob,
    sendInvoiceToEmail,
    updateApp,
    removeApp,
    updateExistingLicense,
    removeLicense,
    changeLicenseStatus,
  };
}
