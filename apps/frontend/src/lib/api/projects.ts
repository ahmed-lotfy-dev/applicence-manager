import { apiRequest, apiUrl } from "./base";

export async function fetchProjects(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiRequest(`/projects${query}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Failed to fetch projects (${res.status})`);
  }
  const data = await res.json();
  return (data?.projects ?? []).map((p: any) => ({ ...p, _v: "v3" }));
}

export async function fetchProjectDetail(id: string) {
  const res = await apiRequest(`/projects/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Project not found");
  }
  const data = await res.json();
  return data ?? null;
}

export async function createProject(input: {
  clientId: string;
  name: string;
  description?: string;
  projectType?: "milestone" | "standard";
  totalAmount: number;
  status?: string;
  notes?: string;
}) {
  const res = await apiRequest("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to create project");
  }
  const data = await res.json();
  return data?.project ?? null;
}

export async function updateProject(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    totalAmount?: number;
    status?: string;
    notes?: string | null;
  },
) {
  const res = await apiRequest(`/projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return res.ok;
}

export async function archiveProject(id: string) {
  const res = await apiRequest(`/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function fetchProjectStats() {
  const res = await apiRequest("/projects/stats");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.stats ?? null;
}

export async function addMilestone(
  projectId: string,
  input: {
    name: string;
    description?: string;
    amount: number;
    dueDate?: string;
  },
) {
  const res = await apiRequest(`/projects/${encodeURIComponent(projectId)}/milestones`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.milestone ?? null;
}

export async function removeMilestone(projectId: string, milestoneId: string) {
  const res = await apiRequest(
    `/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}`,
    { method: "DELETE" },
  );
  return res.ok;
}

export async function generateInvoiceFromMilestone(
  projectId: string,
  milestoneId: string,
  invoiceNo?: string,
) {
  const res = await apiRequest(
    `/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}/generate-invoice`,
    {
      method: "POST",
      body: JSON.stringify({ invoiceNo }),
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.invoice ?? null;
}

export async function fetchPayments(invoiceId: string) {
  const res = await apiRequest(`/invoices/${encodeURIComponent(invoiceId)}/payments`);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.payments ?? [];
}

export async function recordPayment(
  invoiceId: string,
  input: {
    amount: number;
    paymentMethod?: string;
    paymentDate?: string;
    notes?: string;
  },
) {
  const res = await apiRequest(`/invoices/${encodeURIComponent(invoiceId)}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.payment ?? null;
}

export async function deletePayment(paymentId: string) {
  const res = await apiRequest(`/payments/${encodeURIComponent(paymentId)}`, {
    method: "DELETE",
  });
  return res.ok;
}

export function buildReceiptPdfUrl(invoiceId: string, paymentId: string): string {
  return apiUrl(`/invoices/${encodeURIComponent(invoiceId)}/payments/${encodeURIComponent(paymentId)}/receipt-pdf`);
}
