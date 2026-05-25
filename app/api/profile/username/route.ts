import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSupabaseConfigured } from "@/lib/supabase/guard";
import { changeUsernameBodySchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  const missing = requireSupabaseConfigured();
  if (missing) return missing;

  const body = await request.json();
  const parsed = changeUsernameBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid username" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      username: parsed.data.username
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Username updated" });
}
