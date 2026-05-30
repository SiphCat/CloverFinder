import type { Map as MapLibreMap } from "maplibre-gl";
import { CelestialBodiesLayer, subsolarPoint } from "@/lib/celestialBodiesLayer";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Web Mercator latitude limit (matches MapLibre globe + Esri satellite). */
export const MAX_LAT = 85.05112877980659;

/** NASA GIBS VIIRS City Lights 2012 — Web Mercator (EPSG:3857). */
export const GIBS_CITY_LIGHTS_TILES =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/" +
  "VIIRS_CityLights_2012/default/2012-01-01/" +
  "GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg";

const MERC_STITCH_ZOOM = 3;
const TILE_PX = 256;

const NIGHT_LAYER_IDS = [
  "night-shadow-layer",
  "night-lights-layer",
];

/** Image corners — MapLibre drapes the texture linearly in Mercator between these. */
const GLOBE_IMAGE_COORDS: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
  [-180, MAX_LAT],
  [180, MAX_LAT],
  [180, -MAX_LAT],
  [-180, -MAX_LAT],
];

/** Normalized Web Mercator Y (0 = north, 1 = south). */
function mercatorY(lat: number): number {
  const latRad = (Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * Math.PI) / 180;
  return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
}

function mercatorYToLat(y: number): number {
  return (2 * Math.atan(Math.exp(Math.PI * (1 - 2 * y))) - Math.PI / 2) * RAD2DEG;
}

const MERC_Y_NORTH = mercatorY(MAX_LAT);
const MERC_Y_SOUTH = mercatorY(-MAX_LAT);
const MERC_Y_SPAN = MERC_Y_SOUTH - MERC_Y_NORTH;

/** Flat map size: width = longitude span; height = Mercator Y span (matches MapLibre image projection). */
const WORLD_W = 2048;
const WORLD_H = Math.round(WORLD_W * MERC_Y_SPAN);

let mercStitch: ImageData | null = null;
let mercStitchPromise: Promise<ImageData | null> | null = null;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function nightVisibility(cosSZA: number): number {
  const blend = smoothstep(0.06, -0.2, cosSZA);
  return blend * blend;
}

function cosSolarZenith(
  latDeg: number,
  lngDeg: number,
  subLat: number,
  subLng: number
): number {
  const lat = latDeg * DEG2RAD;
  const lng = lngDeg * DEG2RAD;
  const sLatR = subLat * DEG2RAD;
  const sLngR = subLng * DEG2RAD;
  const sunX = Math.cos(sLatR) * Math.cos(sLngR);
  const sunY = Math.cos(sLatR) * Math.sin(sLngR);
  const sunZ = Math.sin(sLatR);
  const pX = Math.cos(lat) * Math.cos(lng);
  const pY = Math.cos(lat) * Math.sin(lng);
  const pZ = Math.sin(lat);
  return pX * sunX + pY * sunY + pZ * sunZ;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function mercatorTileUrl(z: number, x: number, y: number): string {
  return GIBS_CITY_LIGHTS_TILES.replace("{z}", String(z))
    .replace("{y}", String(y))
    .replace("{x}", String(x));
}

/** Pixel → lng + Mercator Y on the flat map (matches MapLibre image UV layout). */
function pixelToGeo(px: number, py: number): { lng: number; lat: number; my: number } {
  const lng = -180 + ((px + 0.5) / WORLD_W) * 360;
  const my = MERC_Y_NORTH + ((py + 0.5) / WORLD_H) * MERC_Y_SPAN;
  const lat = mercatorYToLat(my);
  return { lng, lat, my };
}

function sampleBilinear(
  data: ImageData,
  fx: number,
  fy: number
): [number, number, number] {
  const w = data.width;
  const h = data.height;
  const x0 = Math.max(0, Math.min(w - 1, Math.floor(fx)));
  const y0 = Math.max(0, Math.min(h - 1, Math.floor(fy)));
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;

  function px(x: number, y: number): [number, number, number] {
    const i = (y * w + x) * 4;
    return [data.data[i], data.data[i + 1], data.data[i + 2]];
  }

  const c00 = px(x0, y0);
  const c10 = px(x1, y0);
  const c01 = px(x0, y1);
  const c11 = px(x1, y1);
  const out: [number, number, number] = [0, 0, 0];

  for (let c = 0; c < 3; c++) {
    const top = c00[c] * (1 - tx) + c10[c] * tx;
    const bot = c01[c] * (1 - tx) + c11[c] * tx;
    out[c] = top * (1 - ty) + bot * ty;
  }
  return out;
}

async function loadMercatorStitch(): Promise<ImageData | null> {
  if (mercStitch) return mercStitch;
  if (mercStitchPromise) return mercStitchPromise;

  mercStitchPromise = (async () => {
    const z = MERC_STITCH_ZOOM;
    const n = 2 ** z;
    const mapSize = n * TILE_PX;
    const canvas = document.createElement("canvas");
    canvas.width = mapSize;
    canvas.height = mapSize;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, mapSize, mapSize);

    try {
      await Promise.all(
        Array.from({ length: n * n }, (_, i) => {
          const col = i % n;
          const row = Math.floor(i / n);
          return loadImage(mercatorTileUrl(z, col, row)).then((img) => {
            ctx.drawImage(img, col * TILE_PX, row * TILE_PX);
          });
        })
      );
      mercStitch = ctx.getImageData(0, 0, mapSize, mapSize);
      return mercStitch;
    } catch {
      return null;
    }
  })();

  return mercStitchPromise;
}

