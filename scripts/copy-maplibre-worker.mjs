import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js");
const dest = join(root, "public/maplibre-gl-csp-worker.js");

if (!existsSync(src)) {
  console.warn("[copy-maplibre-worker] maplibre worker not found; run npm install first.");
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("[copy-maplibre-worker] copied worker to public/maplibre-gl-csp-worker.js");
