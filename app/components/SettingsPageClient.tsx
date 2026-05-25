"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileAppSettings } from "@/app/components/ProfileAppSettings";
import { SettingsAccountForms } from "@/app/components/SettingsAccountForms";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseReady } from "@/lib/supabase/env";

export function SettingsPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseReady()) {
      router.replace("/");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace("/auth/log-in?next=/protected/settings");
        return;
      }
      setEmail(user.email ?? "");
      setUsername(typeof user.user_metadata?.username === "string" ? user.user_metadata.username : "");
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <>
        <h1 className="profile-panel-title">Settings</h1>
        <p className="profile-panel-muted">Loading…</p>
      </>
    );
  }

  return (
    <>
      <h1 className="profile-panel-title">Settings</h1>
      <p className="profile-panel-muted">
        App preferences (language, layout, notifications) are stored in this browser. Account details
        use your Cloverfinder sign-in.
      </p>
      <ProfileAppSettings />
      <h2 className="profile-section-heading">Account</h2>
      <p className="profile-panel-muted">Update your username, email, or password.</p>
      <SettingsAccountForms initialEmail={email} initialUsername={username} />
    </>
  );
}
