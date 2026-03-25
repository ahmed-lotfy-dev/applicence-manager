import type {
  BillingStats,
  Invoice,
  InvoicePdfJob,
} from "../../features/dashboard/types/dashboard";
import { apiRequest, apiUrl, getErrorMessage, parseJsonResponse } from "./base";

export async function fetchInvoices(): Promise<Invoice[] | null> {
  const response = await apiRequest("/invoices");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch invoices");

  const data = await parseJsonResponse<{ invoices?: Invoice[] }>(response);
  return data?.invoices || [];
}

export async function createInvoice(input: {
  clientId: string;
  invoiceNo?: string;
  totalAmount: number;
  paidAmount?: number;
  currency?: string;
  invoiceLanguage?: "en" | "ar";
  status?: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
  dueDate?: string;
  notes?: string;
}): Promise<Invoice | null> {
  const response = await apiRequest("/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to create invoice");

  const data = await parseJsonResponse<{ invoice?: Invoice }>(response);
  return data?.invoice || null;
}

export async function fetchNextInvoiceNo(): Promise<string | null> {
  const response = await apiRequest("/invoices/next-number");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch next invoice number");

  const data = await parseJsonResponse<{ invoiceNo?: string }>(response);
  return data?.invoiceNo || null;
}

export async function updateInvoice(
  id: string,
  input: {
    status?: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
    totalAmount?: number;
    paidAmount?: number;
    invoiceLanguage?: "en" | "ar";
  },
): Promise<boolean> {
  const response = await apiRequest(`/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (response.status === 401) return false;
  if (!response.ok) throw new Error("Failed to update invoice");
  return true;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const response = await apiRequest(`/invoices/${id}`, {
    method: "DELETE",
  });
  if (response.status === 401) return false;
  if (!response.ok) throw new Error("Failed to delete invoice");
  return true;
}

export async function archiveInvoice(id: string): Promise<boolean> {
  const response = await apiRequest(`/invoices/${id}/archive`, {
    method: "PATCH",
  });
  if (response.status === 401) return false;
  if (!response.ok)
    throw new Error(
      await getErrorMessage(response, "Failed to archive invoice"),
    );
  return true;
}

export async function restoreInvoice(id: string): Promise<Invoice | null> {
  const response = await apiRequest(`/invoices/${id}/restore`, {
    method: "PATCH",
  });
  if (response.status === 401) return null;
  if (!response.ok)
    throw new Error(
      await getErrorMessage(response, "Failed to restore invoice"),
    );
  const data = await parseJsonResponse<{ invoice?: Invoice }>(response);
  return data?.invoice || null;
}

export async function fetchBillingStats(): Promise<BillingStats | null> {
  const response = await apiRequest("/invoices/stats");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch billing stats");

  const data = await parseJsonResponse<{ stats?: BillingStats }>(response);
  return (
    data?.stats || {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalCount: 0,
    }
  );
}

export async function queueInvoicePdf(
  invoiceId: string,
): Promise<InvoicePdfJob | null> {
  const response = await apiRequest(`/invoices/${invoiceId}/generate-pdf`, {
    method: "POST",
  });
  if (response.status === 401) return null;
  if (!response.ok && response.status !== 202)
    throw new Error("Failed to queue invoice PDF");

  const data = await parseJsonResponse<{ job?: InvoicePdfJob }>(response);
  return data?.job || null;
}

export async function fetchInvoicePdfStatus(
  invoiceId: string,
): Promise<InvoicePdfJob | null> {
  const response = await apiRequest(`/invoices/${invoiceId}/pdf-status`);
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch invoice PDF status");

  const data = await parseJsonResponse<{ job?: InvoicePdfJob | null }>(
    response,
  );
  return data?.job || null;
}

export function buildInvoicePdfUrl(invoiceId: string): string {
  return apiUrl(`/invoices/${invoiceId}/pdf`);
}

export async function sendInvoiceEmail(invoiceId: string): Promise<boolean> {
  const response = await apiRequest(`/invoices/${invoiceId}/send-email`, {
    method: "POST",
  });
  if (response.status === 401) return false;
  if (!response.ok)
    throw new Error(
      await getErrorMessage(response, "Failed to send invoice email"),
    );
  return true;
}
