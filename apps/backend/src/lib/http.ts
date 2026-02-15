export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    const rawValue = rest.join("=");
    try {
      acc[rawKey] = decodeURIComponent(rawValue);
    } catch {
      acc[rawKey] = rawValue;
    }
    return acc;
  }, {});
}

export function shouldUseSecureCookies(): boolean {
  return !!(
    process.env.BETTER_AUTH_URL?.startsWith("https://") &&
    process.env.NODE_ENV === "production"
  );
}
