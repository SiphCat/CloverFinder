/** Cached Leaflet import — one network fetch per session. */
let leafletPromise: Promise<typeof import("leaflet")> | null = null;

export function loadLeaflet(): Promise<typeof import("leaflet")> {
  if (!leafletPromise) {
    leafletPromise = import("leaflet");
  }
  return leafletPromise;
}

export function prefetchLeaflet(): void {
  void loadLeaflet();
}
