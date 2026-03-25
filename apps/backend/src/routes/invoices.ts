import { Elysia, t } from "elysia";
import { getAuthenticatedUserId } from "../lib/request-auth";
import {
  createInvoice,
  deleteInvoice,
  hardDeleteInvoice,
  getBillingStats,
  getNextInvoiceNo,
  listInvoices,
  restoreInvoice,
  updateInvoice,
} from "../services/invoices";
import {
  enqueueInvoicePdfJob,
  getInvoicePdfData,
  getLatestInvoicePdfJob,
} from "../services/invoice-pdf-jobs";
import { sendInvoiceEmail } from "../services/invoice-email";

function buildInvoicePdfFilename(input: { invoiceNo?: string | null; issuedAt?: Date | string | null }) {
  const safeNo = (input.invoiceNo || "invoice").trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
  const date = input.issuedAt ? new Date(input.issuedAt) : null;
  const safeDate =
    date && !Number.isNaN(date.getTime())
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : null;
  return safeDate ? `${safeNo}-${safeDate}.pdf` : `${safeNo}.pdf`;
}

export const invoiceRoutes = new Elysia({
  name: "invoice-routes",
  prefix: "/api/invoices",
})
  .get("/", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const rows = await listInvoices(userId);
    return { invoices: rows };
  })
  .get("/stats", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const stats = await getBillingStats(userId);
    return { stats };
  })
  .get("/next-number", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const invoiceNo = await getNextInvoiceNo(userId);
    return { invoiceNo };
  })
  .post(
    "/",
    async ({ request, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await createInvoice(userId, body as {
        clientId: string;
        invoiceNo?: string;
        totalAmount: number;
        paidAmount?: number;
        currency?: string;
        invoiceLanguage?: "en" | "ar";
        status?: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
        dueDate?: string;
        issuedAt?: string;
        notes?: string;
      });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, invoice: result.invoice };
    },
    {
      body: t.Object({
        clientId: t.String({ minLength: 1, maxLength: 80 }),
        invoiceNo: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
        totalAmount: t.Number({ minimum: 0 }),
        paidAmount: t.Optional(t.Number({ minimum: 0 })),
        currency: t.Optional(t.String({ minLength: 3, maxLength: 8 })),
        invoiceLanguage: t.Optional(t.Union([t.Literal("en"), t.Literal("ar")])),
        status: t.Optional(
          t.Union([
            t.Literal("draft"),
            t.Literal("sent"),
            t.Literal("partially_paid"),
            t.Literal("paid"),
            t.Literal("overdue"),
          ]),
        ),
        dueDate: t.Optional(t.String({ minLength: 4, maxLength: 40 })),
        issuedAt: t.Optional(t.String({ minLength: 4, maxLength: 40 })),
        notes: t.Optional(t.String({ maxLength: 2000 })),
      }),
    },
  )
  .patch(
    "/:id",
    async ({ request, params, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await updateInvoice(userId, params.id, body as {
        status?: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
        totalAmount?: number;
        paidAmount?: number;
        dueDate?: string | null;
        notes?: string;
        invoiceLanguage?: "en" | "ar";
      });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, invoice: result.invoice };
    },
    {
      body: t.Object({
        status: t.Optional(
          t.Union([
            t.Literal("draft"),
            t.Literal("sent"),
            t.Literal("partially_paid"),
            t.Literal("paid"),
            t.Literal("overdue"),
          ]),
        ),
        totalAmount: t.Optional(t.Number({ minimum: 0 })),
        paidAmount: t.Optional(t.Number({ minimum: 0 })),
        dueDate: t.Optional(t.Union([t.String({ minLength: 4, maxLength: 40 }), t.Null()])),
        notes: t.Optional(t.String({ maxLength: 2000 })),
        invoiceLanguage: t.Optional(t.Union([t.Literal("en"), t.Literal("ar")])),
      }),
    },
  )
  .patch("/:id/archive", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await deleteInvoice(userId, params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }
    return { success: true };
  })
  .patch("/:id/restore", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await restoreInvoice(userId, params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }
    return { success: true, invoice: result.invoice };
  })
  .delete("/:id", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await hardDeleteInvoice(userId, params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }
    return { success: true };
  })
  .post("/:id/generate-pdf", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await enqueueInvoicePdfJob(userId, params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }
    set.status = 202;
    return { success: true, job: result.job };
  })
  .post("/:id/send-email", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    try {
      const result = await sendInvoiceEmail({ userId, invoiceId: params.id });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, emailId: result.emailId };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send invoice email",
      };
    }
  })
  .get("/:id/pdf-status", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const job = await getLatestInvoicePdfJob(userId, params.id);
    return { success: true, job };
  })
  .get("/:id/pdf", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const job = await getLatestInvoicePdfJob(userId, params.id);
    if (!job || job.status !== "completed" || !job.outputPath) {
      set.status = 404;
      return { success: false, error: "Invoice PDF not ready" };
    }

    const file = Bun.file(job.outputPath);
    const exists = await file.exists();
    if (!exists) {
      set.status = 404;
      return { success: false, error: "Invoice PDF file missing" };
    }

    const invoiceData = await getInvoicePdfData(userId, params.id);
    const fileName = buildInvoicePdfFilename({
      invoiceNo: invoiceData?.invoiceNo,
      issuedAt: invoiceData?.issuedAt,
    });

    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=\"${fileName}\"`,
      },
    });
  });
