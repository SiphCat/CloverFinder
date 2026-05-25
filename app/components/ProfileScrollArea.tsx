"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Scroll only when content is taller than the profile pane — no empty scroll past the end. */
export function ProfileScrollArea({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function syncScroll() {
      const node = ref.current;
      if (!node) return;
      const overflows = node.scrollHeight > node.clientHeight + 2;
      node.style.overflowY = overflows ? "auto" : "hidden";
    }

    syncScroll();
    const ro = new ResizeObserver(syncScroll);
    ro.observe(el);
    for (const child of el.children) {
      ro.observe(child);
    }
    window.addEventListener("resize", syncScroll);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncScroll);
    };
  }, [children]);

  return (
    <div ref={ref} className="app-chrome-main app-chrome-main--profile">
      <div className="profile-panel profile-panel--shell">{children}</div>
    </div>
  );
}
