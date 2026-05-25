import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseReady } from "@/lib/supabase/env";
import { isServiceRoleConfigured } from "@/lib/supabase/service";

/**
 * Quick check: env present + can reach your Supabase project (anon).
 * GET /api/health/supabase
 */
export async function GET() {
  if (!isSupabaseReady()) {
    return NextResponse.json({
      ok: false,
      step: "env",
      message:
        "Missing or placeholder NEXT_PUBLIC_SUPABASE_* in .env.local — copy .env.example and fill values from Supabase Dashboard → Settings → API."
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

  try {
    const supabase = createClient(url, anon);
    const { error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({
        ok: false,
        step: "supabase",
        message: error.message
      });
    }

    const { error: findsErr } = await supabase.from("finds").select("id").limit(1);
    const findsTableReady = !findsErr;
    const findsHint = findsErr?.message?.includes("schema cache") ||
      findsErr?.message?.includes("Could not find the table")
      ? "Run supabase/sql/ensure_finds_table.sql (or cloverfinder_finds_badges_media.sql) in Supabase → SQL Editor, then reload this page."
      : findsErr?.message;

    return NextResponse.json({
      ok: true,
      step: "connected",
      message: "Supabase credentials work. Sign up / log in should connect.",
      serviceRoleConfigured: isServiceRoleConfigured(),
      findsTableReady,
      findsHint: findsTableReady ? undefined : findsHint
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({
      ok: false,
      step: "network",
      message: msg
    });
  }
}
