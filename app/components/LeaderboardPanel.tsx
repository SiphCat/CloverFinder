"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { LeaderboardFilterDropdown } from "@/app/components/LeaderboardFilterDropdown";
import { LeaderboardSkeleton } from "@/app/components/LeaderboardSkeleton";
import { LeaderboardVirtualList } from "@/app/components/LeaderboardVirtualList";
import { LEAF_FILTERS, parseLeafFilter } from "@/lib/leaderboardFilters";
import type { LeaderboardRow, LeafFilter } from "@/lib/leaderboardTypes";

type Props = {
  initialRows?: LeaderboardRow[];
  initialError?: string | null;
  initialFilter?: LeafFilter;
  initialTruncated?: boolean;
};

function LeaderboardPanelInner({
  initialRows = [],
  initialError = null,
  initialFilter = "all",
  initialTruncated = false
}: Props) {
  const searchParams = useSearchParams();
  const leavesFromUrl = parseLeafFilter(searchParams.get("leaves"));

  const [filter, setFilter] = useState<LeafFilter>(initialFilter);
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(initialError);
  const [truncated, setTruncated] = useState(initialTruncated);
  const [hydratedFilter, setHydratedFilter] = useState<LeafFilter | null>(initialFilter);

  const filterLabel = LEAF_FILTERS.find((f) => f.value === filter)?.label ?? "All clovers";

  useEffect(() => {
    setFilter(initialFilter);
    setRows(initialRows);
    setErr(initialError);
    setTruncated(initialTruncated);
    setHydratedFilter(initialFilter);
  }, [initialFilter, initialRows, initialError, initialTruncated]);

  useEffect(() => {
    if (leavesFromUrl === filter) return;
    setFilter(leavesFromUrl);
    setHydratedFilter(null);
  }, [leavesFromUrl, filter]);

  const load = useCallback(async (leaves: LeafFilter) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/leaderboard?leaves=${encodeURIComponent(leaves)}`);
      const data = (await res.json().catch(() => ({}))) as {
        rows?: LeaderboardRow[];
        error?: string;
        hint?: string;
        truncated?: boolean;
      };
      setLoading(false);
      if (!res.ok) {
        setRows([]);
        setTruncated(false);
        setErr(data.hint ? `${data.error} ${data.hint}` : (data.error ?? "Could not load leaderboard."));
        return;
      }
      setRows(data.rows ?? []);
      setTruncated(Boolean(data.truncated));
      setHydratedFilter(leaves);
    } catch {
      setLoading(false);
      setRows([]);
      setTruncated(false);
      setErr("Could not load leaderboard. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    if (filter === hydratedFilter) return;
    void load(filter);
  }, [filter, hydratedFilter, load]);

  return (
    <section className="leaderboard-card">
      <header className="leaderboard-header">
        <h2>Leaderboard</h2>
        <p className="leaderboard-intro">
          Top finders ranked by verified clover badges — <strong>{filterLabel}</strong>.
        </p>
      </header>

      <section className="leaderboard-filters-section" aria-label="Leaderboard filters">
        <LeaderboardFilterDropdown disabled={loading} />
      </section>

      {loading ? <LeaderboardSkeleton /> : null}
      {err ? (
        <p className="error" role="alert">
          {err}
        </p>
      ) : null}

      {!loading && !err && rows.length === 0 ? (
        <p className="leaderboard-muted">
          No verified clovers yet for this filter.{" "}
          <Link href="/protected">Upload a clover photo</Link> on your profile to appear here.
        </p>
      ) : null}

      {!loading && !err && rows.length > 0 ? (
        <>
          {truncated ? (
            <p className="leaderboard-muted leaderboard-truncated-note">
              Showing top {rows.length.toLocaleString()} finders.
            </p>
          ) : null}
          <LeaderboardVirtualList rows={rows} />
        </>
      ) : null}
    </section>
  );
}

export function LeaderboardPanel(props: Props) {
  return (
    <Suspense fallback={<LeaderboardPanelInner {...props} initialFilter={props.initialFilter ?? "all"} />}>
      <LeaderboardPanelInner {...props} />
    </Suspense>
  );
}
