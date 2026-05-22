import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { db } from "../db/db";
import { and, eq } from "drizzle-orm";
import { freelancerProfiles, invoices, payments } from "../db/auth-schema";
import { R2ObjectStorage } from "./storage/r2-object-storage";

type Language = "en" | "ar";

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 40,
};

function isArabic(language: Language) {
  return language === "ar";
}

function label(language: Language, en: string, ar: string): string {
  return isArabic(language) ? ar : en;
}

function localizeDigits(value: string, language: Language): string {
  if (!isArabic(language)) return value;
  return value.replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)] || digit);
}

function formatDate(value: Date | string | null | undefined, language: Language): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(isArabic(language) ? "ar-EG-u-nu-arab" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMoney(cents: number, currency: string, language: Language): string {
  return new Intl.NumberFormat(isArabic(language) ? "ar-EG-u-nu-arab" : "en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
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
      // Continue.
    }
  }
  return null;
}

async function resolveFont(language: Language): Promise<string | null> {
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

export async function loadLogoBuffer(
  logoObjectKey?: string | null,
  logoUrl?: string | null,
): Promise<Buffer | null> {
  const normalizeForPdf = async (buffer: Buffer): Promise<Buffer> => {
    if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
      try {
        const sharpModule = await import("sharp");
        return await sharpModule.default(buffer).png().toBuffer();
      } catch {
        return buffer;
      }
    }
    return buffer;
  };

  if (logoObjectKey) {
    try {
      const storage = new R2ObjectStorage();
      const buffer = await storage.getObject(logoObjectKey);
      return normalizeForPdf(buffer);
    } catch {
      // Fall back to public URL.
    }
  }

  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    return normalizeForPdf(Buffer.from(await response.arrayBuffer()));
  } catch {
    return null;
  }
}

export async function getPaymentReceiptData(paymentId: string) {
  const [row] = await db
    .select({
      paymentId: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentDate: payments.paymentDate,
      paymentNotes: payments.notes,
      invoiceId: invoices.id,
      invoiceNo: invoices.invoiceNo,
      currency: invoices.currency,
      invoiceLanguage: invoices.invoiceLanguage,
      clientName: freelancerProfiles.businessName,
      logoUrl: freelancerProfiles.logoUrl,
      logoObjectKey: freelancerProfiles.logoObjectKey,
      contactEmail: freelancerProfiles.contactEmail,
      contactPhone: freelancerProfiles.contactPhone,
      addressLine1: freelancerProfiles.addressLine1,
      addressLine2: freelancerProfiles.addressLine2,
      taxId: freelancerProfiles.taxId,
    })
    .from(payments)
    .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
    .leftJoin(freelancerProfiles, eq(freelancerProfiles.userId, payments.userId))
    .where(eq(payments.id, paymentId));

  return row ?? null;
}

function paymentMethodLabel(method: string | null, language: Language): string {
  if (!method) return "-";
  const labels: Record<string, Record<Language, string>> = {
    cash: { en: "Cash", ar: "نقداً" },
    bank_transfer: { en: "Bank Transfer", ar: "تحويل بنكي" },
    card: { en: "Card", ar: "بطاقة" },
  };
  return labels[method]?.[language] || method;
}

