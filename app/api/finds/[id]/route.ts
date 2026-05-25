import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: find, error } = await supabase
    .from("finds")
    .select("id, title, description, leaf_count, image_path, user_id, created_at")
    .eq("id", id)
    .single();

  if (error || !find) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let username = "Finder";
  try {
    const { data } = await supabase.rpc("get_username_for_user", {
      uid: find.user_id,
    });
    if (data) username = data;
  } catch {
    // RPC might not exist yet — fall back
  }

  let imageUrl: string | null = null;
  if (find.image_path) {
    const { data: urlData } = supabase.storage
      .from("finds")
      .getPublicUrl(find.image_path);
    imageUrl = urlData.publicUrl;
  }

  let commentCount = 0;
  try {
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("find_id", id);
    commentCount = count ?? 0;
  } catch {
    // comments table might not exist yet
  }

  return NextResponse.json({
    id: find.id,
    title: find.title,
    description: find.description,
    leafCount: find.leaf_count,
    username,
    imageUrl,
    commentCount,
    createdAt: find.created_at,
  });
}