function sampleLightsAtLngMercY(
  stitch: ImageData,
  lng: number,
  my: number
): [number, number, number] {
  const mapSize = stitch.width;
  const mx = ((lng + 180) / 360) * mapSize;
  const myPx = my * mapSize;
  return sampleBilinear(stitch, mx, myPx);
}

function buildFlatNightLightsOverlay(
  stitch: ImageData,
  subLat: number,
  subLng: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  const ctx = canvas.getContext("2d")!;
  const out = ctx.createImageData(WORLD_W, WORLD_H);

  for (let py = 0; py < WORLD_H; py++) {
    for (let px = 0; px < WORLD_W; px++) {
      const { lng, lat, my } = pixelToGeo(px, py);
      const cosSZA = cosSolarZenith(lat, lng, subLat, subLng);
      const idx = (py * WORLD_W + px) * 4;
      const vis = nightVisibility(cosSZA);

      if (vis <= 0) {
        out.data[idx + 3] = 0;
        continue;
      }

      const [r, g, b] = sampleLightsAtLngMercY(stitch, lng, my);
      const lum = luminance(r, g, b);

      if (lum < 2) {
        out.data[idx + 3] = 0;
        continue;
      }

      const t = Math.pow(Math.min(lum, 255) / 255, 0.38);
      const boost = 2.4 + t * 1.6;

      out.data[idx] = Math.min(255, (100 + r * 0.65) * t * boost * vis);
      out.data[idx + 1] = Math.min(255, (75 + g * 0.5) * t * boost * vis);
      out.data[idx + 2] = Math.min(255, (35 + b * 0.3) * t * boost * vis);
      out.data[idx + 3] = Math.min(255, (10 + lum * 2.4) * vis * (0.5 + t * 0.5));
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas.toDataURL("image/png");
}

function buildFlatNightShadowOverlay(subLat: number, subLng: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(WORLD_W, WORLD_H);

  for (let py = 0; py < WORLD_H; py++) {
    for (let px = 0; px < WORLD_W; px++) {
      const { lng, lat } = pixelToGeo(px, py);
      const cosSZA = cosSolarZenith(lat, lng, subLat, subLng);
      const idx = (py * WORLD_W + px) * 4;
      const shadowBlend = nightVisibility(cosSZA);

      img.data[idx] = 2;
      img.data[idx + 1] = 6;
      img.data[idx + 2] = 14;
      img.data[idx + 3] = Math.round(shadowBlend * 168);
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function enableGlobeProjection(
  map: MapLibreMap
): Promise<CelestialBodiesLayer> {
  map.setProjection({ type: "globe" });
  map.setSky({
    "sky-color": "#000005",
    "horizon-color": "#6eaaff",
    "sky-horizon-blend": 0.35,
    "atmosphere-blend": 0,
  });

  const solar = subsolarPoint();
  const { MaplibreStarfieldLayer } = await import("@geoql/maplibre-gl-starfield");

  const starfield = new MaplibreStarfieldLayer({
    starCount: 8000,
    starSize: 2.5,
    sunEnabled: true,
    sunAzimuth: solar.lng,
    sunAltitude: solar.lat,
    sunSize: 120,
    sunIntensity: 1.2,
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

  void addNightOverlay(map, solar);

  return celestial;
}

async function addNightOverlay(
  map: MapLibreMap,
  solar: { lat: number; lng: number }
) {
  for (const id of NIGHT_LAYER_IDS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource("night-shadow")) map.removeSource("night-shadow");
  if (map.getSource("night-lights")) map.removeSource("night-lights");

  const stitch = await loadMercatorStitch();
  if (!stitch) return;

  map.addSource("night-shadow", {
    type: "image",
    url: buildFlatNightShadowOverlay(solar.lat, solar.lng),
    coordinates: GLOBE_IMAGE_COORDS,
  });

  map.addLayer({
    id: "night-shadow-layer",
    type: "raster",
    source: "night-shadow",
    paint: { "raster-opacity": 1, "raster-fade-duration": 0 },
  });

  map.addSource("night-lights", {
    type: "image",
    url: buildFlatNightLightsOverlay(stitch, solar.lat, solar.lng),
    coordinates: GLOBE_IMAGE_COORDS,
  });

  map.addLayer({
    id: "night-lights-layer",
    type: "raster",
    source: "night-lights",
    paint: { "raster-opacity": 1, "raster-fade-duration": 0 },
  });
}
