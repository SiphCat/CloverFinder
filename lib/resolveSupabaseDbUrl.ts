/** Build Postgres URL from .env.local-style vars (no secrets logged). */
export function resolveSupabaseDbUrl(env: Record<string, string | undefined>): string | null {
  const direct = env.SUPABASE_DB_URL || env.DATABASE_URL;
  if (direct && !direct.includes("[YOUR-PASSWORD]")) {
    return direct;
  }

  const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const password = env.SUPABASE_DB_PASSWORD?.trim();
  if (ref && password) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }

  return null;
}

export function supabaseProjectRef(env: Record<string, string | undefined>): string | null {
  return env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
}
