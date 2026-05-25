/** Fix default marker icons when bundling Leaflet. */
export function initLeafletIcons(leaflet: typeof import("leaflet")): void {
  const L = leaflet;
  const base = "https://unpkg.com/leaflet@1.9.4/dist/images/";
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: `${base}marker-icon-2x.png`,
    iconUrl: `${base}marker-icon.png`,
    shadowUrl: `${base}marker-shadow.png`
  });
}
