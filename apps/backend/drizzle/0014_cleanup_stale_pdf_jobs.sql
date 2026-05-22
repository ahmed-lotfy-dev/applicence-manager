-- Mark all stuck invoice PDF jobs as failed.
-- The worker was not running before this migration, so all pending/processing
-- jobs are stale and will never complete.
UPDATE invoice_pdf_jobs
SET
  status = 'failed',
  error_message = 'Cleaned up: stale job from before worker was running',
  updated_at = NOW()
WHERE status IN ('pending', 'processing');
