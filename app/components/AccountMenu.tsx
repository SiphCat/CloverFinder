"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/app/components/LogoutButton";

type Props = {
  displayName: string;
  avatarUrl: string | null;
  /** Render in the header auth area (Sign Up / Log In slot). */
  headerSlot?: boolean;
  headerActive?: boolean;
};

export function AccountMenu({
  displayName,
  avatarUrl,
  headerSlot = false,
  headerActive = false
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className={[
        "account-menu-wrap",
        open ? "account-menu-open" : "",
        headerSlot ? "account-menu-wrap--header" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      ref={wrapRef}
    >
      <button
        type="button"
        className={["account-chip", headerActive ? "active" : ""].filter(Boolean).join(" ")}
        aria-label="Your account menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="account-chip-avatar" />
        ) : (
          <span className="account-icon" aria-hidden>
            👤
          </span>
        )}
        <span>{displayName}</span>
        <span className="account-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="account-dropdown-panel" role="menu">
          <Link
            href="/protected"
            className="account-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/protected/post-finds"
            className="account-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Post your finds
          </Link>
          <Link
            href="/protected/settings"
            className="account-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <LogoutButton
            plain
            className="account-dropdown-item account-dropdown-logout"
            role="menuitem"
            onBeforeLogout={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
