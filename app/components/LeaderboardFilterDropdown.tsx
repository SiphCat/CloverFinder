"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LEAF_FILTERS, parseLeafFilter } from "@/lib/leaderboardFilters";
import { prefetchLeaderboard } from "@/lib/prefetchLeaderboard";
import type { LeafFilter } from "@/lib/leaderboardTypes";

type Props = {
  disabled?: boolean;
};

export function LeaderboardFilterDropdown({ disabled = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = parseLeafFilter(searchParams.get("leaves"));
  const currentLabel = LEAF_FILTERS.find((f) => f.value === current)?.label ?? "All clovers";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectFilter(value: LeafFilter) {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("leaves");
    } else {
      params.set("leaves", value);
    }
    const q = params.toString();
    router.push(q ? `/leaderboard?${q}` : "/leaderboard", { scroll: false });
  }

  return (
    <div className="leaderboard-filters-bar">
      <span className="leaderboard-filters-label" id="leaderboard-filter-label">
        Filter
      </span>
      <div
        className={["leaderboard-filter-dropdown", open ? "leaderboard-filter-dropdown--open" : ""]
          .filter(Boolean)
          .join(" ")}
        ref={wrapRef}
      >
        <button
          type="button"
          className="leaderboard-filter-trigger"
          aria-labelledby="leaderboard-filter-label"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
        >
          {currentLabel}
          <span className="leaderboard-filter-chevron" aria-hidden>
            ▾
          </span>
        </button>
        {open ? (
          <ul className="leaderboard-filter-menu" role="listbox" aria-label="Leaf count">
            {LEAF_FILTERS.map(({ value, label }) => (
              <li key={value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={current === value}
                  className={[
                    "leaderboard-filter-option",
                    current === value ? "leaderboard-filter-option--active" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => selectFilter(value)}
                  onMouseEnter={() => prefetchLeaderboard(value)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
