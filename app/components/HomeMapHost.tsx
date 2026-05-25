"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { CloverLoadingScreen } from "@/app/components/CloverLoadingScreen";
import { HomeMapClient } from "@/app/components/HomeMapClient";
import { HomeMapFilterDropdown } from "@/app/components/HomeMapFilterDropdown";

/** Keeps the globe mounted while browsing other clover routes (faster nav back). */
export function HomeMapHost() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main
      className={`map-area map-area--finds home-map-host${isHome ? "" : " home-map-host--parked"}`}
      aria-hidden={!isHome}
    >
      {isHome ? (
        <Suspense fallback={null}>
          <HomeMapFilterDropdown />
        </Suspense>
      ) : null}
      <Suspense fallback={<CloverLoadingScreen />}>
        <HomeMapClient active={isHome} />
      </Suspense>
    </main>
  );
}
