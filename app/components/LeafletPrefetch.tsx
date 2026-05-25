"use client";

import { useEffect } from "react";
import { prefetchMapLibre } from "@/lib/loadMapLibre";
import { prefetchLeaflet } from "@/lib/loadLeaflet";

/** Warms map bundles as soon as the shell mounts. */
export function LeafletPrefetch() {
  useEffect(() => {
    prefetchMapLibre();
    prefetchLeaflet();
  }, []);
  return null;
}
