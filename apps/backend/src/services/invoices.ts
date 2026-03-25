import { and, asc, eq, sql, sum } from "drizzle-orm";
import { db } from "../db/db";
import { clients, freelancerProfiles, invoices } from "../db/auth-schema";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue";
export type InvoiceLanguage = "en" | "ar";

export async function listInvoices(userId: string) {
  const rows = await db
    .select({
      id: invoices.id,
      userId: invoices.userId,
      clientId: invoices.clientId,
      clientName: clients.name,
      clientIsDeleted: clients.isDeleted,
      invoiceNo: invoices.invoiceNo,
      status: invoices.status,
      currency: invoices.currency,
      invoiceLanguage: invoices.invoiceLanguage,
      isDeleted: invoices.isDeleted,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      dueDate: invoices.dueDate,
      issuedAt: invoices.issuedAt,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
    })
    .from(invoices)
    .leftJoin(clients, eq(clients.id, invoices.clientId))
    .where(eq(invoices.userId, userId))
    .orderBy(asc(invoices.createdAt));

  return rows;
}

export async function getInvoiceById(userId: string, id: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.id, id)));
  return invoice ?? null;
}

function toAmountCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

function extractNumericSuffix(invoiceNo: string): number | null {
  const trimmed = invoiceNo.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getNextInvoiceNo(userId: string): Promise<string> {
  const rows = await db
    .select({ invoiceNo: invoices.invoiceNo })
    .from(invoices)
    .where(eq(invoices.userId, userId));

  let max = 0;
  for (const row of rows) {
    const value = extractNumericSuffix(row.invoiceNo);
    if (value !== null && value > max) max = value;
  }
  const next = max + 1;
  return String(next).padStart(3, "0");
}

export async function createInvoice(
  userId: string,
  input: {
    clientId: string;
    invoiceNo?: string;
    totalAmount: number;
    paidAmount?: number;
    currency?: string;
    invoiceLanguage?: InvoiceLanguage;
    status?: InvoiceStatus;
    dueDate?: string;
    issuedAt?: string;
    notes?: string;
  },
) {
  const clientId = input.clientId.trim();
  if (!clientId) {
    return { ok: false as const, error: "Client is required" };
  }
  if (input.totalAmount < 0 || (input.paidAmount ?? 0) < 0) {
    return { ok: false as const, error: "Amounts cannot be negative" };
  }

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.userId, userId), eq(clients.id, clientId), eq(clients.isDeleted, false)));
  if (!client) return { ok: false as const, error: "Client not found" };

  const invoiceNo = input.invoiceNo?.trim() || (await getNextInvoiceNo(userId));
  const [profile] = await db
    .select({
      defaultCurrency: freelancerProfiles.defaultCurrency,
      defaultInvoiceLanguage: freelancerProfiles.defaultInvoiceLanguage,
    })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.userId, userId));
  const id = crypto.randomUUID();
  await db.insert(invoices).values({
    id,
    userId,
    clientId,
    invoiceNo,
    status: input.status || "draft",
    currency: (input.currency || profile?.defaultCurrency || "USD").trim().toUpperCase(),
    invoiceLanguage:
      input.invoiceLanguage === "ar"
        ? "ar"
        : input.invoiceLanguage === "en"
          ? "en"
          : profile?.defaultInvoiceLanguage === "ar"
            ? "ar"
            : "en",
    isDeleted: false,
    totalAmount: toAmountCents(input.totalAmount),
    paidAmount: toAmountCents(input.paidAmount || 0),
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    issuedAt: input.issuedAt ? new Date(input.issuedAt) : new Date(),
    notes: input.notes?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await getInvoiceById(userId, id);
  if (!created) return { ok: false as const, error: "Failed to create invoice" };
  return { ok: true as const, invoice: created };
}

export async function updateInvoice(
  userId: string,
  id: string,
  input: {
    status?: InvoiceStatus;
    totalAmount?: number;
    paidAmount?: number;
    dueDate?: string | null;
    notes?: string;
    invoiceLanguage?: InvoiceLanguage;
  },
) {
  const existing = await getInvoiceById(userId, id);
  if (!existing) return { ok: false as const, error: "Invoice not found" };
  if (existing.isDeleted) return { ok: false as const, error: "Archived invoices cannot be edited" };
  if ((input.totalAmount ?? 0) < 0 || (input.paidAmount ?? 0) < 0) {
    return { ok: false as const, error: "Amounts cannot be negative" };
  }

  const totalAmountCents =
    input.totalAmount !== undefined
      ? toAmountCents(input.totalAmount)
      : existing.totalAmount;
  const paidAmountCents =
    input.paidAmount !== undefined ? toAmountCents(input.paidAmount) : existing.paidAmount;
  const nextStatus = input.status || (existing.status as InvoiceStatus);

  await db
    .update(invoices)
    .set({
      totalAmount: totalAmountCents,
      paidAmount: Math.min(paidAmountCents, totalAmountCents),
      status: nextStatus,
      dueDate:
        input.dueDate === undefined
          ? existing.dueDate
          : input.dueDate
            ? new Date(input.dueDate)
            : null,
      notes: input.notes !== undefined ? input.notes.trim() || null : existing.notes,
      invoiceLanguage: input.invoiceLanguage ?? (existing.invoiceLanguage as InvoiceLanguage),
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.userId, userId), eq(invoices.id, id)));

  const updated = await getInvoiceById(userId, id);
  if (!updated) return { ok: false as const, error: "Failed to update invoice" };
  return { ok: true as const, invoice: updated };
}

export async function deleteInvoice(userId: string, id: string) {
  const existing = await getInvoiceById(userId, id);
  if (!existing) return { ok: false as const, error: "Invoice not found" };

  if (existing.isDeleted) return { ok: false as const, error: "Invoice already archived" };

  await db
    .update(invoices)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.userId, userId), eq(invoices.id, id)));
  return { ok: true as const };
}

export async function restoreInvoice(userId: string, id: string) {
  const existing = await getInvoiceById(userId, id);
  if (!existing) return { ok: false as const, error: "Invoice not found" };
  if (!existing.isDeleted) return { ok: false as const, error: "Invoice is already active" };

  await db
    .update(invoices)
    .set({
      isDeleted: false,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.userId, userId), eq(invoices.id, id)));

  const restored = await getInvoiceById(userId, id);
  if (!restored) return { ok: false as const, error: "Failed to restore invoice" };
  return { ok: true as const, invoice: restored };
}

export async function hardDeleteInvoice(userId: string, id: string) {
  const existing = await getInvoiceById(userId, id);
  if (!existing) return { ok: false as const, error: "Invoice not found" };
  if (!existing.isDeleted) {
    return { ok: false as const, error: "Archive the invoice before deleting it permanently." };
  }

  await db.delete(invoices).where(and(eq(invoices.userId, userId), eq(invoices.id, id)));
  return { ok: true as const };
}

export async function getBillingStats(userId: string) {
  const [totals] = await db
    .select({
      totalInvoiced: sum(invoices.totalAmount),
      totalPaid: sum(invoices.paidAmount),
      totalCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(invoices)
    .where(eq(invoices.userId, userId));

  const totalInvoiced = Number(totals?.totalInvoiced || 0);
  const totalPaid = Number(totals?.totalPaid || 0);
  return {
    totalInvoiced,
    totalPaid,
    totalOutstanding: Math.max(totalInvoiced - totalPaid, 0),
    totalCount: Number(totals?.totalCount || 0),
  };
}
