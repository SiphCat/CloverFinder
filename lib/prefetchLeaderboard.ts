import { LEAF_FILTERS } from "@/lib/leaderboardFilters";
import type { LeafFilter } from "@/lib/leaderboardTypes";

function normalizeLeafFilter(leaves: unknown): LeafFilter {
  if (typeof leaves === "string" && LEAF_FILTERS.some((f) => f.value === leaves)) {
    return leaves as LeafFilter;
  }
  return "all";
}

/** Warm the leaderboard API before navigation (client-only). */
export function prefetchLeaderboard(leaves: LeafFilter = "all") {
  if (typeof window === "undefined") return;
  const safe = normalizeLeafFilter(leaves);
  void fetch(`/api/leaderboard?leaves=${encodeURIComponent(safe)}`).catch(() => {
    /* ignore prefetch failures */
  });
}

/** Warm map pin data for the home globe (client-only). */
export function prefetchMapFinds(leaves: LeafFilter = "all") {
  if (typeof window === "undefined") return;
  const safe = normalizeLeafFilter(leaves);
  const qs = safe === "all" ? "" : `?leaves=${encodeURIComponent(safe)}`;
  void fetch(`/api/map/finds${qs}`).catch(() => {
    /* ignore prefetch failures */
  });
}
