/** Heuristic for flaky Wi‑Fi / Supabase edge / cold starts. */
export function isTransientNetworkError(err: unknown): boolean {
  if (err == null) return false;
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as { message: unknown }).message === "string"
        ? (err as { message: string }).message
        : String(err);
  const m = msg.toLowerCase();
  if (m.includes("fetch failed")) return true;
  if (m.includes("failed to fetch")) return true;
  if (m.includes("network")) return true;
  if (m.includes("econnreset")) return true;
  if (m.includes("etimedout")) return true;
  if (m.includes("socket")) return true;
  if (m.includes("aborted")) return true;
  if (m.includes("eai_again")) return true;
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
