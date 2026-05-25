"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { initLeafletIcons } from "@/lib/initLeafletIcons";
import { loadLeaflet } from "@/lib/loadLeaflet";
import { CloverLoadingScreen } from "@/app/components/CloverLoadingScreen";
import {
  applyWrappedWorldView,
  constrainMapLatitude,
  syncWrappedWorldLimits
} from "@/lib/mapWorldView";

export type FindsMapMarker = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  description?: string;
};

type Props = {
  markers: FindsMapMarker[];
  className?: string;
  defaultLat?: number;
  defaultLng?: number;
  defaultZoom?: number;
  /** When false, map stays at default zoom/center (markers only). */
  fitToMarkers?: boolean;
  /** Avoid panning/zooming when a pin popup opens (home map). */
  popupAutoPan?: boolean;
  /** Return to default center/zoom when a pin popup closes. */
  resetToDefaultOnPopupClose?: boolean;
  /** Bump to force default center/zoom (e.g. navigating back to home). */
  viewResetKey?: string | number;
  /** Wrap horizontally; min zoom fills top/bottom only (home map). */
  fitWorldView?: boolean;
};

const DEFAULT_LAT = 51.505;
const DEFAULT_LNG = -0.09;
const DEFAULT_ZOOM = 5;

export function FindsMap({
  markers,
  className = "finds-map",
  defaultLat = DEFAULT_LAT,
  defaultLng = DEFAULT_LNG,
  defaultZoom = DEFAULT_ZOOM,
  fitToMarkers = false,
  popupAutoPan = true,
  resetToDefaultOnPopupClose = false,
  viewResetKey,
  fitWorldView = false
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const defaultViewRef = useRef({ lat: defaultLat, lng: defaultLng, zoom: defaultZoom });
  const fitWorldViewRef = useRef(fitWorldView);
  const [ready, setReady] = useState(false);

  defaultViewRef.current = { lat: defaultLat, lng: defaultLng, zoom: defaultZoom };
  fitWorldViewRef.current = fitWorldView;

  const applyDefaultView = (animate = false) => {
    const map = mapRef.current;
    if (!map) return;
    if (fitWorldViewRef.current) {
      const { lat, lng } = defaultViewRef.current;
      applyWrappedWorldView(map, lat, lng, animate);
      return;
    }
    const { lat, lng, zoom } = defaultViewRef.current;
    map.setView([lat, lng], zoom, { animate });
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const leaflet = await loadLeaflet();
      const L = leaflet;
      if (cancelled || !wrapRef.current) return;
      initLeafletIcons(leaflet);

      if (!mapRef.current) {
        const map = L.map(wrapRef.current, {
          ...(fitWorldView ? { worldCopyJump: true } : {})
        }).setView([defaultLat, defaultLng], defaultZoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setReady(true);
      }

      const map = mapRef.current!;
      const group = layerRef.current!;
      group.clearLayers();

      if (markers.length === 0) {
        applyDefaultView();
        return;
      }

      for (const m of markers) {
        const marker = L.marker([m.lat, m.lng]).addTo(group);
        const desc = m.description?.trim();
        const html = desc
          ? `<strong>${escapeHtml(m.title)}</strong><br/>${escapeHtml(desc)}`
          : `<strong>${escapeHtml(m.title)}</strong>`;
        marker.bindPopup(html, { autoPan: popupAutoPan });
        if (resetToDefaultOnPopupClose) {
          marker.on("popupclose", () => applyDefaultView(true));
        }
      }

      if (fitToMarkers) {
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
        if (markers.length === 1) {
          map.setView([markers[0].lat, markers[0].lng], 13);
        } else {
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
        }
      } else {
        applyDefaultView();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    markers,
    defaultLat,
    defaultLng,
    defaultZoom,
    fitToMarkers,
    popupAutoPan,
    resetToDefaultOnPopupClose,
    fitWorldView
  ]);

  useEffect(() => {
    if (!fitWorldView || !ready) return;
    const map = mapRef.current;
    if (!map) return;

    const syncLimits = () => syncWrappedWorldLimits(map);

    const onDragEnd = () => constrainMapLatitude(map);

    syncLimits();
    map.on("zoomend", syncLimits);
    map.on("dragend", onDragEnd);

    const wrap = wrapRef.current;
    if (!wrap) {
      return () => {
        map.off("zoomend", syncLimits);
        map.off("dragend", onDragEnd);
      };
    }

    const ro = new ResizeObserver(syncLimits);
    ro.observe(wrap);

    return () => {
      map.off("zoomend", syncLimits);
      map.off("dragend", onDragEnd);
      ro.disconnect();
    };
  }, [fitWorldView, ready]);

  useEffect(() => {
    if (viewResetKey === undefined) return;
    applyDefaultView();
  }, [viewResetKey]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-busy={!ready}>
      {!ready ? <CloverLoadingScreen label="Loading map…" /> : null}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
