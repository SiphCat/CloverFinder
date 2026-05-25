import { NextResponse } from "next/server";
import { isSupabaseReady } from "@/lib/supabase/env";

export function supabaseNotConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "Supabase is not connected. Create .env.local from .env.example and paste NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase → Settings → API. Restart npm run dev.",
      code: "SUPABASE_NOT_CONFIGURED"
    },
    { status: 503 }
  );
}

export function requireSupabaseConfigured(): NextResponse | null {
  if (!isSupabaseReady()) {
    return supabaseNotConfiguredResponse();
  }
  return null;
}
