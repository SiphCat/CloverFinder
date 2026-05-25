/** Visual theme per leaf-count badge (4–10). */
export type BadgeArtTheme = {
  glow: [string, string, string];
  leaf: [string, string, string];
  stroke: [string, string];
  stem: string;
  ring: string;
  label: string;
  accent?: string;
};

export const BADGE_ART_THEMES: Record<number, BadgeArtTheme> = {
  4: {
    glow: ["#fef9c3", "#86efac", "#15803d"],
    leaf: ["#dcfce7", "#4ade80", "#166534"],
    stroke: ["#fef08a", "#ca8a04"],
    stem: "#166534",
    ring: "#22c55e",
    label: "#fefce8",
    accent: "#facc15"
  },
  5: {
    glow: ["#ecfccb", "#a3e635", "#3f6212"],
    leaf: ["#ecfccb", "#84cc16", "#365314"],
    stroke: ["#fde047", "#a16207"],
    stem: "#365314",
    ring: "#65a30d",
    label: "#fefce8"
  },
  6: {
    glow: ["#d9f99d", "#4ade80", "#14532d"],
    leaf: ["#bbf7d0", "#22c55e", "#14532d"],
    stroke: ["#fef9c3", "#eab308"],
    stem: "#14532d",
    ring: "#10b981",
    label: "#ecfdf5"
  },
  7: {
    glow: ["#a7f3d0", "#2dd4bf", "#115e59"],
    leaf: ["#99f6e4", "#14b8a6", "#134e4a"],
    stroke: ["#fef3c7", "#0d9488"],
    stem: "#134e4a",
    ring: "#2dd4bf",
    label: "#f0fdfa",
    accent: "#5eead4"
  },
  8: {
    glow: ["#bae6fd", "#38bdf8", "#1e3a8a"],
    leaf: ["#e0f2fe", "#0ea5e9", "#1e40af"],
    stroke: ["#fef08a", "#0369a1"],
    stem: "#1e3a8a",
    ring: "#38bdf8",
    label: "#eff6ff"
  },
  9: {
    glow: ["#e9d5ff", "#c084fc", "#581c87"],
    leaf: ["#f3e8ff", "#a855f7", "#6b21a8"],
    stroke: ["#fde68a", "#7e22ce"],
    stem: "#581c87",
    ring: "#c084fc",
    label: "#faf5ff",
    accent: "#e879f9"
  },
  10: {
    glow: ["#fecdd3", "#fb7185", "#881337"],
    leaf: ["#ffe4e6", "#f43f5e", "#9f1239"],
    stroke: ["#fef9c3", "#be123c"],
    stem: "#881337",
    ring: "#fb7185",
    label: "#fff1f2",
    accent: "#fbbf24"
  }
};

export function themeForLeaves(leaves: number): BadgeArtTheme {
  const n = Math.min(10, Math.max(4, Math.round(leaves)));
  return BADGE_ART_THEMES[n] ?? BADGE_ART_THEMES[4];
}
