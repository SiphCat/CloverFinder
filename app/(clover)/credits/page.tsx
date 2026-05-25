export default function CreditsPage() {
  return (
    <main className="map-area credits-area">
      <section className="credits-card">
        <h2>Credits</h2>
        <p>Site concept and direction by Cloverfinder creator.</p>

        <h3>Map &amp; Imagery</h3>
        <ul>
          <li>
            Satellite imagery &copy;{" "}
            <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">Esri</a>,{" "}
            <a href="https://www.maxar.com" target="_blank" rel="noopener noreferrer">Maxar</a>,
            Earthstar Geographics, and the GIS User Community
          </li>
          <li>
            Map data &copy;{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              OpenStreetMap
            </a>{" "}
            contributors (ODbL)
          </li>
          <li>
            Globe rendering powered by{" "}
            <a href="https://maplibre.org" target="_blank" rel="noopener noreferrer">MapLibre GL JS</a>{" "}
            (BSD-3-Clause)
          </li>
          <li>
            2D maps powered by{" "}
            <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>{" "}
            (BSD-2-Clause)
          </li>
        </ul>

        <h3>Space Scene</h3>
        <ul>
          <li>
            Starfield &amp; sun by{" "}
            <a href="https://www.npmjs.com/package/@geoql/maplibre-gl-starfield" target="_blank" rel="noopener noreferrer">
              @geoql/maplibre-gl-starfield
            </a>{" "}
            (MIT)
          </li>
          <li>
            3D celestial bodies rendered with{" "}
            <a href="https://threejs.org" target="_blank" rel="noopener noreferrer">Three.js</a>{" "}
            (MIT)
          </li>
          <li>
            Planetary positions derived from{" "}
            <a href="https://ssd.jpl.nasa.gov/planets/eph_export.html" target="_blank" rel="noopener noreferrer">
              JPL DE405
            </a>{" "}
            ephemeris (NASA, public domain)
          </li>
        </ul>

        <h3>Services &amp; APIs</h3>
        <ul>
          <li>
            Backend powered by{" "}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a>{" "}
            (Apache 2.0)
          </li>
          <li>
            Clover image analysis by{" "}
            <a href="https://openai.com" target="_blank" rel="noopener noreferrer">OpenAI</a>{" "}
            GPT-4o-mini Vision
          </li>
        </ul>

        <h3>Fonts &amp; Assets</h3>
        <ul>
          <li>
            <a href="https://fonts.google.com/specimen/Open+Sans" target="_blank" rel="noopener noreferrer">
              Open Sans
            </a>{" "}
            font (Apache 2.0) — map labels via MapLibre
          </li>
          <li>
            Marker icons from{" "}
            <a href="https://unpkg.com/leaflet@1.9.4/dist/images/" target="_blank" rel="noopener noreferrer">
              Leaflet
            </a>{" "}
            (BSD-2-Clause)
          </li>
        </ul>

        <h3>Built With</h3>
        <ul>
          <li>
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a> (MIT)
          </li>
          <li>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer">React</a> (MIT)
          </li>
          <li>
            <a href="https://www.typescriptlang.org" target="_blank" rel="noopener noreferrer">TypeScript</a> (Apache 2.0)
          </li>
        </ul>
      </section>
    </main>
  );
}
