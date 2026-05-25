"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { LeaderboardRow } from "@/lib/leaderboardTypes";

const ROW_HEIGHT = 56;
const OVERSCAN = 6;

type Props = {
  rows: LeaderboardRow[];
};

export function LeaderboardVirtualList({ rows }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => setViewportHeight(el.clientHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalHeight = rows.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    rows.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
  );
  const visible = rows.slice(startIndex, endIndex);

  return (
    <div
      ref={scrollRef}
      className="leaderboard-virtual-scroll"
      onScroll={onScroll}
      role="region"
      aria-label="Leaderboard rankings"
    >
      <ol className="leaderboard-list leaderboard-list--virtual" style={{ height: totalHeight }}>
        {visible.map((row, i) => {
          const index = startIndex + i;
          return (
            <li
              key={row.user_id}
              className={`leaderboard-row${row.rank <= 3 ? ` leaderboard-row--top-${row.rank}` : ""}`}
              style={{
                position: "absolute",
                top: index * ROW_HEIGHT,
                left: 0,
                right: 0,
                height: ROW_HEIGHT - 6,
                boxSizing: "border-box"
              }}
            >
              <span className="leaderboard-rank" aria-label={`Rank ${row.rank}`}>
                {row.rank}
              </span>
              {row.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.avatar_url}
                  alt=""
                  className="leaderboard-avatar"
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="leaderboard-avatar leaderboard-avatar--placeholder" aria-hidden>
                  🍀
                </span>
              )}
              <span className="leaderboard-name">{row.display_name}</span>
              <span className="leaderboard-count">
                {row.clover_count} clover{row.clover_count === 1 ? "" : "s"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
