import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { isSupabaseReady } from "@/lib/supabase/env";
import { getCachedUser } from "@/lib/supabase/cachedUser";
import { ClovermediaFeed, type FeedPost } from "./ClovermediaFeed";

export const metadata = {
  title: "Clovermedia — Cloverfinder"
};

export default async function ClovermediaPage() {
  if (!isSupabaseReady()) {
    return (
      <main className="clovermedia-page">
        <p className="profile-panel-muted">Configure Supabase to load the community gallery.</p>
        <Link href="/">Home</Link>
      </main>
    );
  }

  const supabase = await createSupabaseServerComponentClient();

  // Try the RPC first (includes user info), fall back to direct query
  type FeedRow = {
    id: string;
    user_id: string;
    title: string;
    description: string;
    image_path: string;
    leaf_count: number | null;
    lat: number;
    lng: number;
    created_at: string;
    username: string;
    avatar_url: string | null;
    like_count: number;
    comment_count: number;
  };

  let rows: FeedRow[] = [];
  let error: { message: string } | null = null;

  const rpc = await supabase.rpc("get_clovermedia_feed", { lim: 96 });
  if (rpc.error) {
    // RPC not set up yet — fall back to direct query (no user info)
    const fallback = await supabase
      .from("finds")
      .select("id,user_id,title,description,image_path,leaf_count,lat,lng,created_at")
      .eq("share_clovermedia", true)
      .not("image_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(96);

    if (fallback.error) {
      error = fallback.error;
    } else {
      rows = (fallback.data ?? []).map((r) => {
        const raw = r as Omit<FeedRow, "username" | "avatar_url" | "like_count" | "comment_count">;
        return {
          ...raw,
          username: "Finder",
          avatar_url: null,
          like_count: 0,
          comment_count: 0,
        };
      });
    }
  } else {
    rows = (rpc.data ?? []) as FeedRow[];
  }

  if (error) {
    const missingTable =
      error.message.includes("schema cache") ||
      error.message.includes("Could not find the table");
    return (
      <main className="clovermedia-page">
        <p className="error">{error.message}</p>
        {missingTable ? (
          <div className="profile-panel-muted clovermedia-setup-hint" style={{ marginTop: "1rem" }}>
            <p>
              <strong>Fix:</strong> In the Supabase project that matches{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code> in <code>.env.local</code>:
            </p>
            <ol style={{ lineHeight: 1.6, paddingLeft: "1.25rem" }}>
              <li>Open <strong>SQL Editor</strong> → New query</li>
              <li>
                Paste and run <code>supabase/sql/ensure_finds_table.sql</code> from this repo
                (or the full <code>cloverfinder_finds_badges_media.sql</code>)
              </li>
              <li>
                In <strong>Table Editor</strong>, confirm <code>finds</code> appears under{" "}
                <code>public</code>
              </li>
              <li>Reload this page (wait ~30s if the error persists)</li>
            </ol>
            <p>
              Check setup:{" "}
              <Link href="/api/health/supabase">/api/health/supabase</Link> should show{" "}
              <code>findsTableReady: true</code>.
            </p>
          </div>
        ) : null}
        <p style={{ marginTop: "1rem" }}>
          <Link href="/">Home</Link>
        </p>
      </main>
    );
  }

  // Get current user + who they follow + what they liked
  const currentUser = await getCachedUser();
  let followingSet = new Set<string>();
  let likedSet = new Set<string>();
  if (currentUser) {
    const [followRes, likesRes] = await Promise.all([
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUser.id),
      supabase
        .from("likes")
        .select("find_id")
        .eq("user_id", currentUser.id),
    ]);
    if (followRes.data) {
      followingSet = new Set(followRes.data.map((r) => r.following_id as string));
    }
    if (likesRes.data) {
      likedSet = new Set(likesRes.data.map((r) => r.find_id as string));
    }
  }

  // Build feed posts
  const posts: FeedPost[] = rows.map((r) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from("finds").getPublicUrl(r.image_path);
    return {
      id: r.id,
      userId: r.user_id,
      username: r.username,
      avatarUrl: r.avatar_url,
      title: r.title || "Find",
      description: r.description || "",
      likeCount: r.like_count ?? 0,
      commentCount: r.comment_count ?? 0,
      leafCount: r.leaf_count,
      lat: r.lat,
      lng: r.lng,
      src: publicUrl,
      createdAt: r.created_at,
    };
  });

  return (
    <ClovermediaFeed
      posts={posts}
      currentUserId={currentUser?.id ?? null}
      initialFollowing={[...followingSet]}
      initialLiked={[...likedSet]}
    />
  );
}
