import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { getInvoicePdfData } from "./invoice-pdf-jobs";

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(
    (cents || 0) / 100,
  );
}

type InvoiceLanguage = "en" | "ar";

function label(language: InvoiceLanguage, en: string, ar: string): string {
  return language === "ar" ? ar : en;
}

function writeLabeledRow(
  doc: InstanceType<typeof PDFDocument>,
  language: InvoiceLanguage,
  labelText: string,
  valueText: string,
) {
  const value = valueText || "-";
  if (language === "ar") {
    const y = doc.y;
    doc.text(labelText, 320, y, { width: 225, align: "right" });
    doc.text(value, 50, y, { width: 250, align: "left" });
    doc.moveDown(1);
    return;
  }
  doc.text(`${labelText}: ${value}`);
}

function localizeStatus(status: string, language: InvoiceLanguage): string {
  if (language !== "ar") return status;
  const map: Record<string, string> = {
    draft: "مسودة",
    sent: "مرسلة",
    partially_paid: "مدفوعة جزئيا",
    paid: "مدفوعة",
    overdue: "متأخرة",
  };
  return map[status] || status;
}

async function pickExistingPath(candidates: Array<string | null | undefined>): Promise<string | null> {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = candidate.trim();
    if (!normalized) continue;
    try {
      await fs.access(normalized);
      return normalized;
    } catch {
      // Try next candidate.
    }
  }
  return null;
}

async function resolvePdfFont(language: InvoiceLanguage): Promise<string | null> {
  const projectFonts = path.join(process.cwd(), "assets", "fonts");
  const defaultCandidates = [
    process.env.INVOICE_PDF_FONT_PATH,
    path.join(projectFonts, "Inter-Regular.ttf"),
    path.join(projectFonts, "DejaVuSans.ttf"),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ];
  const arabicCandidates = [
    process.env.INVOICE_PDF_ARABIC_FONT_PATH,
    path.join(projectFonts, "NotoNaskhArabic-Regular.ttf"),
    path.join(projectFonts, "NotoSansArabic-Regular.ttf"),
    path.join(projectFonts, "Amiri-Regular.ttf"),
    "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
    "/usr/share/fonts/truetype/amiri/Amiri-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ];

  if (language === "ar") {
    const arabicFont = await pickExistingPath(arabicCandidates);
    if (arabicFont) return arabicFont;
  }
  return pickExistingPath(defaultCandidates);
}

async function loadLogoBuffer(logoUrl?: string | null): Promise<Buffer | null> {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

function buildPdfBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer | Uint8Array) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function renderInvoicePdfAndSave(input: { userId: string; invoiceId: string }) {
  const data = await getInvoicePdfData(input.userId, input.invoiceId);
  if (!data) throw new Error("INVOICE_NOT_FOUND");
  const invoiceLanguage: InvoiceLanguage = data.invoiceLanguage === "ar" ? "ar" : "en";
  const dateLocale = invoiceLanguage === "ar" ? "ar-EG" : "en-US";
  const customFontPath = await resolvePdfFont(invoiceLanguage);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const outputPromise = buildPdfBuffer(doc);
  if (customFontPath) {
    doc.font(customFontPath);
  } else if (invoiceLanguage === "ar") {
    console.warn(
      "Arabic invoice PDF requested but no Arabic-capable font found. Set INVOICE_PDF_ARABIC_FONT_PATH.",
    );
  }

  const logoBuffer = await loadLogoBuffer(data.logoUrl);
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 50, 40, { fit: [120, 60] });
    } catch {
      // Ignore invalid logo format and continue rendering.
    }
  }

  doc.fontSize(22).text(data.businessName || "Freelancer", 50, 120);
  doc.fontSize(10).fillColor("#444");
  if (data.addressLine1) doc.text(data.addressLine1);
  if (data.addressLine2) doc.text(data.addressLine2);
  if (data.contactEmail) {
    writeLabeledRow(
      doc,
      invoiceLanguage,
      label(invoiceLanguage, "Email", "البريد الإلكتروني"),
      data.contactEmail,
    );
  }
  if (data.contactPhone) {
    writeLabeledRow(doc, invoiceLanguage, label(invoiceLanguage, "Phone", "الهاتف"), data.contactPhone);
  }
  if (data.taxId) {
    writeLabeledRow(doc, invoiceLanguage, label(invoiceLanguage, "Tax ID", "الرقم الضريبي"), data.taxId);
  }

  doc.moveDown(2);
  doc.fillColor("#111").fontSize(20).text(label(invoiceLanguage, "INVOICE", "فاتورة"), { align: "right" });
  doc.fontSize(11);
  writeLabeledRow(doc, invoiceLanguage, label(invoiceLanguage, "Invoice #", "رقم الفاتورة"), data.invoiceNo);
  writeLabeledRow(
    doc,
    invoiceLanguage,
    label(invoiceLanguage, "Issued", "تاريخ الإصدار"),
    data.issuedAt ? new Date(data.issuedAt).toLocaleDateString(dateLocale) : "-",
  );
  writeLabeledRow(
    doc,
    invoiceLanguage,
    label(invoiceLanguage, "Due", "تاريخ الاستحقاق"),
    data.dueDate ? new Date(data.dueDate).toLocaleDateString(dateLocale) : "-",
  );
  writeLabeledRow(
    doc,
    invoiceLanguage,
    label(invoiceLanguage, "Status", "الحالة"),
    localizeStatus(data.status, invoiceLanguage),
  );

  doc.moveDown(2);
  doc.fontSize(12).fillColor("#111").text(label(invoiceLanguage, "Bill To", "الفاتورة إلى"));
  doc.fontSize(11).fillColor("#333").text(data.clientName || "-");
  if (data.clientEmail) doc.text(data.clientEmail);
  if (data.clientPhone) doc.text(data.clientPhone);

  doc.moveDown(2);
  doc.fontSize(12).fillColor("#111").text(label(invoiceLanguage, "Summary", "الملخص"));
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#333");
  writeLabeledRow(
    doc,
    invoiceLanguage,
    label(invoiceLanguage, "Total", "الإجمالي"),
    formatMoney(data.totalAmount || 0, data.currency || "USD"),
  );
  writeLabeledRow(
    doc,
    invoiceLanguage,
    label(invoiceLanguage, "Paid", "المدفوع"),
    formatMoney(data.paidAmount || 0, data.currency || "USD"),
  );
  writeLabeledRow(
    doc,
    invoiceLanguage,
    label(invoiceLanguage, "Outstanding", "المستحق"),
    formatMoney(
      Math.max((data.totalAmount || 0) - (data.paidAmount || 0), 0),
      data.currency || "USD",
    ),
  );

  if (data.invoiceNotes) {
    doc.moveDown(1.5);
    doc.fillColor("#111").fontSize(12).text(label(invoiceLanguage, "Notes", "ملاحظات"));
    doc.fillColor("#333").fontSize(11).text(data.invoiceNotes);
  }

  doc.end();
  const buffer = await outputPromise;

  const dir = process.env.INVOICE_PDF_DIR?.trim() || path.join(process.cwd(), "storage", "invoices");
  const userDir = path.join(dir, input.userId);
  await fs.mkdir(userDir, { recursive: true });

  const filePath = path.join(userDir, `${input.invoiceId}.pdf`);
  await fs.writeFile(filePath, buffer);

  return filePath;
}
