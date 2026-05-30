export const FINDS_GOAL = 10_000;
export const FINDS_GOAL_LABEL = "End of 2026";

export type SiteStats = {
  visitors: number;
  finds: number;
};

export function findsGoalProgress(finds: number): number {
  if (FINDS_GOAL <= 0) return 0;
  return Math.min(100, Math.round((finds / FINDS_GOAL) * 1000) / 10);
}
