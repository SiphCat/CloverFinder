let mapLibrePromise: Promise<typeof import("maplibre-gl/dist/maplibre-gl-csp.js")> | null = null;

const WORKER_PATH = "/maplibre-gl-csp-worker.js";

export function loadMapLibre(): Promise<typeof import("maplibre-gl/dist/maplibre-gl-csp.js")> {
  if (!mapLibrePromise) {
    mapLibrePromise = import("maplibre-gl/dist/maplibre-gl-csp.js").then((maplibregl) => {
      if (typeof window !== "undefined") {
        maplibregl.setWorkerUrl(`${window.location.origin}${WORKER_PATH}`);
      }
      return maplibregl;
    });
  }
  return mapLibrePromise;
}

export function prefetchMapLibre(): void {
  void loadMapLibre();
}
