import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSupabaseConfigured } from "@/lib/supabase/guard";
import { signUpSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  const missing = requireSupabaseConfigured();
  if (missing) return missing;

  const body = await request.json();
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, password, username } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/protected`,
      data: { username }
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Account created. Check your inbox to verify your email."
  });
}
