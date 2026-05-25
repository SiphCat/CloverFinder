import type { StyleSpecification } from "maplibre-gl";

const GLYPHS = "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";

const SPACE_SKY = {
  "sky-color": "#000005",
  "horizon-color": "#4488cc",
  "sky-horizon-blend": 0.4,
  "atmosphere-blend": 0
} as const;

/** MapLibre style using satellite imagery with globe projection. */
export const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  projection: { type: "globe" },
  sky: SPACE_SKY,
  glyphs: GLYPHS,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution: "&copy; Esri, Maxar, Earthstar Geographics",
      maxzoom: 18
    }
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

/** MapLibre style using OpenStreetMap tiles with flat Mercator projection. */
export const NORMAL_STYLE: StyleSpecification = {
  version: 8,
  projection: { type: "mercator" },
  glyphs: GLYPHS,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
      maxzoom: 19
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

/** @deprecated Use SATELLITE_STYLE instead */
export const OSM_MAP_STYLE = SATELLITE_STYLE;
