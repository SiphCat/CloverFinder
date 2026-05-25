"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const items: { href: string; label: string; danger?: boolean }[] = [
  { href: "/protected", label: "Main" },
  { href: "/protected/post-finds", label: "Post finds" },
  { href: "/protected/badges", label: "Badges" },
  { href: "/protected/settings", label: "Settings" },
  { href: "/protected/delete-account", label: "Delete profile", danger: true }
];

export function ProtectedSidebar() {
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = asideRef.current;
    if (!el) return;

    const aside = el;

    function onWheel(e: WheelEvent) {
      const canScroll = aside.scrollHeight > aside.clientHeight + 1;
      if (!canScroll) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const atTop = aside.scrollTop <= 0;
      const atBottom = aside.scrollTop + aside.clientHeight >= aside.scrollHeight - 1;
      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const isActive = (href: string) => {
    const norm = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const h = href.endsWith("/") ? href.slice(0, -1) : href;
    return norm === h;
  };

  return (
    <aside ref={asideRef} className="protected-sidebar" aria-label="Profile sections">
      <p className="protected-sidebar-title">Profile</p>
      <nav className="protected-sidebar-nav">
        {items.map(({ href, label, danger }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={[
                "protected-sidebar-link",
                active ? "active" : "",
                danger ? "protected-sidebar-link--danger" : ""
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
