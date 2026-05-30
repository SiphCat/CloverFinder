"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CloverLoadingScreen } from "@/app/components/CloverLoadingScreen";
import type { GlobeFindsMapMarker } from "@/app/components/GlobeFindsMap";
import { geoJsonToMarkers } from "@/lib/mapFindsGeoJson";
import type { MapFindsFeatureCollection } from "@/lib/mapFindsGeoJson";
import { LEAF_FILTERS, parseLeafFilter } from "@/lib/leaderboardFilters";
import { isSupabaseReady } from "@/lib/supabase/env";

const GlobeFindsMap = dynamic(
  () => import("@/app/components/GlobeFindsMap").then((m) => m.GlobeFindsMap),
  {
    ssr: false,
    loading: () => <CloverLoadingScreen />
  }
);

type Props = {
  active?: boolean;
};

export function HomeMapClient({ active = true }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const leaves = parseLeafFilter(searchParams.get("leaves"));
  const filterLabel = LEAF_FILTERS.find((f) => f.value === leaves)?.label ?? "All clovers";

  const [markers, setMarkers] = useState<GlobeFindsMapMarker[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isSupabaseReady()) {
        if (!cancelled) setReady(true);
        return;
      }

      setLoading(true);
      try {
        const qs = leaves === "all" ? "" : `?leaves=${encodeURIComponent(leaves)}`;
        const res = await fetch(`/api/map/finds${qs}`);
        const data = (await res.json().catch(() => null)) as
          | MapFindsFeatureCollection
          | { error?: string };

        if (!cancelled && res.ok && data && "features" in data) {
          setMarkers(geoJsonToMarkers(data));
        } else if (!cancelled) {
          setMarkers([]);
        }
      } catch {
        if (!cancelled) setMarkers([]);
      }

      if (!cancelled) {
        setLoading(false);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [leaves]);

  const pinCount = markers.length;

  return (
    <>
      <GlobeFindsMap
        markers={markers}
        className="home-finds-map globe-finds-map"
        resetToDefaultOnPopupClose
        viewResetKey={active && pathname === "/map" ? `${pathname}-${leaves}` : undefined}
        active={active}
      />
      {ready && !loading && pinCount > 0 ? (
        <p className="home-finds-map-hint">
          {pinCount.toLocaleString()} {filterLabel.toLowerCase()} find{pinCount === 1 ? "" : "s"} on the
          map — zoom in to explore clusters.
        </p>
      ) : null}
      {ready && !loading && pinCount === 0 ? (
        <p className="home-finds-map-hint">
          No {leaves === "all" ? "" : `${filterLabel.toLowerCase()} `}
          finds on the map yet.
          {leaves !== "all"
            ? " Try All clovers, or post a find with a clover photo so we can detect the leaf count."
            : " Sign in and post a find to add the first pin."}
        </p>
      ) : null}
    </>
  );
}
