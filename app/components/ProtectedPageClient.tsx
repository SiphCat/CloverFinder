"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AwardsSection, type BadgeRow } from "@/app/components/AwardsSection";
import { ProfileAvatarPanel } from "@/app/components/ProfileAvatarPanel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseReady } from "@/lib/supabase/env";

export function ProtectedPageClient() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [badges, setBadges] = useState<BadgeRow[] | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseReady()) {
      router.replace("/");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        router.replace("/auth/log-in");
        return;
      }
      setUserId(user.id);
      setAvatarUrl(
        typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null
      );

      const { data } = await supabase
        .from("user_badges")
        .select("id, badge_id, proof_image_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setBadges((data ?? []) as BadgeRow[]);
    })();
  }, [router]);

  if (!userId) {
    return (
      <div className="profile-dashboard">
        <header className="profile-dashboard-head">
          <div className="profile-dashboard-intro">
            <h1 className="profile-dashboard-title">Your profile</h1>
            <p className="profile-panel-muted">Loading…</p>
          </div>
        </header>
        <AwardsSection />
      </div>
    );
  }

  return (
    <div className="profile-dashboard">
      <header className="profile-dashboard-head">
        <ProfileAvatarPanel userId={userId} initialAvatarUrl={avatarUrl} compact />
        <div className="profile-dashboard-intro">
          <h1 className="profile-dashboard-title">Your profile</h1>
          <p className="profile-panel-muted">
            Update your photo, scan clovers for badges, and post finds on the map.
          </p>
        </div>
      </header>
      <AwardsSection initialRows={badges} />
    </div>
  );
}
