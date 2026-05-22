import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "../db/db";
import { clients, freelancerProfiles, invoicePdfJobs, invoices } from "../db/auth-schema";

type PdfJobStatus = "pending" | "processing" | "completed" | "failed";

export async function getLatestInvoicePdfJob(userId: string, invoiceId: string) {
  const rows = await db
    .select()
    .from(invoicePdfJobs)
    .where(and(eq(invoicePdfJobs.userId, userId), eq(invoicePdfJobs.invoiceId, invoiceId)))
    .orderBy(desc(invoicePdfJobs.createdAt));
  return rows[0] ?? null;
}

export async function enqueueInvoicePdfJob(userId: string, invoiceId: string) {
  const [invoice] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId)));
  if (!invoice) return { ok: false as const, error: "Invoice not found" };

  const latest = await getLatestInvoicePdfJob(userId, invoiceId);
  if (latest && (latest.status === "pending" || latest.status === "processing")) {
    return { ok: true as const, job: latest };
  }

  const jobId = crypto.randomUUID();
  await db.insert(invoicePdfJobs).values({
    id: jobId,
    userId,
    invoiceId,
    status: "pending",
    attempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await getLatestInvoicePdfJob(userId, invoiceId);
  if (!created) return { ok: false as const, error: "Failed to queue invoice PDF job" };
  return { ok: true as const, job: created };
}

export async function getInvoicePdfJobById(id: string) {
  const [job] = await db.select().from(invoicePdfJobs).where(eq(invoicePdfJobs.id, id));
  return job ?? null;
}

const MAX_PROCESSING_SECONDS = 60;

export async function claimNextPendingPdfJob() {
  const staleThreshold = new Date(Date.now() - MAX_PROCESSING_SECONDS * 1000);

  await db
    .update(invoicePdfJobs)
    .set({
      status: "failed",
      errorMessage: "Job timed out (stale processing)",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(invoicePdfJobs.status, "processing"),
        lt(invoicePdfJobs.updatedAt, staleThreshold),
      ),
    );

  const pendingRows = await db
    .select()
    .from(invoicePdfJobs)
    .where(eq(invoicePdfJobs.status, "pending"))
    .orderBy(desc(invoicePdfJobs.createdAt));
  const pending = pendingRows[0];
  if (!pending) return null;

  await db
    .update(invoicePdfJobs)
    .set({
      status: "processing",
      attempts: pending.attempts + 1,
      updatedAt: new Date(),
      errorMessage: null,
    })
    .where(and(eq(invoicePdfJobs.id, pending.id), eq(invoicePdfJobs.status, "pending")));

  return getInvoicePdfJobById(pending.id);
}

export async function markInvoicePdfJobStatus(
  id: string,
  status: PdfJobStatus,
  input?: { outputPath?: string; errorMessage?: string },
) {
  await db
    .update(invoicePdfJobs)
    .set({
      status,
      outputPath: input?.outputPath ?? null,
      errorMessage: input?.errorMessage ?? null,
      completedAt: status === "completed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(invoicePdfJobs.id, id));
}

export async function getInvoicePdfData(userId: string, invoiceId: string) {
  const rows = await db
    .select({
      invoiceId: invoices.id,
      invoiceNo: invoices.invoiceNo,
      status: invoices.status,
      currency: invoices.currency,
      invoiceLanguage: invoices.invoiceLanguage,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      dueDate: invoices.dueDate,
      issuedAt: invoices.issuedAt,
      invoiceNotes: invoices.notes,
      clientName: clients.name,
      clientEmail: clients.email,
      clientPhone: clients.phone,
      businessName: freelancerProfiles.businessName,
      logoUrl: freelancerProfiles.logoUrl,
      logoObjectKey: freelancerProfiles.logoObjectKey,
      contactEmail: freelancerProfiles.contactEmail,
      contactPhone: freelancerProfiles.contactPhone,
      addressLine1: freelancerProfiles.addressLine1,
      addressLine2: freelancerProfiles.addressLine2,
      taxId: freelancerProfiles.taxId,
    })
    .from(invoices)
    .leftJoin(clients, eq(clients.id, invoices.clientId))
    .leftJoin(freelancerProfiles, eq(freelancerProfiles.userId, invoices.userId))
    .where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId)));

  return rows[0] ?? null;
}