export async function renderReceiptPdf(paymentId: string): Promise<string> {
  const data = await getPaymentReceiptData(paymentId);
  if (!data) throw new Error("PAYMENT_NOT_FOUND");

  const language: Language = data.invoiceLanguage === "ar" ? "ar" : "en";
  const fontPath = await resolveFont(language);
  const logoBuffer = await loadLogoBuffer(data.logoObjectKey, data.logoUrl);

  const doc = new PDFDocument({ margin: PAGE.margin, size: "A4" });
  const outputPromise = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer | Uint8Array) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  if (fontPath) {
    doc.font(fontPath);
  }

  const contentWidth = PAGE.width - PAGE.margin * 2;
  const cardX = PAGE.margin;
  let y = PAGE.margin;

  // Header card
  const headerHeight = 102;
  doc.save();
  doc.roundedRect(cardX, y, contentWidth, headerHeight, 18).fill("#F6F8FC");
  doc.roundedRect(cardX, y, contentWidth, 10, 18).fill("#183153");
  doc.restore();

  if (logoBuffer) {
    try {
      const logoX = isArabic(language) ? cardX + contentWidth - 98 : cardX + 18;
      doc.image(logoBuffer, logoX, y + 18, { fit: [78, 44], align: "center", valign: "center" });
    } catch {
      // Ignore.
    }
  }

  const titleX = isArabic(language) ? cardX + 18 : cardX + 110;
  const titleWidth = contentWidth - 128;
  doc
    .fillColor("#10233B")
    .fontSize(isArabic(language) ? 22 : 20)
    .text(safeText(data.clientName || label(language, "Business", "النشاط التجاري")), titleX, y + 22, {
      width: titleWidth,
      align: isArabic(language) ? "right" : "left",
    });

  doc
    .fillColor("#4F5F75")
    .fontSize(9.5)
    .text(label(language, "Payment receipt", "إيصال دفع"), titleX, y + 50, {
      width: titleWidth,
      align: isArabic(language) ? "right" : "left",
    });

  const receiptTitle = label(language, "RECEIPT", "إيصال");
  const receiptMeta = [
    `${label(language, "Invoice #", "رقم الفاتورة")} ${safeText(data.invoiceNo || "-")}`,
    `${label(language, "Date", "التاريخ")} ${formatDate(data.paymentDate, language)}`,
  ];

  doc
    .fillColor("#10233B")
    .fontSize(isArabic(language) ? 24 : 22)
    .text(receiptTitle, cardX + 18, y + 66, {
      width: contentWidth - 36,
      align: isArabic(language) ? "left" : "right",
    });
  doc
    .fillColor("#4F5F75")
    .fontSize(9)
    .text(receiptMeta.join("   "), cardX + 18, y + 86, {
      width: contentWidth - 36,
      align: isArabic(language) ? "left" : "right",
    });

  y += headerHeight + 30;

  // Payment summary card
  const summaryHeight = 130;
  doc.save();
  doc.roundedRect(cardX, y, contentWidth, summaryHeight, 18).fill("#10233B");
  doc.restore();

  doc
    .fillColor("#FFFFFF")
    .fontSize(14)
    .text(label(language, "Payment details", "تفاصيل الدفع"), cardX + 18, y + 16, {
      width: contentWidth - 36,
      align: isArabic(language) ? "right" : "left",
    });

  const summaryItems = [
    {
      label: label(language, "Amount", "المبلغ"),
      value: formatMoney(data.amount, data.currency || "USD", language),
    },
    {
      label: label(language, "Method", "طريقة الدفع"),
      value: paymentMethodLabel(data.paymentMethod, language),
    },
  ];

  const itemWidth = (contentWidth - 36 - 16) / 2;
  summaryItems.forEach((item, index) => {
    const itemX = cardX + 18 + index * (itemWidth + 16);
    const itemY = y + 42;
    doc.save();
    doc.roundedRect(itemX, itemY, itemWidth, 68, 14).fill("#16304D");
    doc.restore();
    doc.fillColor("#B7C5D8").fontSize(9).text(item.label, itemX + 12, itemY + 11, {
      width: itemWidth - 24,
      align: "center",
    });
    const valueSize = item.label === label(language, "Amount", "المبلغ") ? 18 : 13;
    doc
      .fillColor("#FFFFFF")
      .fontSize(valueSize)
      .text(item.value, itemX + 12, itemY + 26, {
        width: itemWidth - 24,
        align: "center",
      });
  });

  y += summaryHeight + 20;

  // Detail rows card
  const detailRows: Array<{ label: string; value: string }> = [
    { label: label(language, "Invoice #", "رقم الفاتورة"), value: safeText(data.invoiceNo || "-") },
    { label: label(language, "Payment date", "تاريخ الدفع"), value: formatDate(data.paymentDate, language) },
    { label: label(language, "Payment method", "طريقة الدفع"), value: paymentMethodLabel(data.paymentMethod, language) },
    { label: label(language, "Tax ID", "الرقم الضريبي"), value: localizeDigits(data.taxId || "-", language) },
  ];

  const detailCardHeight = 22 + detailRows.length * 30 + 16;
  doc.save();
  doc.roundedRect(cardX, y, contentWidth, detailCardHeight, 16).fill("#FFFFFF");
  doc.restore();

  doc.fillColor("#10233B").fontSize(12).text(label(language, "Details", "التفاصيل"), cardX + 16, y + 14, {
    width: contentWidth - 32,
    align: isArabic(language) ? "right" : "left",
  });

  let rowY = y + 38;
  for (const row of detailRows) {
    doc
      .fillColor("#75859A")
      .fontSize(9)
      .text(row.label, cardX + 16, rowY, {
        width: contentWidth - 32,
        align: isArabic(language) ? "right" : "left",
      });
    doc
      .fillColor("#1B2B3E")
      .fontSize(10.5)
      .text(row.value, cardX + 16, rowY + 12, {
        width: contentWidth - 32,
        align: isArabic(language) ? "right" : "left",
      });
    rowY += 30;
  }

  y += detailCardHeight + 14;

  // Notes
  if (data.paymentNotes) {
    const notesHeight = Math.max(
      doc.heightOfString(data.paymentNotes, { width: contentWidth - 32, align: isArabic(language) ? "right" : "left" }),
      24,
    );
    const notesCardHeight = 46 + notesHeight;

    doc.save();
    doc.roundedRect(cardX, y, contentWidth, notesCardHeight, 16).fill("#F8FAFD");
    doc.restore();
    doc.fillColor("#10233B").fontSize(12).text(label(language, "Notes", "ملاحظات"), cardX + 16, y + 14, {
      width: contentWidth - 32,
      align: isArabic(language) ? "right" : "left",
    });
    doc.fillColor("#49586D").fontSize(10).text(data.paymentNotes, cardX + 16, y + 34, {
      width: contentWidth - 32,
      align: isArabic(language) ? "right" : "left",
    });
    y += notesCardHeight + 14;
  }

  // Footer
  const footerY = Math.min(y + 4, PAGE.height - PAGE.margin - 16);
  doc
    .fillColor("#7B8797")
    .fontSize(9)
    .text(
      label(language, "Generated by Fawtarly", "تم إنشاء الإيصال عبر فوترلي"),
      PAGE.margin,
      footerY,
      { width: contentWidth, align: "center" },
    );

  doc.end();
  const buffer = await outputPromise;

  const dir = process.env.INVOICE_PDF_DIR?.trim() || path.join(process.cwd(), "storage", "receipts");
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${paymentId}.pdf`);
  await fs.writeFile(filePath, buffer);

  return filePath;
}

function safeText(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : "-";
}
