import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StatRow = { badge_id: string; earners: number; total_users: number };

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_badge_stats");
  if (error) {
    // Return empty stats so the page still renders, with a setup hint
    return NextResponse.json({
      stats: [],
      hint: "Badge stats not available yet. Run supabase/sql/cloverfinder_finds_badges_media.sql in the Supabase SQL Editor to set up badges."
    });
  }
  const stats = (data ?? []) as StatRow[];
  return NextResponse.json({ stats });
}
