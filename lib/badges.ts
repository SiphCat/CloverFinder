export type BadgeDefinition = {
  id: string;
  leaves: number;
  title: string;
  shortName: string;
  description: string;
  rarityNote: string;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "leaf-4",
    leaves: 4,
    shortName: "Classic luck",
    title: "Four-leaf discoverer",
    description:
      "The legendary baseline: one extra leaf and a lifetime of stories. Every clover journey starts somewhere.",
    rarityNote: "Common among dedicated spotters — still special every time."
  },
  {
    id: "leaf-5",
    leaves: 5,
    shortName: "Pentacle clover",
    title: "Five-leaf seeker",
    description:
      "A tidy star of green luck. Five leaves mean the plant went off-script in the best way.",
    rarityNote: "Uncommon — keep scanning interesting patches."
  },
  {
    id: "leaf-6",
    leaves: 6,
    shortName: "Snowflake clover",
    title: "Six-leaf specialist",
    description:
      "Symmetry starts to feel impossible — yet here it is, etched in chlorophyll and nerve.",
    rarityNote: "Rare. Your photo evidence helps the community believe."
  },
  {
    id: "leaf-7",
    leaves: 7,
    shortName: "Lucky seven",
    title: "Seven-leaf legend",
    description:
      "Seven is the number of wonder in folklore — mapped onto a living coin of green.",
    rarityNote: "Very rare. Document everything about the find."
  },
  {
    id: "leaf-8",
    leaves: 8,
    shortName: "Octo-clover",
    title: "Eight-leaf mythmaker",
    description:
      "At eight leaves the rosette becomes a crown. Botany blinks; you do not.",
    rarityNote: "Extremely rare — trophy-tier."
  },
  {
    id: "leaf-9",
    leaves: 9,
    shortName: "Nova clover",
    title: "Nine-leaf nova",
    description:
      "Nine leaves spiral like a tiny green galaxy discovered under your shoe.",
    rarityNote: "Almost unheard of — verify with crisp focus and scale reference."
  },
  {
    id: "leaf-10",
    leaves: 10,
    shortName: "Perfect deca",
    title: "Ten-leaf apex",
    description:
      "The endgame badge: ten leaves on one stem. If the photo is real, you have bragging rights forever.",
    rarityNote: "Mythic — the scanner saves this with extra ceremony."
  }
];

export const BADGE_BY_ID: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGE_DEFINITIONS.map((b) => [b.id, b])
);

export function clampLeafCount(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 4;
  return Math.min(10, Math.max(4, Math.round(n)));
}

export function badgeIdForLeaves(leaves: number): string {
  return `leaf-${clampLeafCount(leaves)}`;
}
