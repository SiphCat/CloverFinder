"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type Post = {
  id: string;
  title: string;
  imageUrl: string;
  leafCount: number | null;
  lat: number;
  lng: number;
  createdAt: string;
};

type Props = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  posts: Post[];
  currentUserId: string | null;
  initialFollowing: boolean;
};

export function UserProfile({
  userId,
  username,
  avatarUrl,
  followerCount,
  followingCount,
  posts,
  currentUserId,
  initialFollowing,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(followerCount);
  const [busy, setBusy] = useState(false);
  const isSelf = currentUserId === userId;

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/follows", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: userId }),
      });
      if (res.ok) {
        setIsFollowing((f) => !f);
        setFollowers((c) => c + (isFollowing ? -1 : 1));
      }
    } catch {
      /* */
    }
    setBusy(false);
  }, [currentUserId, userId, isFollowing, busy]);

  return (
    <main className="map-area credits-area">
      <section className="credits-card user-profile-card">
        {/* Header */}
        <div className="up-header">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="up-avatar" />
          ) : (
            <span className="up-avatar up-avatar--placeholder">
              {username[0]?.toUpperCase() ?? "?"}
            </span>
          )}
          <div className="up-header-info">
            <h2 className="up-username">{username}</h2>
            <div className="up-stats">
              <span>
                <b>{posts.length}</b> finds
              </span>
              <span>
                <b>{followers}</b> followers
              </span>
              <span>
                <b>{followingCount}</b> following
              </span>
            </div>
            {currentUserId && !isSelf ? (
              <button
                className={`up-follow-btn ${isFollowing ? "up-follow-btn--following" : ""}`}
                onClick={toggleFollow}
                disabled={busy}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            ) : null}
          </div>
        </div>

        {/* Grid of finds */}
        {posts.length === 0 ? (
          <p className="up-empty">No public finds yet.</p>
        ) : (
          <div className="up-grid">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/?lat=${p.lat}&lng=${p.lng}&zoom=16`}
                className="up-grid-item"
              >
                <img src={p.imageUrl} alt={p.title} className="up-grid-img" />
                <div className="up-grid-overlay">
                  <span className="up-grid-title">{p.title}</span>
                  {p.leafCount ? (
                    <span className="up-grid-leaves">
                      {p.leafCount} leaves
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}

        <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link href="/clovermedia" style={{ color: "#86efac" }}>
            ← Back to Clovermedia
          </Link>
        </p>
      </section>
    </main>
  );
}
