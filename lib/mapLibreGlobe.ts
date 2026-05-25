import type { Map as MapLibreMap } from "maplibre-gl";
import { CelestialBodiesLayer } from "@/lib/celestialBodiesLayer";

/** Enable globe projection with atmosphere, 3D starfield + sun, and planets. */
export async function enableGlobeProjection(map: MapLibreMap): Promise<CelestialBodiesLayer> {
  map.setProjection({ type: "globe" });
  map.setSky({
    "sky-color": "#000005",
    "horizon-color": "#4488cc",
    "sky-horizon-blend": 0.35,
    "atmosphere-blend": 0
  });

  const { MaplibreStarfieldLayer } = await import("@geoql/maplibre-gl-starfield");

  const starfield = new MaplibreStarfieldLayer({
    starCount: 8000,
    starSize: 2.5,
    sunEnabled: true,
    sunAzimuth: 62,
    sunAltitude: 21,
    sunSize: 140,
    sunIntensity: 1.8,
    autoFadeStars: false,
  });

  const celestial = new CelestialBodiesLayer();
  const firstLayerId = map.getStyle().layers[0]?.id;

  if (map.getLayer((starfield as { id: string }).id)) {
    map.removeLayer((starfield as { id: string }).id);
  }
  if (map.getLayer(celestial.id)) {
    map.removeLayer(celestial.id);
  }

  map.addLayer(starfield, firstLayerId);
  map.addLayer(celestial, firstLayerId);
  return celestial;
}
