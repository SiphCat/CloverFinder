import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const badgeId = url.searchParams.get("badgeId");

  let q = supabase
    .from("user_badges")
    .select("id,badge_id,proof_image_url,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (badgeId) {
    q = q.eq("badge_id", badgeId);
  }

  const { data, error } = await q;
  if (error) {
    // If table doesn't exist, return empty rather than erroring
    if (
      error.message.includes("schema cache") ||
      error.message.includes("user_badges")
    ) {
      return NextResponse.json({ rows: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ rows: data ?? [] });
}
