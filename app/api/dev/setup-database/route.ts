import { NextResponse } from "next/server";
import { resolveSupabaseDbUrl } from "@/lib/resolveSupabaseDbUrl";
import { runFindsMigration } from "@/lib/runFindsMigration";

/** Dev only: create public.finds when SUPABASE_DB_PASSWORD or SUPABASE_DB_URL is set. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const dbUrl = resolveSupabaseDbUrl(process.env);
  if (!dbUrl) {
    return NextResponse.json(
      {
        error: "Missing database credentials",
        hint:
          "Add SUPABASE_DB_PASSWORD=your_db_password to .env.local (Supabase → Project Settings → Database), then restart npm run dev and try again. Or run supabase/sql/ensure_finds_table.sql in the SQL Editor."
      },
      { status: 400 }
    );
  }

  const result = await runFindsMigration(dbUrl);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "public.finds created. Reload the app; /api/health/supabase should show findsTableReady: true."
  });
}
