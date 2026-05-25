import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { find_id?: string };
  if (!body.find_id) {
    return NextResponse.json({ error: "Missing find_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("likes")
    .insert({ user_id: user.id, find_id: body.find_id });

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return NextResponse.json({ ok: true, action: "already_liked" });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, action: "liked" });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { find_id?: string };
  if (!body.find_id) {
    return NextResponse.json({ error: "Missing find_id" }, { status: 400 });
  }

  await supabase
    .from("likes")
    .delete()
    .eq("user_id", user.id)
    .eq("find_id", body.find_id);

  return NextResponse.json({ ok: true, action: "unliked" });
}
