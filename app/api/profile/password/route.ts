import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSupabaseConfigured } from "@/lib/supabase/guard";
import { changePasswordBodySchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  const missing = requireSupabaseConfigured();
  if (missing) return missing;

  const body = await request.json();
  const parsed = changePasswordBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

  const probe = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { error: signErr } = await probe.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword
  });

  if (signErr) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const { error: updErr } = await supabase.auth.updateUser({
    password: parsed.data.newPassword
  });

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Password updated" });
}
