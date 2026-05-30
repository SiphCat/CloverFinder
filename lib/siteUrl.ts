/** Canonical site origin for sitemap, robots, and auth redirect URLs. */
export function siteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cloverfinder.app";
  return raw.replace(/\/$/, "");
}
