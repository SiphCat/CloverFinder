"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseReady } from "@/lib/supabase/env";

/** Shown when signed in but username missing — does not block layout render. */
export function UsernameSetupCallout() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      const u =
        typeof user?.user_metadata?.username === "string"
          ? user.user_metadata.username.trim()
          : "";
      setShow(Boolean(user && !u));
    });
  }, []);

  if (!show) return null;

  return (
    <div className="profile-callout" role="status">
      <p className="profile-callout-lead">
        This account does not have a Cloverfinder username yet. To sign in next time, use your{" "}
        <strong>full email address</strong> until you add a username below.
      </p>
      <p className="profile-panel-muted profile-callout-actions">
        <Link href="/protected/settings">Open Settings</Link> to choose a username — then you can sign
        in with either that username or your email.
      </p>
    </div>
  );
}
