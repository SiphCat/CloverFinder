import type { LeafFilter } from "@/lib/leaderboardTypes";

export const LEAF_FILTERS = [
  { value: "all", label: "All clovers" },
  { value: "4", label: "4-leaf" },
  { value: "5", label: "5-leaf" },
  { value: "6", label: "6-leaf" },
  { value: "7", label: "7-leaf" },
  { value: "8", label: "8-leaf" },
  { value: "9", label: "9-leaf" },
  { value: "10", label: "10-leaf" }
] as const satisfies ReadonlyArray<{ value: LeafFilter; label: string }>;

export function parseLeafFilter(raw: string | null | undefined): LeafFilter {
  if (!raw || raw === "all") return "all";
  const match = LEAF_FILTERS.find((f) => f.value === raw);
  return match?.value ?? "all";
}
