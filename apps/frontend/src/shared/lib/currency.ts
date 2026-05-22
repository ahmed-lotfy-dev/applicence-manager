export function formatCurrencyCents(cents: number, currency?: string | null): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.trim() || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

export function formatCurrency(amount: number, currency?: string | null): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.trim() || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}
