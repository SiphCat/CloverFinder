"use client";

import { useEffect, useState } from "react";
import { FINDS_GOAL, FINDS_GOAL_LABEL, findsGoalProgress } from "@/lib/siteStatsConstants";
import type { SiteStats } from "@/lib/siteStatsConstants";

type Props = {
  initialStats: SiteStats;
};

export function LandingStats({ initialStats }: Props) {
  const [stats, setStats] = useState(initialStats);
  const progress = findsGoalProgress(stats.finds);

  useEffect(() => {
    fetch("/api/stats/visit", { method: "POST" })
      .then((res) => res.json())
      .then((data: SiteStats & { recorded?: boolean }) => {
        if (typeof data.visitors === "number" && typeof data.finds === "number") {
          setStats({ visitors: data.visitors, finds: data.finds });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="landing-section">
      <h3 className="landing-section-title">Community</h3>
      <div className="landing-stats">
        <div className="landing-stat">
          <span className="landing-stat-num">{stats.visitors.toLocaleString()}</span>
          <span className="landing-stat-label">Website Visits</span>
        </div>
        <div className="landing-stat">
          <span className="landing-stat-num">{stats.finds.toLocaleString()}</span>
          <span className="landing-stat-label">Finds Posted</span>
        </div>
      </div>

      <div className="landing-goal">
        <div className="landing-goal-header">
          <span className="landing-goal-title">{FINDS_GOAL_LABEL} goal</span>
          <span className="landing-goal-count">
            {stats.finds.toLocaleString()} / {FINDS_GOAL.toLocaleString()} finds
          </span>
        </div>
        <div
          className="landing-goal-bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% toward ${FINDS_GOAL.toLocaleString()} finds`}
        >
          <div className="landing-goal-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="landing-goal-sub">
          {progress >= 100
            ? "We hit our goal — keep posting clovers!"
            : `${(100 - progress).toFixed(progress % 1 === 0 ? 0 : 1)}% to go — post a find and help us get there.`}
        </p>
      </div>
    </section>
  );
}
