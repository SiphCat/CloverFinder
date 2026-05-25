import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { isSupabaseReady } from "@/lib/supabase/env";
import { getCachedUser } from "@/lib/supabase/cachedUser";
import { UserProfile } from "./UserProfile";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Profile — Cloverfinder`, description: `User profile ${id}` };
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseReady()) {
    return (
      <main className="map-area credits-area">
        <section className="credits-card">
          <p>Configure Supabase to view profiles.</p>
          <Link href="/">Home</Link>
        </section>
      </main>
    );
  }

  const supabase = await createSupabaseServerComponentClient();

  // Fetch user info
  let username = "Finder";
  let avatarUrl: string | null = null;
  try {
    const { data } = await supabase.rpc("get_public_profile", { uid: id });
    if (data?.[0]) {
      username = data[0].username;
      avatarUrl = data[0].avatar_url;
    }
  } catch {
    try {
      const { data } = await supabase.rpc("get_username_for_user", { uid: id });
      if (data) username = data;
    } catch {
      /* */
    }
  }

  // Fetch public finds
  const { data: finds } = await supabase
    .from("finds")
    .select("id, title, description, image_path, leaf_count, lat, lng, created_at")
    .eq("user_id", id)
    .eq("share_clovermedia", true)
    .not("image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (finds ?? []).map((f) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from("finds").getPublicUrl(f.image_path);
    return {
      id: f.id,
      title: f.title || "Find",
      imageUrl: publicUrl,
      leafCount: f.leaf_count as number | null,
      lat: f.lat as number,
      lng: f.lng as number,
      createdAt: f.created_at as string,
    };
  });

  // Follower/following counts
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

  // Check if current user follows this person
  const currentUser = await getCachedUser();
  let isFollowing = false;
  if (currentUser && currentUser.id !== id) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", id)
      .maybeSingle();
    isFollowing = !!followRow;
  }

  return (
    <UserProfile
      userId={id}
      username={username}
      avatarUrl={avatarUrl}
      followerCount={followerRes.count ?? 0}
      followingCount={followingRes.count ?? 0}
      posts={posts}
      currentUserId={currentUser?.id ?? null}
      initialFollowing={isFollowing}
    />
  );
}
