"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";

export type FeedPost = {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  title: string;
  description: string;
  leafCount: number | null;
  likeCount: number;
  commentCount: number;
  lat: number;
  lng: number;
  src: string;
  createdAt: string;
};

type Comment = {
  id: string;
  body: string;
  username: string;
  created_at: string;
};

type Props = {
  posts: FeedPost[];
  currentUserId: string | null;
  initialFollowing: string[];
  initialLiked: string[];
};

export function ClovermediaFeed({
  posts,
  currentUserId,
  initialFollowing,
  initialLiked,
}: Props) {
  const [following, setFollowing] = useState(() => new Set(initialFollowing));
  const [liked, setLiked] = useState(() => new Set(initialLiked));
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [mapPost, setMapPost] = useState<FeedPost | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<import("maplibre-gl").Map | null>(null);
  const router = useRouter();

  const toggleFollow = useCallback(
    async (userId: string) => {
      if (!currentUserId || busy.has(`f-${userId}`)) return;
      setBusy((s) => new Set(s).add(`f-${userId}`));
      const isFollowing = following.has(userId);
      try {
        const res = await fetch("/api/follows", {
          method: isFollowing ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ following_id: userId }),
        });
        if (res.ok) {
          setFollowing((s) => {
            const next = new Set(s);
            if (isFollowing) next.delete(userId);
            else next.add(userId);
            return next;
          });
        }
      } catch {
        /* */
      } finally {
        setBusy((s) => {
          const next = new Set(s);
          next.delete(`f-${userId}`);
          return next;
        });
      }
    },
    [currentUserId, following, busy]
  );

  const toggleLike = useCallback(
    async (findId: string) => {
      if (!currentUserId || busy.has(`l-${findId}`)) return;
      setBusy((s) => new Set(s).add(`l-${findId}`));
      const isLiked = liked.has(findId);
      try {
        const res = await fetch("/api/likes", {
          method: isLiked ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ find_id: findId }),
        });
        if (res.ok) {
          setLiked((s) => {
            const next = new Set(s);
            if (isLiked) next.delete(findId);
            else next.add(findId);
            return next;
          });
        }
      } catch {
        /* */
      } finally {
        setBusy((s) => {
          const next = new Set(s);
          next.delete(`l-${findId}`);
          return next;
        });
      }
    },
    [currentUserId, liked, busy]
  );

  const openComments = useCallback(
    async (findId: string) => {
      if (commentOpen === findId) {
        setCommentOpen(null);
        return;
      }
      setCommentOpen(findId);
      setCommentText("");

      if (!comments[findId]) {
        setCommentLoading(true);
        try {
          const res = await fetch(`/api/comments?find_id=${findId}`);
          const data = await res.json();
          setComments((prev) => ({
            ...prev,
            [findId]: data.comments ?? [],
          }));
        } catch {
          setComments((prev) => ({ ...prev, [findId]: [] }));
        }
        setCommentLoading(false);
      }

      setTimeout(() => commentInputRef.current?.focus(), 100);
    },
    [commentOpen, comments]
  );

  const submitComment = useCallback(
    async (findId: string) => {
      const text = commentText.trim();
      if (!text || !currentUserId) return;
      setCommentText("");
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ find_id: findId, body: text }),
        });
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => ({
            ...prev,
            [findId]: [...(prev[findId] ?? []), data.comment],
          }));
        }
      } catch {
        /* */
      }
    },
    [commentText, currentUserId]
  );

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  // Create/destroy mini-map when viewing a find on map
  useEffect(() => {
    if (!mapPost) {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
      return;
    }

    const el = miniMapRef.current;
    if (!el) return;

    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !miniMapRef.current) return;

      const map = new maplibregl.Map({
        container: miniMapRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap contributors",
            },
          },
          layers: [
            { id: "osm", type: "raster", source: "osm", minzoom: 0, maxzoom: 20 },
          ],
        },
        center: [mapPost.lng, mapPost.lat],
        zoom: 15,
        maxZoom: 18,
        minZoom: 2,
      });

      const markerEl = document.createElement("div");
      markerEl.className = "cm-map-marker";

      new maplibregl.Marker({ element: markerEl })
        .setLngLat([mapPost.lng, mapPost.lat])
        .addTo(map);

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right"
      );
      map.addControl(
        new maplibregl.ScaleControl({ unit: "imperial" }),
        "bottom-left"
      );

      miniMapInstanceRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, [mapPost]);

  // Close comments and map when scrolling to a new slide
  useEffect(() => {
    if (!commentOpen && !mapPost) return;
    const handleScroll = () => {
      setCommentOpen(null);
      setMapPost(null);
    };
    const scrollEl = document.querySelector(".cm-feed-scroll");
    scrollEl?.addEventListener("scroll", handleScroll, { once: true });
    return () => scrollEl?.removeEventListener("scroll", handleScroll);
  }, [commentOpen, mapPost]);

  if (posts.length === 0) {
    return (
      <main className="cm-feed-page">
        <p
          className="profile-panel-muted"
          style={{ padding: "2rem 1rem", textAlign: "center" }}
        >
          No public photos yet. Post a find with a photo and opt in from your
          profile &rarr; Post finds.
        </p>
      </main>
    );
  }

  return (
    <div className="cm-feed-page">
      <div className="cm-feed-scroll">
        {posts.map((post) => {
          const isSelf = currentUserId === post.userId;
          const isFollowing = following.has(post.userId);
          const isLiked = liked.has(post.id);
          const isCommentsOpen = commentOpen === post.id;
          const postComments = comments[post.id] ?? [];

          return (
            <div key={post.id} className="cm-slide">
              <img
                src={post.src}
                alt={post.title}
                className="cm-slide-img"
                loading="lazy"
              />
              <div className="cm-slide-overlay" />

              {/* Right-side action buttons */}
              <div className="cm-slide-actions">
                {currentUserId ? (
                  <button
                    className={`cm-action-btn ${isLiked ? "cm-action-btn--active" : ""}`}
                    onClick={() => toggleLike(post.id)}
                    disabled={busy.has(`l-${post.id}`)}
                    aria-label={isLiked ? "Unlike" : "Like"}
                  >
                    <svg viewBox="0 0 24 24" className="cm-action-icon">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill={isLiked ? "#ef4444" : "none"}
                        stroke={isLiked ? "#ef4444" : "white"}
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="cm-action-count">{post.likeCount + (isLiked && !initialLiked.includes(post.id) ? 1 : 0)}</span>
                  </button>
                ) : (
                  <div className="cm-action-btn cm-action-btn--static">
                    <svg viewBox="0 0 24 24" className="cm-action-icon">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="cm-action-count">{post.likeCount}</span>
                  </div>
                )}

                {/* Comment button */}
                <button
                  className={`cm-action-btn ${isCommentsOpen ? "cm-action-btn--active" : ""}`}
                  onClick={() => openComments(post.id)}
                  aria-label="Comments"
                >
                  <svg viewBox="0 0 24 24" className="cm-action-icon">
                    <path
                      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="cm-action-count">{post.commentCount}</span>
                </button>

                {/* See on map */}
                <button
                  className="cm-action-btn"
                  onClick={() => setMapPost(mapPost?.id === post.id ? null : post)}
                  aria-label="See on map"
                >
                  <svg viewBox="0 0 24 24" className="cm-action-icon">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>
                </button>

                {/* Profile avatar */}
                <button
                  className="cm-action-btn cm-action-btn--avatar"
                  onClick={() => router.push(`/user/${post.userId}`)}
                  aria-label={`View ${post.username}'s profile`}
                >
                  {post.avatarUrl ? (
                    <img
                      src={post.avatarUrl}
                      alt=""
                      className="cm-action-avatar"
                    />
                  ) : (
                    <span className="cm-action-avatar cm-action-avatar--placeholder">
                      {post.username[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </button>
              </div>

              {/* Bottom info */}
              <div className="cm-slide-info">
                <div className="cm-slide-user-row">
                  <span className="cm-slide-username">{post.username}</span>
                  <span className="cm-slide-time">
                    {timeAgo(post.createdAt)}
                  </span>
                  {currentUserId && !isSelf ? (
                    <button
                      className={`cm-slide-follow ${isFollowing ? "cm-slide-follow--active" : ""}`}
                      onClick={() => toggleFollow(post.userId)}
                      disabled={busy.has(`f-${post.userId}`)}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  ) : null}
                </div>
                <p className="cm-slide-title">{post.title}</p>
                {post.leafCount ? (
                  <span className="cm-slide-leaves">
                    {post.leafCount} leaves
                  </span>
                ) : null}
                {post.description ? (
                  <p className="cm-slide-desc">{post.description}</p>
                ) : null}
              </div>

              {/* Comment panel */}
              {isCommentsOpen ? (
                <div className="cm-comments-panel">
                  <div className="cm-comments-header">
                    <span className="cm-comments-title">Comments</span>
                    <button
                      className="cm-comments-close"
                      onClick={() => setCommentOpen(null)}
                    >
                      &times;
                    </button>
                  </div>

                  <div className="cm-comments-list">
                    {commentLoading ? (
                      <p className="cm-comments-empty">Loading…</p>
                    ) : postComments.length === 0 ? (
                      <p className="cm-comments-empty">
                        No comments yet. Be the first!
                      </p>
                    ) : (
                      postComments.map((c) => (
                        <div key={c.id} className="cm-comment">
                          <span className="cm-comment-user">{c.username}</span>
                          <span className="cm-comment-body">{c.body}</span>
                          <span className="cm-comment-time">
                            {timeAgo(c.created_at)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {currentUserId ? (
                    <form
                      className="cm-comment-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitComment(post.id);
                      }}
                    >
                      <input
                        ref={commentInputRef}
                        className="cm-comment-input"
                        type="text"
                        placeholder="Add a comment…"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        maxLength={500}
                      />
                      <button
                        className="cm-comment-send"
                        type="submit"
                        disabled={!commentText.trim()}
                      >
                        Post
                      </button>
                    </form>
                  ) : (
                    <p className="cm-comments-empty" style={{ padding: "0.5rem 0.75rem" }}>
                      Log in to comment
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Map popup overlay */}
      {mapPost ? (
        <div className="cm-map-overlay">
          <div className="cm-map-modal">
            <div className="cm-map-header">
              <span className="cm-map-title">{mapPost.title}</span>
              <button
                className="cm-map-close"
                onClick={() => setMapPost(null)}
              >
                &times;
              </button>
            </div>
            <div ref={miniMapRef} className="cm-map-container" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
