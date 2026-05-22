export function toAmountCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function extractNumericSuffix(invoiceNo: string): number | null {
  const trimmed = invoiceNo.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}
