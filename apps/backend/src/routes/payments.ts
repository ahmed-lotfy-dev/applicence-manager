import path from "node:path";
import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { payments } from "../db/auth-schema";
import { getAuthenticatedUserId } from "../lib/request-auth";
import { deletePayment, listPaymentsByInvoice, recordPayment } from "../services/payments";

export const paymentRoutes = new Elysia({
  name: "payment-routes",
  prefix: "/api/invoices/:id/payments",
})
  .get("/", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const rows = await listPaymentsByInvoice(params.id);
    return { payments: rows };
  })
  .post(
    "/",
    async ({ request, params, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await recordPayment(userId, params.id, body as {
        amount: number;
        paymentMethod?: "cash" | "bank_transfer" | "card";
        paymentDate?: string;
        notes?: string;
      });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, payment: result.payment };
    },
    {
      body: t.Object({
        amount: t.Number({ minimum: 0.01 }),
        paymentMethod: t.Optional(t.Union([t.Literal("cash"), t.Literal("bank_transfer"), t.Literal("card")])),
        paymentDate: t.Optional(t.String({ minLength: 4, maxLength: 40 })),
        notes: t.Optional(t.String({ maxLength: 2000 })),
      }),
    },
  )
  .delete("/:paymentId", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await deletePayment(userId, params.paymentId);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }
    return { success: true };
  })
  .get("/:paymentId/receipt-pdf", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, params.paymentId));
    if (!payment || payment.userId !== userId || !payment.receiptPdfUrl) {
      set.status = 404;
      return { error: "Receipt PDF not available" };
    }

    const filePath = path.resolve(process.cwd(), payment.receiptPdfUrl);
    const file = Bun.file(filePath);
    const exists = await file.exists();
    if (!exists) {
      set.status = 404;
      return { error: "Receipt PDF file missing" };
    }

    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${payment.id}.pdf"`,
      },
    });
  });
