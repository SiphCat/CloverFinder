import { badgeIdForLeaves } from "@/lib/badges";
import type { LeaderboardRow, LeafFilter } from "@/lib/leaderboardTypes";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

export type { LeaderboardRow, LeafFilter };

export function parseLeavesFilter(raw: string | null): string | null | "invalid" {
  if (!raw || raw === "all") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 4 || n > 10) return "invalid";
  return badgeIdForLeaves(n);
}

const DEFAULT_LEADERBOARD_LIMIT = 500;
const MAX_LEADERBOARD_LIMIT = 2000;

export async function fetchLeaderboardRows(
  leaves: LeafFilter | string = "all",
  limit = DEFAULT_LEADERBOARD_LIMIT
): Promise<{ rows: LeaderboardRow[]; error: string | null; truncated: boolean }> {
  const badgeId = parseLeavesFilter(leaves === "all" ? null : leaves);
  if (badgeId === "invalid") {
    return { rows: [], error: "Invalid leaves filter. Use all or 4–10.", truncated: false };
  }

  const safeLimit = Math.max(1, Math.min(limit, MAX_LEADERBOARD_LIMIT));

  try {
    const supabase = await createSupabaseServerComponentClient();
    let { data, error } = await supabase.rpc("get_leaderboard", {
      p_badge_id: badgeId,
      p_limit: safeLimit
    });

    if (error?.message?.includes("does not exist")) {
      ({ data, error } = await supabase.rpc("get_leaderboard", {
        p_badge_id: badgeId
      }));
    }

    if (error) {
      return {
        rows: [],
        error: `${error.message} Run supabase/sql/map_performance.sql in the Supabase SQL editor.`,
        truncated: false
      };
    }

    const raw = (data ?? []) as LeaderboardRow[];
    const sliced = raw.length > safeLimit ? raw.slice(0, safeLimit) : raw;
    const rows = sliced.map((row) => ({
      rank: Number(row.rank),
      user_id: row.user_id,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      clover_count: Number(row.clover_count)
    }));

    return {
      rows,
      error: null,
      truncated: rows.length >= safeLimit || raw.length > safeLimit
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load leaderboard.";
    return { rows: [], error: message, truncated: false };
  }
}
