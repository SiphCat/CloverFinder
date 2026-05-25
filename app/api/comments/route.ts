import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const findId = searchParams.get("find_id");
  if (!findId) {
    return NextResponse.json({ error: "Missing find_id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Try RPC first (has usernames), fall back to raw query
  const rpc = await supabase.rpc("get_comments_for_find", {
    fid: findId,
    lim: 50,
  });

  if (!rpc.error && rpc.data) {
    return NextResponse.json({ comments: rpc.data });
  }

  // Fallback without usernames
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, user_id, created_at")
    .eq("find_id", findId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const comments = (data ?? []).map((c) => ({
    ...c,
    username: "User",
  }));

  return NextResponse.json({ comments });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    find_id?: string;
    body?: string;
  };

  if (!body.find_id || !body.body?.trim()) {
    return NextResponse.json(
      { error: "Missing find_id or body" },
      { status: 400 }
    );
  }

  const text = body.body.trim().slice(0, 500);

  const { data, error } = await supabase
    .from("comments")
    .insert({ find_id: body.find_id, user_id: user.id, body: text })
    .select("id, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Get username from user metadata
  const username =
    (user.user_metadata?.username as string) ||
    user.email?.split("@")[0] ||
    "User";

  return NextResponse.json({
    comment: { ...data, user_id: user.id, username },
  });
}
