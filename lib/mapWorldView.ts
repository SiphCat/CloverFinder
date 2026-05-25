/** Web Mercator latitude limits used by most tile layers. */
export const WORLD_LAT_MIN = -85;
export const WORLD_LAT_MAX = 85;

const LAT_EPS = 0.001;

const mapState = new WeakMap<
  import("leaflet").Map,
  { adjusting: boolean }
>();

function getState(map: import("leaflet").Map) {
  let state = mapState.get(map);
  if (!state) {
    state = { adjusting: false };
    mapState.set(map, state);
  }
  return state;
}

/** Smallest zoom where world latitude span fills the map height (no top/bottom gaps). */
export function getVerticalMinZoom(map: import("leaflet").Map): number {
  const height = map.getSize().y;
  if (height <= 0) return 2;

  for (let zoom = 0; zoom <= 20; zoom += 1) {
    const north = map.project([WORLD_LAT_MAX, 0], zoom);
    const south = map.project([WORLD_LAT_MIN, 0], zoom);
    if (Math.abs(south.y - north.y) >= height - 2) {
      return zoom;
    }
  }

  return 20;
}

function getAllowedCenterLatRange(
  map: import("leaflet").Map
): { min: number; max: number } | null {
  const bounds = map.getBounds();
  const halfSpan = (bounds.getNorth() - bounds.getSouth()) / 2;
  const worldSpan = WORLD_LAT_MAX - WORLD_LAT_MIN;

  if (halfSpan * 2 >= worldSpan - LAT_EPS) {
    return null;
  }

  return {
    min: WORLD_LAT_MIN + halfSpan,
    max: WORLD_LAT_MAX - halfSpan
  };
}

/** Keep the viewport inside world latitude limits without restricting longitude. */
export function constrainMapLatitude(map: import("leaflet").Map): void {
  const state = getState(map);
  if (state.adjusting) return;

  const center = map.getCenter();
  const range = getAllowedCenterLatRange(map);
  let targetLat = center.lat;

  if (!range) {
    targetLat = 0;
  } else {
    targetLat = Math.max(range.min, Math.min(range.max, center.lat));
  }

  if (Math.abs(targetLat - center.lat) < LAT_EPS) return;

  state.adjusting = true;
  map.setView([targetLat, center.lng], map.getZoom(), { animate: false });
  state.adjusting = false;
}

export function syncWrappedWorldLimits(map: import("leaflet").Map): void {
  const state = getState(map);
  if (state.adjusting) return;

  state.adjusting = true;
  map.invalidateSize({ animate: false });

  const minZoom = getVerticalMinZoom(map);
  map.setMinZoom(minZoom);

  const center = map.getCenter();
  const zoom = Math.max(map.getZoom(), minZoom);
  map.setView([center.lat, center.lng], zoom, { animate: false });

  state.adjusting = false;

  if (zoom <= minZoom) {
    const { lat, lng } = map.getCenter();
    state.adjusting = true;
    map.setView([0, lng], minZoom, { animate: false });
    state.adjusting = false;
  }
}

export function applyWrappedWorldView(
  map: import("leaflet").Map,
  lat: number,
  lng: number,
  animate = false
): void {
  const state = getState(map);
  if (state.adjusting) return;

  state.adjusting = true;
  map.invalidateSize({ animate: false });

  const minZoom = getVerticalMinZoom(map);
  map.setMinZoom(minZoom);
  map.setView([lat, lng], minZoom, { animate });

  state.adjusting = false;
}
