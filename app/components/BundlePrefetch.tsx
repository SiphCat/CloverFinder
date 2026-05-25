"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { prefetchLeaflet } from "@/lib/loadLeaflet";
import { prefetchMapLibre } from "@/lib/loadMapLibre";

/** Warm heavy map bundles early; only on routes that use maps. */
export function BundlePrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/protected")) {
      prefetchMapLibre();
      prefetchLeaflet();
    }
    if (pathname === "/") {
      void import("@/lib/prefetchLeaderboard").then((m) => m.prefetchMapFinds());
    }
    if (pathname === "/" || pathname === "/leaderboard") {
      void import("@/lib/prefetchLeaderboard").then((m) => m.prefetchLeaderboard("all"));
    }
  }, [pathname]);

  return null;
}
