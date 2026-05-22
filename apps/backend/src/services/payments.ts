import path from "node:path";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db/db";
import { invoices, payments } from "../db/auth-schema";
import { renderReceiptPdf } from "./payment-pdf-renderer";

export type PaymentMethod = "cash" | "bank_transfer" | "card";

function toAmountCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export async function listPaymentsByInvoice(invoiceId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(asc(payments.paymentDate));
}

export async function recordPayment(
  userId: string,
  invoiceId: string,
  input: {
    amount: number;
    paymentMethod?: PaymentMethod;
    paymentDate?: string;
    notes?: string;
  },
) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId), eq(invoices.isDeleted, false)));
  if (!invoice) return { ok: false as const, error: "Invoice not found" };

  if (input.amount <= 0) return { ok: false as const, error: "Payment amount must be positive" };

  const amountCents = toAmountCents(input.amount);
  const id = crypto.randomUUID();

  await db.insert(payments).values({
    id,
    userId,
    invoiceId,
    amount: amountCents,
    paymentMethod: input.paymentMethod || null,
    paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
    notes: input.notes?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [totals] = await db
    .select({
      totalPaid: sql<number>`COALESCE(SUM(${payments.amount}), 0)`.mapWith(Number),
    })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));

  const newPaidAmount = Math.min(totals?.totalPaid || 0, invoice.totalAmount);
  const nextStatus =
    newPaidAmount >= invoice.totalAmount
      ? "paid"
      : newPaidAmount > 0
        ? "partially_paid"
        : invoice.status;

  await db
    .update(invoices)
    .set({
      paidAmount: newPaidAmount,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  const [created] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id));

  if (created) {
    try {
      const filePath = await renderReceiptPdf(id);
      const relativePath = path.relative(process.cwd(), filePath);
      await db
        .update(payments)
        .set({
          receiptPdfUrl: relativePath,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, id));
      created.receiptPdfUrl = relativePath;
    } catch {
      // Receipt PDF generation is best-effort; payment is still recorded.
    }
  }

  return { ok: true as const, payment: created };
}

export async function deletePayment(userId: string, paymentId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.id, paymentId)));
  if (!payment) return { ok: false as const, error: "Payment not found" };

  const invoiceId = payment.invoiceId;

  await db
    .delete(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)));

  const [totals] = await db
    .select({
      totalPaid: sql<number>`COALESCE(SUM(${payments.amount}), 0)`.mapWith(Number),
    })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId));

  if (invoice) {
    const newPaidAmount = totals?.totalPaid || 0;
    const nextStatus =
      newPaidAmount >= invoice.totalAmount
        ? "paid"
        : newPaidAmount > 0
          ? "partially_paid"
          : "draft";

    await db
      .update(invoices)
      .set({
        paidAmount: newPaidAmount,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));
  }

  return { ok: true as const };
}
