import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSupabaseConfigured } from "@/lib/supabase/guard";

export async function POST() {
  const missing = requireSupabaseConfigured();
  if (missing) return missing;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ message: "Logged out" });
}
