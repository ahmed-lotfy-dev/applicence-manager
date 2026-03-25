import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { getInvoicePdfData } from "./invoice-pdf-jobs";
import { R2ObjectStorage } from "./storage/r2-object-storage";

type InvoiceLanguage = "en" | "ar";

const PAGE = {
  width: 595.28,
  margin: 46,
};

function isArabic(language: InvoiceLanguage) {
  return language === "ar";
}

function label(language: InvoiceLanguage, en: string, ar: string): string {
  return isArabic(language) ? ar : en;
}

function localizeDigits(value: string, language: InvoiceLanguage): string {
  if (!isArabic(language)) return value;
  return value.replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)] || digit);
}

function formatDate(value: Date | string | null | undefined, language: InvoiceLanguage): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(isArabic(language) ? "ar-EG-u-nu-arab" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMoney(cents: number, currency: string, language: InvoiceLanguage): string {
  return new Intl.NumberFormat(isArabic(language) ? "ar-EG-u-nu-arab" : "en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

function localizeStatus(status: string, language: InvoiceLanguage): string {
  if (!isArabic(language)) {
    return status.replace(/_/g, " ");
  }
  const map: Record<string, string> = {
    draft: "مسودة",
    sent: "مرسلة",
    partially_paid: "مدفوعة جزئياً",
    paid: "مدفوعة",
    overdue: "متأخرة",
  };
  return map[status] || status;
}

function invoiceNumber(value: string, language: InvoiceLanguage): string {
  return localizeDigits(value || "-", language);
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
      // Continue checking.
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

  return isArabic(language)
    ? (await pickExistingPath(arabicCandidates)) || (await pickExistingPath(defaultCandidates))
    : pickExistingPath(defaultCandidates);
}

async function loadLogoBuffer(input: {
  logoObjectKey?: string | null;
  logoUrl?: string | null;
}): Promise<Buffer | null> {
  if (input.logoObjectKey) {
    try {
      const storage = new R2ObjectStorage();
      return await storage.getObject(input.logoObjectKey);
    } catch {
      // Fall back to public URL.
    }
  }

  if (!input.logoUrl) return null;
  try {
    const response = await fetch(input.logoUrl);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
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

function drawHeader(
  doc: InstanceType<typeof PDFDocument>,
  language: InvoiceLanguage,
  data: Awaited<ReturnType<typeof getInvoicePdfData>>,
  logoBuffer: Buffer | null,
) {
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const cardX = PAGE.margin;
  const cardY = PAGE.margin;
  const cardHeight = 118;

  doc.save();
  doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 18).fill("#F6F8FC");
  doc.roundedRect(cardX, cardY, contentWidth, 10, 18).fill("#183153");
  doc.restore();

  if (logoBuffer) {
    try {
      const logoX = isArabic(language) ? cardX + contentWidth - 112 : cardX + 18;
      doc.image(logoBuffer, logoX, cardY + 18, { fit: [94, 56], align: "center", valign: "center" });
    } catch {
      // Ignore invalid image bytes and continue.
    }
  }

  const titleX = isArabic(language) ? cardX + 18 : cardX + 128;
  const titleWidth = contentWidth - 146;
  doc
    .fillColor("#10233B")
    .fontSize(isArabic(language) ? 24 : 22)
    .text(data?.businessName || label(language, "Freelancer", "مستقل"), titleX, cardY + 24, {
      width: titleWidth,
      align: isArabic(language) ? "right" : "left",
    });

  doc
    .fillColor("#4F5F75")
    .fontSize(10)
    .text(label(language, "Professional invoice", "فاتورة احترافية"), titleX, cardY + 56, {
      width: titleWidth,
      align: isArabic(language) ? "right" : "left",
    });

  const invoiceTitle = label(language, "INVOICE", "فاتورة");
  const invoiceMeta = [
    `${label(language, "Invoice #", "رقم الفاتورة")} ${invoiceNumber(data?.invoiceNo || "-", language)}`,
    `${label(language, "Issued", "تاريخ الإصدار")} ${formatDate(data?.issuedAt, language)}`,
  ];

  doc
    .fillColor("#10233B")
    .fontSize(isArabic(language) ? 26 : 24)
    .text(invoiceTitle, cardX + 18, cardY + 78, {
      width: contentWidth - 36,
      align: isArabic(language) ? "left" : "right",
    });
  doc
    .fillColor("#4F5F75")
    .fontSize(10)
    .text(invoiceMeta.join("   "), cardX + 18, cardY + 100, {
      width: contentWidth - 36,
      align: isArabic(language) ? "left" : "right",
    });

  doc.y = cardY + cardHeight + 26;
}

function drawKeyValueBlock(
  doc: InstanceType<typeof PDFDocument>,
  language: InvoiceLanguage,
  title: string,
  rows: Array<{ label: string; value: string | null | undefined }>,
  x: number,
  y: number,
  width: number,
) {
  doc.save();
  doc.roundedRect(x, y, width, 126, 16).fill("#FFFFFF");
  doc.restore();

  doc.fillColor("#10233B").fontSize(12).text(title, x + 16, y + 14, {
    width: width - 32,
    align: isArabic(language) ? "right" : "left",
  });

  let rowY = y + 40;
  for (const row of rows) {
    doc
      .fillColor("#75859A")
      .fontSize(9)
      .text(row.label, x + 16, rowY, {
        width: width - 32,
        align: isArabic(language) ? "right" : "left",
      });
    doc
      .fillColor("#1B2B3E")
      .fontSize(11)
      .text(row.value || "-", x + 16, rowY + 14, {
        width: width - 32,
        align: isArabic(language) ? "right" : "left",
      });
    rowY += 34;
  }
}

function drawSummary(
  doc: InstanceType<typeof PDFDocument>,
  language: InvoiceLanguage,
  data: Awaited<ReturnType<typeof getInvoicePdfData>>,
) {
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  const y = doc.y;

  doc.save();
  doc.roundedRect(x, y, width, 124, 18).fill("#10233B");
  doc.restore();

  doc.fillColor("#FFFFFF").fontSize(12).text(label(language, "Payment summary", "ملخص الدفع"), x + 18, y + 16, {
    width: width - 36,
    align: isArabic(language) ? "right" : "left",
  });

  const items = [
    {
      label: label(language, "Total", "الإجمالي"),
      value: formatMoney(data?.totalAmount || 0, data?.currency || "USD", language),
    },
    {
      label: label(language, "Paid", "المدفوع"),
      value: formatMoney(data?.paidAmount || 0, data?.currency || "USD", language),
    },
    {
      label: label(language, "Outstanding", "المتبقي"),
      value: formatMoney(
        Math.max((data?.totalAmount || 0) - (data?.paidAmount || 0), 0),
        data?.currency || "USD",
        language,
      ),
    },
  ];

  const cardWidth = (width - 36 - 16) / 3;
  items.forEach((item, index) => {
    const cardX = x + 18 + index * (cardWidth + 8);
    const cardY = y + 44;
    doc.save();
    doc.roundedRect(cardX, cardY, cardWidth, 56, 14).fill("#16304D");
    doc.restore();
    doc.fillColor("#B7C5D8").fontSize(9).text(item.label, cardX + 12, cardY + 11, {
      width: cardWidth - 24,
      align: "center",
    });
    doc.fillColor("#FFFFFF").fontSize(13).text(item.value, cardX + 12, cardY + 28, {
      width: cardWidth - 24,
      align: "center",
    });
  });

  doc.y = y + 146;
}

function drawNotes(
  doc: InstanceType<typeof PDFDocument>,
  language: InvoiceLanguage,
  notes: string | null | undefined,
) {
  if (!notes) return;
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  const y = doc.y;
  const height = 84;

  doc.save();
  doc.roundedRect(x, y, width, height, 16).fill("#F8FAFD");
  doc.restore();
  doc.fillColor("#10233B").fontSize(12).text(label(language, "Notes", "ملاحظات"), x + 16, y + 14, {
    width: width - 32,
    align: isArabic(language) ? "right" : "left",
  });
  doc.fillColor("#49586D").fontSize(10.5).text(notes, x + 16, y + 34, {
    width: width - 32,
    align: isArabic(language) ? "right" : "left",
  });
  doc.y = y + height + 18;
}

export async function renderInvoicePdfAndSave(input: { userId: string; invoiceId: string }) {
  const data = await getInvoicePdfData(input.userId, input.invoiceId);
  if (!data) throw new Error("INVOICE_NOT_FOUND");

  const language: InvoiceLanguage = data.invoiceLanguage === "ar" ? "ar" : "en";
  const fontPath = await resolvePdfFont(language);
  const logoBuffer = await loadLogoBuffer({
    logoObjectKey: data.logoObjectKey,
    logoUrl: data.logoUrl,
  });

  const doc = new PDFDocument({ margin: PAGE.margin, size: "A4" });
  const outputPromise = buildPdfBuffer(doc);
  if (fontPath) {
    doc.font(fontPath);
  }

  drawHeader(doc, language, data, logoBuffer);

  const contentWidth = PAGE.width - PAGE.margin * 2;
  const gap = 16;
  const blockWidth = (contentWidth - gap) / 2;
  const topY = doc.y;

  drawKeyValueBlock(
    doc,
    language,
    label(language, "From", "من"),
    [
      { label: label(language, "Business name", "اسم النشاط"), value: data.businessName || "-" },
      { label: label(language, "Email", "البريد الإلكتروني"), value: data.contactEmail || "-" },
      { label: label(language, "Phone", "الهاتف"), value: isArabic(language) ? localizeDigits(data.contactPhone || "-", language) : data.contactPhone || "-" },
    ],
    PAGE.margin,
    topY,
    blockWidth,
  );

  drawKeyValueBlock(
    doc,
    language,
    label(language, "Bill to", "الفاتورة إلى"),
    [
      { label: label(language, "Client", "العميل"), value: data.clientName || "-" },
      { label: label(language, "Email", "البريد الإلكتروني"), value: data.clientEmail || "-" },
      { label: label(language, "Phone", "الهاتف"), value: isArabic(language) ? localizeDigits(data.clientPhone || "-", language) : data.clientPhone || "-" },
    ],
    PAGE.margin + blockWidth + gap,
    topY,
    blockWidth,
  );

  doc.y = topY + 146;

  drawKeyValueBlock(
    doc,
    language,
    label(language, "Invoice details", "تفاصيل الفاتورة"),
    [
      { label: label(language, "Invoice #", "رقم الفاتورة"), value: invoiceNumber(data.invoiceNo || "-", language) },
      { label: label(language, "Issue date", "تاريخ الإصدار"), value: formatDate(data.issuedAt, language) },
      { label: label(language, "Due date", "تاريخ الاستحقاق"), value: formatDate(data.dueDate, language) },
    ],
    PAGE.margin,
    doc.y,
    blockWidth,
  );

  drawKeyValueBlock(
    doc,
    language,
    label(language, "Status and tax", "الحالة والضريبة"),
    [
      { label: label(language, "Status", "الحالة"), value: localizeStatus(data.status, language) },
      { label: label(language, "Currency", "العملة"), value: data.currency || "USD" },
      { label: label(language, "Tax ID", "الرقم الضريبي"), value: isArabic(language) ? localizeDigits(data.taxId || "-", language) : data.taxId || "-" },
    ],
    PAGE.margin + blockWidth + gap,
    doc.y,
    blockWidth,
  );

  doc.y += 146;
  drawSummary(doc, language, data);
  drawNotes(doc, language, data.invoiceNotes);

  doc
    .fillColor("#7B8797")
    .fontSize(9)
    .text(
      label(language, "Generated by Fawtarly", "تم إنشاء الفاتورة عبر فوترلي"),
      PAGE.margin,
      doc.y + 6,
      {
        width: contentWidth,
        align: "center",
      },
    );

  doc.end();
  const buffer = await outputPromise;

  const dir = process.env.INVOICE_PDF_DIR?.trim() || path.join(process.cwd(), "storage", "invoices");
  const userDir = path.join(dir, input.userId);
  await fs.mkdir(userDir, { recursive: true });

  const filePath = path.join(userDir, `${input.invoiceId}.pdf`);
  await fs.writeFile(filePath, buffer);

  return filePath;
}
