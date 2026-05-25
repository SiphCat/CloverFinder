import type { GlobeFindsMapMarker } from "@/app/components/GlobeFindsMap";

export type MapFindsFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: { id: string; title: string };
  }>;
};

export function markersToGeoJson(markers: GlobeFindsMapMarker[]): MapFindsFeatureCollection {
  return {
    type: "FeatureCollection",
    features: markers.map((m) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [m.lng, m.lat] },
      properties: { id: m.id, title: m.title }
    }))
  };
}

export function geoJsonToMarkers(geojson: MapFindsFeatureCollection): GlobeFindsMapMarker[] {
  return geojson.features.map((f) => ({
    id: String(f.properties.id),
    title: String(f.properties.title),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0]
  }));
}
