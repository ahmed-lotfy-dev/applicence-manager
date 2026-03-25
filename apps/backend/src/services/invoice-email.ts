import fs from "node:fs/promises";
import { getInvoicePdfData, getLatestInvoicePdfJob } from "./invoice-pdf-jobs";
import { loadInvoiceLogoBuffer, renderInvoicePdfAndSave } from "./invoice-pdf-renderer";

type InvoiceEmailLanguage = "en" | "ar";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function escapeHtml(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return "-";
  return normalized
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function localize(language: InvoiceEmailLanguage, en: string, ar: string): string {
  return language === "ar" ? ar : en;
}

function formatDate(value: Date | string | null | undefined, language: InvoiceEmailLanguage): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMoney(cents: number, currency: string, language: InvoiceEmailLanguage): string {
  return new Intl.NumberFormat(language === "ar" ? "en-US" : "en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

function buildInvoicePdfFilename(input: { invoiceNo?: string | null; issuedAt?: Date | string | null }) {
  const safeNo = (input.invoiceNo || "invoice").trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
  const date = input.issuedAt ? new Date(input.issuedAt) : null;
  const safeDate =
    date && !Number.isNaN(date.getTime())
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : null;
  return safeDate ? `${safeNo}-${safeDate}.pdf` : `${safeNo}.pdf`;
}

function buildSender(fromEmail: string, businessName?: string | null): string {
  const senderName = (businessName || "Fawtarly").trim().replaceAll('"', "");
  return `${senderName} <${fromEmail}>`;
}

function buildInvoiceEmailHtml(input: {
  language: InvoiceEmailLanguage;
  businessName?: string | null;
  clientName?: string | null;
  invoiceNo?: string | null;
  issuedAt?: Date | string | null;
  dueDate?: Date | string | null;
  status?: string | null;
  currency?: string | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  logoCid?: string | null;
}) {
  const language = input.language;
  const outstanding = Math.max((input.totalAmount || 0) - (input.paidAmount || 0), 0);
  const address = [input.addressLine1, input.addressLine2].filter(Boolean).join(", ");
  const direction = language === "ar" ? "rtl" : "ltr";
  const align = language === "ar" ? "right" : "left";
  const logoBlock = input.logoCid
    ? `<img src="cid:${input.logoCid}" alt="${escapeHtml(input.businessName || "Logo")}" style="display:block;max-width:140px;max-height:48px;height:auto;width:auto;" />`
    : `<div style="font-size:12px;letter-spacing:0.24em;color:#7b8797;text-transform:uppercase;">FAWTARLY</div>`;

  return `
  <div dir="${direction}" style="margin:0;padding:24px;background:#0f1012;font-family:Inter,Segoe UI,Arial,sans-serif;color:#10233b;">
    <div style="max-width:720px;margin:0 auto;border-radius:24px;overflow:hidden;background:#f6f8fc;border:1px solid rgba(16,35,59,0.08);">
      <div style="height:10px;background:#183153;"></div>
      <div style="padding:28px 28px 22px;">
        <div style="text-align:${align};">
          <div style="margin-bottom:16px;">${logoBlock}</div>
          <div style="font-size:28px;line-height:1.2;font-weight:700;color:#10233b;">${escapeHtml(
            input.businessName || localize(language, "Fawtarly", "فوترلي"),
          )}</div>
          <div style="margin-top:6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#5f7087;">
            ${escapeHtml(localize(language, "Official invoice", "فاتورة رسمية"))}
          </div>
          <div style="margin-top:18px;font-size:14px;color:#42556e;">
            ${escapeHtml(localize(language, "Invoice", "الفاتورة"))} #${escapeHtml(input.invoiceNo || "-")} ·
            ${escapeHtml(formatDate(input.issuedAt, language))}
          </div>
        </div>

        <div style="margin-top:24px;padding:18px 20px;border-radius:18px;background:#ffffff;border:1px solid rgba(16,35,59,0.08);text-align:${align};">
          <div style="font-size:15px;font-weight:700;color:#10233b;">
            ${escapeHtml(localize(language, "Hello", "مرحبًا"))} ${escapeHtml(input.clientName || localize(language, "there", "عميلنا"))}
          </div>
          <div style="margin-top:8px;font-size:14px;line-height:1.8;color:#4f5f75;">
            ${escapeHtml(
              localize(
                language,
                "Your invoice is attached as a PDF. A short summary is included below.",
                "الفاتورة مرفقة بصيغة PDF، وستجد ملخصًا سريعًا لها بالأسفل.",
              ),
            )}
          </div>
        </div>

        <div style="margin-top:22px;">
          <div style="border-radius:18px;background:#ffffff;padding:18px 20px;border:1px solid rgba(16,35,59,0.08);text-align:${align};">
            <div style="font-size:12px;color:#7b8797;text-transform:uppercase;letter-spacing:0.12em;">${escapeHtml(
              localize(language, "From", "من"),
            )}</div>
            <div style="margin-top:10px;font-size:16px;font-weight:700;color:#10233b;">${escapeHtml(input.businessName || "-")}</div>
            <div style="margin-top:10px;font-size:14px;line-height:1.8;color:#4f5f75;">
              ${input.contactEmail ? `${escapeHtml(input.contactEmail)}<br/>` : ""}
              ${input.contactPhone ? `${escapeHtml(input.contactPhone)}<br/>` : ""}
              ${address ? escapeHtml(address) : ""}
            </div>
          </div>
        </div>

        <div style="margin-top:16px;">
          <div style="border-radius:18px;background:#ffffff;padding:18px 20px;border:1px solid rgba(16,35,59,0.08);text-align:${align};">
            <div style="font-size:12px;color:#7b8797;text-transform:uppercase;letter-spacing:0.12em;">${escapeHtml(
              localize(language, "Invoice details", "تفاصيل الفاتورة"),
            )}</div>
            <div style="margin-top:12px;font-size:14px;line-height:2;color:#4f5f75;">
              <strong style="color:#10233b;">${escapeHtml(localize(language, "Due date", "تاريخ الاستحقاق"))}:</strong>
              ${escapeHtml(formatDate(input.dueDate, language))}<br/>
              <strong style="color:#10233b;">${escapeHtml(localize(language, "Status", "الحالة"))}:</strong>
              ${escapeHtml(input.status || "-")}<br/>
              <strong style="color:#10233b;">${escapeHtml(localize(language, "Currency", "العملة"))}:</strong>
              ${escapeHtml(input.currency || "USD")}
            </div>
          </div>
        </div>

        <div style="margin-top:22px;border-radius:20px;background:#10233b;padding:20px 18px;">
          <div style="display:block;">
            <div style="border-radius:16px;background:#16304d;padding:14px 10px;text-align:center;margin-bottom:12px;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#b7c5d8;">${escapeHtml(localize(language, "Total", "الإجمالي"))}</div>
              <div style="margin-top:8px;font-size:18px;font-weight:700;color:#ffffff;">${escapeHtml(
                formatMoney(input.totalAmount || 0, input.currency || "USD", language),
              )}</div>
            </div>
            <div style="border-radius:16px;background:#16304d;padding:14px 10px;text-align:center;margin-bottom:12px;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#b7c5d8;">${escapeHtml(localize(language, "Paid", "المدفوع"))}</div>
              <div style="margin-top:8px;font-size:18px;font-weight:700;color:#ffffff;">${escapeHtml(
                formatMoney(input.paidAmount || 0, input.currency || "USD", language),
              )}</div>
            </div>
            <div style="border-radius:16px;background:#16304d;padding:14px 10px;text-align:center;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#b7c5d8;">${escapeHtml(localize(language, "Outstanding", "المتبقي"))}</div>
              <div style="margin-top:8px;font-size:18px;font-weight:700;color:#ffffff;">${escapeHtml(
                formatMoney(outstanding, input.currency || "USD", language),
              )}</div>
            </div>
          </div>
        </div>

        <div style="margin-top:20px;font-size:13px;line-height:1.8;color:#5f7087;text-align:${align};">
          ${escapeHtml(
            localize(
              language,
              "The official PDF invoice is attached to this email for your records.",
              "ملف الفاتورة الرسمي بصيغة PDF مرفق مع هذا البريد للاحتفاظ به.",
            ),
          )}
        </div>
      </div>
    </div>
  </div>`;
}

function buildInvoiceEmailText(input: {
  language: InvoiceEmailLanguage;
  businessName?: string | null;
  invoiceNo?: string | null;
  issuedAt?: Date | string | null;
  dueDate?: Date | string | null;
  currency?: string | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
}) {
  const language = input.language;
  const outstanding = Math.max((input.totalAmount || 0) - (input.paidAmount || 0), 0);
  return [
    `${localize(language, "Invoice", "فاتورة")} #${input.invoiceNo || "-"}`,
    `${localize(language, "Business", "النشاط")}: ${input.businessName || "Fawtarly"}`,
    `${localize(language, "Issued", "الإصدار")}: ${formatDate(input.issuedAt, language)}`,
    `${localize(language, "Due", "الاستحقاق")}: ${formatDate(input.dueDate, language)}`,
    `${localize(language, "Total", "الإجمالي")}: ${formatMoney(input.totalAmount || 0, input.currency || "USD", language)}`,
    `${localize(language, "Paid", "المدفوع")}: ${formatMoney(input.paidAmount || 0, input.currency || "USD", language)}`,
    `${localize(language, "Outstanding", "المتبقي")}: ${formatMoney(outstanding, input.currency || "USD", language)}`,
  ].join("\n");
}

async function resolvePdfFile(userId: string, invoiceId: string) {
  const latestJob = await getLatestInvoicePdfJob(userId, invoiceId);
  if (latestJob?.status === "completed" && latestJob.outputPath) {
    const existing = Bun.file(latestJob.outputPath);
    if (await existing.exists()) {
      return latestJob.outputPath;
    }
  }
  return renderInvoicePdfAndSave({ userId, invoiceId });
}

export async function sendInvoiceEmail(input: { userId: string; invoiceId: string }) {
  const data = await getInvoicePdfData(input.userId, input.invoiceId);
  if (!data) {
    return { ok: false as const, error: "Invoice not found" };
  }
  if (!data.clientEmail?.trim()) {
    return { ok: false as const, error: "Client email is missing" };
  }

  const resendApiKey = requireEnv("RESEND_API_KEY");
  const resendFromEmail = requireEnv("RESEND_FROM_EMAIL");
  const replyToEmail = process.env.RESEND_REPLY_TO_EMAIL?.trim() || data.contactEmail?.trim() || undefined;
  const pdfFilePath = await resolvePdfFile(input.userId, input.invoiceId);
  const pdfBuffer = await fs.readFile(pdfFilePath);
  const pdfFileName = buildInvoicePdfFilename({
    invoiceNo: data.invoiceNo,
    issuedAt: data.issuedAt,
  });

  const language: InvoiceEmailLanguage = data.invoiceLanguage === "ar" ? "ar" : "en";
  const logoBuffer = await loadInvoiceLogoBuffer({
    logoObjectKey: data.logoObjectKey,
    logoUrl: data.logoUrl,
  });
  const logoCid = logoBuffer ? "invoice-brand-logo" : null;

  const html = buildInvoiceEmailHtml({
    language,
    businessName: data.businessName,
    clientName: data.clientName,
    invoiceNo: data.invoiceNo,
    issuedAt: data.issuedAt,
    dueDate: data.dueDate,
    status: data.status,
    currency: data.currency,
    totalAmount: data.totalAmount,
    paidAmount: data.paidAmount,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    logoCid,
  });
  const text = buildInvoiceEmailText({
    language,
    businessName: data.businessName,
    invoiceNo: data.invoiceNo,
    issuedAt: data.issuedAt,
    dueDate: data.dueDate,
    currency: data.currency,
    totalAmount: data.totalAmount,
    paidAmount: data.paidAmount,
  });

  const attachments: Array<Record<string, string>> = [
    {
      content: pdfBuffer.toString("base64"),
      filename: pdfFileName,
      content_type: "application/pdf",
    },
  ];

  if (logoBuffer) {
    attachments.push({
      content: logoBuffer.toString("base64"),
      filename: "invoice-logo.png",
      content_type: "image/png",
      content_id: logoCid!,
    });
  }

  const subject = localize(
    language,
    `Invoice #${data.invoiceNo} from ${data.businessName || "Fawtarly"}`,
    `فاتورة رقم ${data.invoiceNo} من ${data.businessName || "فوترلي"}`,
  );

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: buildSender(resendFromEmail, data.businessName),
      to: [data.clientEmail],
      subject,
      html,
      text,
      reply_to: replyToEmail ? [replyToEmail] : undefined,
      attachments,
      tags: [
        { name: "invoice_no", value: (data.invoiceNo || "invoice").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 256) },
        { name: "invoice_id", value: input.invoiceId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 256) },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string; error?: string } | null;
  if (!response.ok || !payload?.id) {
    return {
      ok: false as const,
      error: payload?.message || payload?.error || "Failed to send invoice email",
    };
  }

  return { ok: true as const, emailId: payload.id };
}
