import { initializeDatabase } from "../bootstrap/database";
import {
  claimNextPendingPdfJob,
  markInvoicePdfJobStatus,
} from "../services/invoice-pdf-jobs";
import { renderInvoicePdfAndSave } from "../services/invoice-pdf-renderer";

const POLL_INTERVAL_MS = 1500;

async function processOneJob() {
  const job = await claimNextPendingPdfJob();
  if (!job) return;

  try {
    const filePath = await renderInvoicePdfAndSave({
      userId: job.userId,
      invoiceId: job.invoiceId,
    });

    await markInvoicePdfJobStatus(job.id, "completed", { outputPath: filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PDF generation error";
    await markInvoicePdfJobStatus(job.id, "failed", { errorMessage: message });
  }
}

export async function startInvoicePdfWorker() {
  console.log("🧾 Invoice PDF worker started");

  for (;;) {
    try {
      await processOneJob();
    } catch (error) {
      console.error("❌ Invoice PDF worker error:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

const isMainModule = import.meta.path === Bun.main;
if (isMainModule) {
  initializeDatabase()
    .then(startInvoicePdfWorker)
    .catch((error) => {
      console.error("❌ Invoice PDF worker failed to start:", error);
      process.exit(1);
    });
}
