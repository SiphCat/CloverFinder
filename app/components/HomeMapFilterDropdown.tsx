"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LEAF_FILTERS, parseLeafFilter } from "@/lib/leaderboardFilters";
import { prefetchMapFinds } from "@/lib/prefetchLeaderboard";
import type { LeafFilter } from "@/lib/leaderboardTypes";

export function HomeMapFilterDropdown() {
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
    router.push(q ? `/?${q}` : "/", { scroll: false });
  }

  return (
    <div
      className={["home-map-filter-wrap", open ? "home-map-filter-open" : ""]
        .filter(Boolean)
        .join(" ")}
      ref={wrapRef}
    >
      <button
        type="button"
        className="home-map-filter-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Filter map by clover leaf count"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => prefetchMapFinds(current)}
      >
        {currentLabel}
        <span className="home-map-filter-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul className="home-map-filter-panel" role="listbox" aria-label="Leaf count">
          {LEAF_FILTERS.map(({ value, label }) => (
            <li key={value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={current === value}
                className={[
                  "home-map-filter-option",
                  current === value ? "home-map-filter-option--active" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => selectFilter(value)}
                onMouseEnter={() => prefetchMapFinds(value)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
