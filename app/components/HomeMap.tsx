"use client";

import { usePathname } from "next/navigation";
import { GlobeFindsMap } from "@/app/components/GlobeFindsMap";
import type { GlobeFindsMapMarker } from "@/app/components/GlobeFindsMap";

type Props = {
  markers: GlobeFindsMapMarker[];
  signedIn: boolean;
};

export function HomeMap({ markers, signedIn }: Props) {
  const pathname = usePathname();

  return (
    <>
      <GlobeFindsMap
        markers={markers}
        className="home-finds-map globe-finds-map"
        resetToDefaultOnPopupClose
        viewResetKey={pathname === "/" ? pathname : undefined}
      />
      {signedIn && markers.length === 0 ? (
        <p className="home-finds-map-hint">Your saved finds will appear here as pins.</p>
      ) : null}
      {!signedIn ? (
        <p className="home-finds-map-hint">Sign in and post finds to see them on the map.</p>
      ) : null}
    </>
  );
}
