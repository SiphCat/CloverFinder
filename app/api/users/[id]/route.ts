import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Get username + avatar via RPC
  let username = "Finder";
  let avatarUrl: string | null = null;
  try {
    const { data } = await supabase.rpc("get_public_profile", { uid: id });
    if (data?.[0]) {
      username = data[0].username;
      avatarUrl = data[0].avatar_url;
    }
  } catch {
    // RPC might not exist — try fallback
    try {
      const { data } = await supabase.rpc("get_username_for_user", { uid: id });
      if (data) username = data;
    } catch {
      /* */
    }
  }

  // Get their public finds
  const { data: finds } = await supabase
    .from("finds")
    .select("id, title, description, image_path, leaf_count, lat, lng, created_at")
    .eq("user_id", id)
    .eq("share_clovermedia", true)
    .not("image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (finds ?? []).map((f) => {
    const { data: urlData } = supabase.storage
      .from("finds")
      .getPublicUrl(f.image_path);
    return {
      id: f.id,
      title: f.title,
      description: f.description,
      leafCount: f.leaf_count,
      imageUrl: urlData.publicUrl,
      lat: f.lat,
      lng: f.lng,
      createdAt: f.created_at,
    };
  });

  // Get follower / following counts
  const [followerRes, followingRes] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", id),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", id),
  ]);

  return NextResponse.json({
    id,
    username,
    avatarUrl,
    followerCount: followerRes.count ?? 0,
    followingCount: followingRes.count ?? 0,
    findCount: posts.length,
    posts,
  });
}
