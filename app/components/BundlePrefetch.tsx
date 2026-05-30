"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { prefetchLeaflet } from "@/lib/loadLeaflet";
import { prefetchMapLibre } from "@/lib/loadMapLibre";

/** Warm heavy map bundles early; only on routes that use maps. */
export function BundlePrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/map" || pathname.startsWith("/protected")) {
      prefetchMapLibre();
      prefetchLeaflet();
    }
    if (pathname === "/map") {
      void import("@/lib/prefetchLeaderboard").then((m) => m.prefetchMapFinds());
    }
    if (pathname === "/map" || pathname === "/leaderboard") {
      void import("@/lib/prefetchLeaderboard").then((m) => m.prefetchLeaderboard("all"));
    }
  }, [pathname]);

  return null;
}
