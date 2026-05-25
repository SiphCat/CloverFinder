"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { initLeafletIcons } from "@/lib/initLeafletIcons";
import { loadLeaflet } from "@/lib/loadLeaflet";
import { CloverLoadingScreen } from "@/app/components/CloverLoadingScreen";

type Props = {
  initialLat: number;
  initialLng: number;
  onPositionChange: (lat: number, lng: number) => void;
};

export function PostFindsMap({ initialLat, initialLng, onPositionChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const cbRef = useRef(onPositionChange);
  cbRef.current = onPositionChange;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const leaflet = await loadLeaflet();
      const L = leaflet;
      if (cancelled || !wrapRef.current || mapRef.current) return;
      initLeafletIcons(leaflet);

      const map = L.map(wrapRef.current).setView([initialLat, initialLng], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

      const sync = () => {
        const p = marker.getLatLng();
        cbRef.current(p.lat, p.lng);
      };
      sync();
      marker.on("dragend", sync);
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        sync();
      });

      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      setReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [initialLat, initialLng]);

  return (
    <div ref={wrapRef} className="post-finds-map" aria-busy={!ready}>
      {!ready ? <CloverLoadingScreen label="Loading map…" /> : null}
    </div>
  );
}
