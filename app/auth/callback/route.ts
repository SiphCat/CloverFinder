import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseReady } from "@/lib/supabase/env";

export async function GET(request: Request) {
  if (!isSupabaseReady()) {
    return NextResponse.redirect(new URL("/", new URL(request.url).origin));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/protected";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
