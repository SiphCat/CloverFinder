#!/usr/bin/env node
/**
 * Writes public/badges/leaf-4.svg … leaf-10.svg for static use (Open Graph, exports).
 * Run: node scripts/generate-badge-svgs.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/badges");
mkdirSync(outDir, { recursive: true });

const THEMES = {
  4: { glow: ["#fef9c3", "#86efac", "#15803d"], leaf: ["#dcfce7", "#4ade80", "#166534"], stroke: ["#fef08a", "#ca8a04"], stem: "#166534", ring: "#22c55e" },
  5: { glow: ["#ecfccb", "#a3e635", "#3f6212"], leaf: ["#ecfccb", "#84cc16", "#365314"], stroke: ["#fde047", "#a16207"], stem: "#365314", ring: "#65a30d" },
  6: { glow: ["#d9f99d", "#4ade80", "#14532d"], leaf: ["#bbf7d0", "#22c55e", "#14532d"], stroke: ["#fef9c3", "#eab308"], stem: "#14532d", ring: "#10b981" },
  7: { glow: ["#a7f3d0", "#2dd4bf", "#115e59"], leaf: ["#99f6e4", "#14b8a6", "#134e4a"], stroke: ["#fef3c7", "#0d9488"], stem: "#134e4a", ring: "#2dd4bf" },
  8: { glow: ["#bae6fd", "#38bdf8", "#1e3a8a"], leaf: ["#e0f2fe", "#0ea5e9", "#1e40af"], stroke: ["#fef08a", "#0369a1"], stem: "#1e3a8a", ring: "#38bdf8" },
  9: { glow: ["#e9d5ff", "#c084fc", "#581c87"], leaf: ["#f3e8ff", "#a855f7", "#6b21a8"], stroke: ["#fde68a", "#7e22ce"], stem: "#581c87", ring: "#c084fc" },
  10: { glow: ["#fecdd3", "#fb7185", "#881337"], leaf: ["#ffe4e6", "#f43f5e", "#9f1239"], stroke: ["#fef9c3", "#be123c"], stem: "#881337", ring: "#fb7185" }
};

function petalPath(cx, cy, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const px = cx + Math.cos(rad) * 24;
  const py = cy + Math.sin(rad) * 24;
  const tipX = cx + Math.cos(rad) * 42;
  const tipY = cy + Math.sin(rad) * 42;
  const leftRad = rad - Math.PI / 2;
  const rightRad = rad + Math.PI / 2;
  const w = 14;
  const lx = px + Math.cos(leftRad) * w;
  const ly = py + Math.sin(leftRad) * w;
  const rx = px + Math.cos(rightRad) * w;
  const ry = py + Math.sin(rightRad) * w;
  return `M ${lx.toFixed(2)} ${ly.toFixed(2)} Q ${px.toFixed(2)} ${py.toFixed(2)} ${tipX.toFixed(2)} ${tipY.toFixed(2)} Q ${px.toFixed(2)} ${py.toFixed(2)} ${rx.toFixed(2)} ${ry.toFixed(2)} Z`;
}

for (let n = 4; n <= 10; n++) {
  const t = THEMES[n];
  const petals = Array.from({ length: n }, (_, i) => {
    const angle = (360 / n) * i - 90;
    return `<path d="${petalPath(60, 56, angle)}" fill="url(#lf)" stroke="url(#ls)" stroke-width="1.1"/>`;
  }).join("\n    ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 120 120" role="img" aria-label="${n}-leaf clover badge">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="${t.glow[0]}"/>
      <stop offset="50%" stop-color="${t.glow[1]}"/>
      <stop offset="100%" stop-color="${t.glow[2]}"/>
    </radialGradient>
    <linearGradient id="lf" x1="20%" y1="10%" x2="80%" y2="95%">
      <stop offset="0%" stop-color="${t.leaf[0]}"/>
      <stop offset="50%" stop-color="${t.leaf[1]}"/>
      <stop offset="100%" stop-color="${t.leaf[2]}"/>
    </linearGradient>
    <linearGradient id="ls" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${t.stroke[0]}"/>
      <stop offset="100%" stop-color="${t.stroke[1]}"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="56" r="54" fill="url(#bg)"/>
  <circle cx="60" cy="56" r="50" fill="none" stroke="${t.ring}" stroke-width="2" opacity="0.55"/>
  <g>${petals}</g>
  <circle cx="60" cy="56" r="5" fill="${t.stem}"/>
  <rect x="57" y="58" width="6" height="32" rx="2.5" fill="${t.stem}"/>
  <text x="60" y="108" text-anchor="middle" font-size="10" font-weight="800" fill="#fefce8" stroke="${t.stem}" stroke-width="0.4">${n} LEAVES</text>
</svg>`;

  const path = join(outDir, `leaf-${n}.svg`);
  writeFileSync(path, svg, "utf8");
  console.log("Wrote", path);
}

console.log("Done — badge images in public/badges/");
