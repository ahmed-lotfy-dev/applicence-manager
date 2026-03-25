import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  archiveInvoice,
  buildInvoicePdfUrl,
  createInvoice,
  deleteInvoice,
  fetchBillingStats,
  fetchInvoicePdfStatus,
  fetchInvoices,
  queueInvoicePdf,
  restoreInvoice,
  sendInvoiceEmail,
  updateInvoice,
} from "../../../lib/api-client";
import type { InvoicePdfJob } from "../types/dashboard";

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useInvoicesData(onUnauthorized: () => void) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
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
      if (queryError instanceof Error) {
        setError(queryError.message || fallback);
      } else {
        setError(fallback);
      }
    },
    [onUnauthorized],
  );

  const queryKeys = {
    invoices: ["dashboard", "invoices"] as const,
    billingStats: ["dashboard", "billingStats"] as const,
  };

  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices,
    queryFn: async () => requireAuthValue(await fetchInvoices()),
  });

  const billingStatsQuery = useQuery({
    queryKey: queryKeys.billingStats,
    queryFn: async () => requireAuthValue(await fetchBillingStats()),
  });

  const createInvoiceMutation = useMutation({ mutationFn: createInvoice });

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

  return {
    invoices: invoicesQuery.data || [],
    billingStats: billingStatsQuery.data || {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalCount: 0,
    },
    loading: invoicesQuery.isLoading || billingStatsQuery.isLoading,
    error,
    setError,
    invoicePdfJobs,
    getInvoicePdfUrl: buildInvoicePdfUrl,
    isCreatingInvoice: createInvoiceMutation.isPending,
    createNewInvoice,
    updateExistingInvoice,
    removeInvoice,
    restoreExistingInvoice,
    hardDeleteInvoice: hardDeleteExistingInvoice,
    queueInvoicePdfGeneration,
    refreshInvoicePdfJob,
    sendInvoiceToEmail,
    invoicesQuery,
  };
}
