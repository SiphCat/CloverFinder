"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloverLoadingScreen } from "@/app/components/CloverLoadingScreen";
import { markersToGeoJson } from "@/lib/mapFindsGeoJson";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadMapLibre } from "@/lib/loadMapLibre";
import { enableGlobeProjection } from "@/lib/mapLibreGlobe";
import { BODY_LABELS, type CelestialBodiesLayer } from "@/lib/celestialBodiesLayer";
import { SATELLITE_STYLE, NORMAL_STYLE } from "@/lib/osmMapStyle";

export type GlobeFindsMapMarker = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  description?: string;
};

type Props = {
  markers: GlobeFindsMapMarker[];
  className?: string;
  resetToDefaultOnPopupClose?: boolean;
  viewResetKey?: string | number;
  active?: boolean;
};

const DEFAULT_CENTER: [number, number] = [20, 10];
const DEFAULT_ZOOM = 1.8;
const SOURCE_ID = "finds";
const CLUSTER_LAYER = "finds-clusters";
const CLUSTER_COUNT_LAYER = "finds-cluster-count";
const POINT_LAYER = "finds-points";

export function GlobeFindsMap({
  markers,
  className = "globe-finds-map",
  resetToDefaultOnPopupClose = false,
  viewResetKey,
  active = true
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const celestialRef = useRef<CelestialBodiesLayer | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const popupRef = useRef<import("maplibre-gl").Popup | null>(null);
  const layersReadyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"satellite" | "normal">("satellite");
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");
  const scaleRef = useRef<import("maplibre-gl").ScaleControl | null>(null);

  const geoJson = useMemo(() => markersToGeoJson(markers), [markers]);

  const flyHome = useCallback((animate = true) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 15,
      bearing: 0,
      duration: animate ? 900 : 0
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const maplibregl = await loadMapLibre();
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: SATELLITE_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 1.2,
        maxZoom: 18,
        pitch: 15
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right"
      );

      const scale = new maplibregl.ScaleControl({ unit: "imperial" });
      map.addControl(scale, "bottom-left");
      scaleRef.current = scale;


      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: "280px"
      });
      popupRef.current = popup;

      if (resetToDefaultOnPopupClose) {
        popup.on("close", () => flyHome(true));
      }

      const updateLabels = () => {
        const layer = celestialRef.current;
        const container = labelsRef.current;
        if (!layer || !container) return;
        const el = map.getContainer();
        const positions = layer.getScreenPositions(el.clientWidth, el.clientHeight);
        const kids = container.children;
        for (let i = 0; i < positions.length; i++) {
          const label = kids[i] as HTMLElement | undefined;
          if (!label) continue;
          const p = positions[i];
          if (p.visible) {
            label.style.transform = `translate(${p.x}px, ${p.y}px)`;
            label.style.opacity = "1";
          } else {
            label.style.opacity = "0";
          }
        }
      };
      map.on("render", updateLabels);

      map.on("load", async () => {
        const celestial = await enableGlobeProjection(map);
        celestialRef.current = celestial;

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 42
        });

        map.addLayer({
          id: CLUSTER_LAYER,
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#4ade80",
              25,
              "#22c55e",
              100,
              "#15803d",
              500,
              "#14532d"
            ],
            "circle-radius": ["step", ["get", "point_count"], 16, 25, 20, 100, 26, 500, 32],
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(255,255,255,0.55)"
          }
        });

        map.addLayer({
          id: CLUSTER_COUNT_LAYER,
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["Open Sans Bold"],
            "text-size": 12
          },
          paint: {
            "text-color": "#052e16"
          }
        });

        map.addLayer({
          id: POINT_LAYER,
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-radius": 7,
            "circle-color": "#22c55e",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
          }
        });

        const onClusterClick = (e: import("maplibre-gl").MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature?.geometry || feature.geometry.type !== "Point") return;
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          const clusterId = feature.properties?.cluster_id;
          const source = map.getSource(SOURCE_ID) as import("maplibre-gl").GeoJSONSource;
          if (clusterId == null) return;
          void source.getClusterExpansionZoom(clusterId).then((zoom) => {
            map.easeTo({
              center: coords,
              zoom: zoom ?? map.getZoom() + 1
            });
          });
        };
        map.on("click", CLUSTER_LAYER, onClusterClick);
        map.on("click", CLUSTER_COUNT_LAYER, onClusterClick);

        map.on("click", POINT_LAYER, (e: import("maplibre-gl").MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          if (!feature?.geometry || feature.geometry.type !== "Point") return;
          const title = String(feature.properties?.title ?? "Find");
          const findId = String(feature.properties?.id ?? "");
          const coords = feature.geometry.coordinates.slice() as [number, number];

          popup
            .setLngLat(coords)
            .setHTML(
              `<div class="find-popup"><strong>${escapeHtml(title)}</strong><p class="find-popup-loading">Loading…</p></div>`
            )
            .addTo(map);

          if (findId) {
            fetch(`/api/finds/${findId}`)
              .then((r) => r.json())
              .then((d) => {
                if (!popup.isOpen()) return;
                const img = d.imageUrl
                  ? `<img src="${escapeHtml(d.imageUrl)}" alt="" class="find-popup-img" />`
                  : "";
                const leaves = d.leafCount
                  ? `<span class="find-popup-leaves">${d.leafCount} leaves</span>`
                  : "";
                const desc = d.description
                  ? `<p class="find-popup-desc">${escapeHtml(d.description)}</p>`
                  : "";
                const comments = d.commentCount > 0
                  ? `<p class="find-popup-comments">${d.commentCount} comment${d.commentCount === 1 ? "" : "s"}</p>`
                  : `<p class="find-popup-comments">No comments yet</p>`;
                popup.setHTML(
                  `<div class="find-popup">` +
                    img +
                    `<div class="find-popup-body">` +
                    `<strong>${escapeHtml(d.title || title)}</strong> ${leaves}` +
                    `<p class="find-popup-user">Posted by <b>${escapeHtml(d.username)}</b></p>` +
                    desc +
                    comments +
                    `</div></div>`
                );
              })
              .catch(() => {});
          }
        });

        for (const layer of [CLUSTER_LAYER, CLUSTER_COUNT_LAYER, POINT_LAYER]) {
          map.on("mouseenter", layer, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layer, () => {
            map.getCanvas().style.cursor = "";
          });
        }

        layersReadyRef.current = true;
        setReady(true);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
    };
  }, [resetToDefaultOnPopupClose, flyHome]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    const source = map.getSource(SOURCE_ID) as import("maplibre-gl").GeoJSONSource | undefined;
    source?.setData(geoJson);
  }, [geoJson]);

  useEffect(() => {
    if (viewResetKey === undefined) return;
    flyHome(false);
  }, [viewResetKey, flyHome]);

  useEffect(() => {
    if (!active) return;
    const map = mapRef.current;
    if (!map) return;
    requestAnimationFrame(() => map.resize());
  }, [active]);

  const switchStyle = useCallback(async (mode: "satellite" | "normal") => {
    const map = mapRef.current;
    if (!map) return;
    setMapMode(mode);
    const style = mode === "satellite" ? SATELLITE_STYLE : NORMAL_STYLE;
    map.setStyle(style);

    if (mode === "normal") {
      celestialRef.current = null;
      if (labelsRef.current) labelsRef.current.style.display = "none";
    } else {
      if (labelsRef.current) labelsRef.current.style.display = "";
    }

    map.once("style.load", async () => {
      if (mode === "normal") {
        map.setProjection({ type: "mercator" });
        map.setPitch(0);
        map.setSky({});
      } else {
        map.setProjection({ type: "globe" });
        const celestial = await enableGlobeProjection(map);
        celestialRef.current = celestial;
      }

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: geoJson,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 42
      });

      map.addLayer({
        id: CLUSTER_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#4ade80",
            25,
            "#22c55e",
            100,
            "#15803d",
            500,
            "#14532d"
          ],
          "circle-radius": ["step", ["get", "point_count"], 16, 25, 20, 100, 26, 500, 32],
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.55)"
        }
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Bold"],
          "text-size": 12
        },
        paint: { "text-color": mode === "satellite" ? "#052e16" : "#14532d" }
      });

      map.addLayer({
        id: POINT_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-color": "#22c55e",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });
    });
  }, [geoJson]);

  useEffect(() => {
    const map = mapRef.current;
    const oldScale = scaleRef.current;
    if (!map || !oldScale) return;

    map.removeControl(oldScale);
    const loadMapLibreAsync = async () => {
      const maplibregl = await loadMapLibre();
      const newScale = new maplibregl.ScaleControl({ unit: units });
      map.addControl(newScale, "bottom-left");
      scaleRef.current = newScale;
    };
    loadMapLibreAsync();
  }, [units]);

  useEffect(() => {
    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      layersReadyRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={`globe-scene-wrap ${className}`} data-map-mode={mapMode}>
      <div ref={mapContainerRef} className="globe-map-canvas" aria-busy={!ready}>
        {!ready ? <CloverLoadingScreen label="Loading globe…" /> : null}
      </div>
      {ready ? (
        <div ref={labelsRef} className="celestial-labels" aria-hidden>
          {BODY_LABELS.map((b) => (
            <span key={b.name} className="celestial-label" style={{ opacity: 0 }}>
              {b.name}
            </span>
          ))}
        </div>
      ) : null}
      {ready ? (
        <div className="globe-settings-wrap">
          <button
            className="globe-settings-btn"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
          >
            Settings
          </button>
          {settingsOpen ? (
            <div className="globe-settings-panel">
              <span className="globe-settings-heading">Map Style</span>
              <label className="globe-settings-option">
                <input
                  type="radio"
                  name="map-style"
                  checked={mapMode === "satellite"}
                  onChange={() => switchStyle("satellite")}
                />
                Satellite
              </label>
              <label className="globe-settings-option">
                <input
                  type="radio"
                  name="map-style"
                  checked={mapMode === "normal"}
                  onChange={() => switchStyle("normal")}
                />
                Normal Map
              </label>

              <span className="globe-settings-heading" style={{ marginTop: "0.6rem" }}>
                Distance Units
              </span>
              <label className="globe-settings-option">
                <input
                  type="radio"
                  name="map-units"
                  checked={units === "imperial"}
                  onChange={() => setUnits("imperial")}
                />
                Miles
              </label>
              <label className="globe-settings-option">
                <input
                  type="radio"
                  name="map-units"
                  checked={units === "metric"}
                  onChange={() => setUnits("metric")}
                />
                Kilometers
              </label>
            </div>
          ) : null}
        </div>
      ) : null}
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
