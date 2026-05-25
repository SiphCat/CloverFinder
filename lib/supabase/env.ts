/**
 * Returns true when Supabase public env vars look real (not placeholders).
 * Real keys must live in `.env.local` — never commit them.
 */
export function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return false;
  if (!url.startsWith("https://")) return false;

  const placeholder =
    /YOUR_PROJECT|YOUR_ANON|project_id|changeme/i.test(url) ||
    /YOUR_ANON|YOUR_KEY|changeme/i.test(key);

  if (placeholder) return false;

  const isJwtAnon = key.startsWith("eyJ");
  const isPublishable = key.startsWith("sb_publishable_");
  if (!isJwtAnon && !isPublishable) return false;
  if (isJwtAnon && key.length < 40) return false;
  if (isPublishable && key.length < 24) return false;

  return true;
}
