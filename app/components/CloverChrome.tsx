"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/app/components/AccountMenu";
import { CloverLogo } from "@/app/components/CloverLogo";
import { prefetchLeaderboard, prefetchMapFinds } from "@/lib/prefetchLeaderboard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseReady } from "@/lib/supabase/env";

export type CloverChromeUser = {
  email: string;
  username: string | null;
  avatarUrl: string | null;
} | null;

type Props = {
  user?: CloverChromeUser;
};

export function CloverChrome({ user: userProp }: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState<CloverChromeUser>(userProp ?? null);

  useEffect(() => {
    if (userProp !== undefined) {
      setUser(userProp);
      return;
    }
    if (!isSupabaseReady()) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (!u?.email) {
        setUser(null);
        return;
      }
      setUser({
        email: u.email,
        username: typeof u.user_metadata?.username === "string" ? u.user_metadata.username : null,
        avatarUrl:
          typeof u.user_metadata?.avatar_url === "string" ? u.user_metadata.avatar_url : null
      });
    });
  }, [userProp]);

  const displayName =
    user?.username || (user?.email ? user.email.split("@")[0] : null) || "Account";

  const navClass = (path: string) => (pathname === path ? "active" : undefined);
  const profileActive =
    pathname === "/protected" || pathname.startsWith("/protected/");

  return (
    <header className="hero">
      <div className="hero-top">
        <Link className="logo-link" href="/" aria-label="Go to CloverFinder homepage">
          <CloverLogo />
        </Link>
        <div className="hero-text">
          <h1>CloverFinder</h1>
          <p>
            look at where people find their clovers, you might find some of your own there!
          </p>
        </div>
        <div className="auth-controls">
          {user ? (
            <AccountMenu
              displayName={displayName}
              avatarUrl={user.avatarUrl}
              headerSlot
              headerActive={profileActive}
            />
          ) : (
            <>
              <Link className="auth-toggle" href="/auth/sign-up">
                Sign Up
              </Link>
              <Link className="auth-toggle" href="/auth/log-in">
                Log In
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="page-nav" aria-label="Main page links">
        <Link href="/" className={navClass("/")} prefetch>
          Home
        </Link>
        <Link
          href="/map"
          className={navClass("/map")}
          prefetch
          onMouseEnter={() => prefetchMapFinds("all")}
          onFocus={() => prefetchMapFinds("all")}
        >
          Map
        </Link>
        <Link href="/clovermedia" className={navClass("/clovermedia")} prefetch>
          Clovermedia
        </Link>
        <Link
          href="/leaderboard"
          className={navClass("/leaderboard")}
          prefetch
          onMouseEnter={() => prefetchLeaderboard("all")}
          onFocus={() => prefetchLeaderboard("all")}
        >
          Leaderboard
        </Link>
        <Link href="/challenges" className={navClass("/challenges")} prefetch>
          Challenges
        </Link>
      </nav>
    </header>
  );
}
