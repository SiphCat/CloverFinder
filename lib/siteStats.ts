import { isSupabaseReady } from "@/lib/supabase/env";
import type { SiteStats } from "@/lib/siteStatsConstants";

export type { SiteStats } from "@/lib/siteStatsConstants";
export { FINDS_GOAL, FINDS_GOAL_LABEL, findsGoalProgress } from "@/lib/siteStatsConstants";

export async function fetchSiteStats(): Promise<SiteStats> {
  if (!isSupabaseReady()) return { visitors: 0, finds: 0 };

  try {
    const { createSupabaseServerComponentClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase.rpc("get_site_stats");

    if (error || !data?.[0]) return { visitors: 0, finds: 0 };

    const row = data[0] as { visitor_count: number; finds_count: number };
    return {
      visitors: Number(row.visitor_count) || 0,
      finds: Number(row.finds_count) || 0
    };
  } catch {
    return { visitors: 0, finds: 0 };
  }
}
