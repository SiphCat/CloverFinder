export default function CreditsPage() {
  return (
    <main className="map-area credits-area">
      <section className="credits-card">
        <h2>Credits</h2>
        <p>Site concept and direction by Cloverfinder creator.</p>

        <h3>Map &amp; Imagery</h3>
        <ul>
          <li>
            Satellite globe imagery &copy;{" "}
            <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">
              Esri
            </a>
            ,{" "}
            <a href="https://www.maxar.com" target="_blank" rel="noopener noreferrer">
              Maxar
            </a>
            , Earthstar Geographics, and the GIS User Community — tiles from{" "}
            <a
              href="https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer"
              target="_blank"
              rel="noopener noreferrer"
            >
              Esri World Imagery
            </a>
          </li>
          <li>
            Earth at night / city lights:{" "}
            <a
              href="https://www.earthdata.nasa.gov/learn/find-data/near-real-time/rapid-response/earth-at-night"
              target="_blank"
              rel="noopener noreferrer"
            >
              NASA VIIRS City Lights 2012
            </a>{" "}
            (Suomi NPP VIIRS Day/Night Band) via{" "}
            <a
              href="https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs"
              target="_blank"
              rel="noopener noreferrer"
            >
              NASA Global Imagery Browse Services (GIBS)
            </a>
            , part of{" "}
            <a
              href="https://www.earthdata.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
            >
              NASA EOSDIS
            </a>
            . Use of NASA imagery does not imply NASA endorsement of this site.
          </li>
          <li>
            Street / normal map tiles &copy;{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              OpenStreetMap
            </a>{" "}
            contributors ({" "}
            <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer">
              ODbL
            </a>
            ). Tile use policy:{" "}
            <a
              href="https://operations.osmfoundation.org/policies/tiles/"
              target="_blank"
              rel="noopener noreferrer"
            >
              OSM Foundation
            </a>
          </li>
          <li>
            Interactive globe powered by{" "}
            <a href="https://maplibre.org" target="_blank" rel="noopener noreferrer">
              MapLibre GL JS
            </a>{" "}
            (BSD-3-Clause)
          </li>
          <li>
            Map label fonts from{" "}
            <a href="https://github.com/maplibre/demotiles" target="_blank" rel="noopener noreferrer">
              MapLibre demo tiles
            </a>
          </li>
          <li>
            Posting &amp; profile maps powered by{" "}
            <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">
              Leaflet
            </a>{" "}
            (BSD-2-Clause)
          </li>
        </ul>

        <h3>Space Scene</h3>
        <ul>
          <li>
            Starfield &amp; sun rendering by{" "}
            <a
              href="https://www.npmjs.com/package/@geoql/maplibre-gl-starfield"
              target="_blank"
              rel="noopener noreferrer"
            >
              @geoql/maplibre-gl-starfield
            </a>{" "}
            (MIT)
          </li>
          <li>
            Planet rendering with{" "}
            <a href="https://threejs.org" target="_blank" rel="noopener noreferrer">
              Three.js
            </a>{" "}
            (MIT)
          </li>
          <li>
            Planetary positions from{" "}
            <a
              href="https://ssd.jpl.nasa.gov/planets/eph_export.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              NASA JPL DE405 / DE405 ephemeris
            </a>{" "}
            (public domain)
          </li>
        </ul>

        <h3>Services &amp; APIs</h3>
        <ul>
          <li>
            Authentication, database, and file storage by{" "}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
              Supabase
            </a>{" "}
            (Apache 2.0)
          </li>
          <li>
            Clover photo analysis via{" "}
            <a href="https://openai.com" target="_blank" rel="noopener noreferrer">
              OpenAI
            </a>{" "}
            GPT-4o-mini Vision API
          </li>
          <li>
            On-device clover classification with{" "}
            <a href="https://www.tensorflow.org/js" target="_blank" rel="noopener noreferrer">
              TensorFlow.js
            </a>{" "}
            (Apache 2.0)
          </li>
        </ul>

        <h3>Fonts &amp; Assets</h3>
        <ul>
          <li>
            <a
              href="https://fonts.google.com/specimen/Open+Sans"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Sans
            </a>{" "}
            (Apache 2.0) — map labels
          </li>
          <li>
            Map pin icons from{" "}
            <a
              href="https://unpkg.com/leaflet@1.9.4/dist/images/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Leaflet
            </a>{" "}
            (BSD-2-Clause)
          </li>
        </ul>

        <h3>Built With</h3>
        <ul>
          <li>
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
              Next.js
            </a>{" "}
            (MIT)
          </li>
          <li>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
              React
            </a>{" "}
            (MIT)
          </li>
          <li>
            <a href="https://www.typescriptlang.org" target="_blank" rel="noopener noreferrer">
              TypeScript
            </a>{" "}
            (Apache 2.0)
          </li>
          <li>
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
              Vercel
            </a>{" "}
            — hosting platform
          </li>
        </ul>
      </section>
    </main>
  );
}
