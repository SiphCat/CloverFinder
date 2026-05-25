"use client";

import { useState } from "react";
import { PostFindsForm } from "@/app/components/PostFindsForm";
import { YourFindsList, type UserFind } from "@/app/components/YourFindsList";

type Tab = "post" | "all";

type Props = {
  disabled?: boolean;
  initialFinds?: UserFind[];
};

export function PostFindsPanel({ disabled = false, initialFinds = [] }: Props) {
  const [tab, setTab] = useState<Tab>("post");
  const [listRefreshKey, setListRefreshKey] = useState(0);

  return (
    <div className="post-finds-panel">
      <div className="post-finds-tabs" role="tablist" aria-label="Post finds">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "post"}
          className={`post-finds-tab${tab === "post" ? " post-finds-tab--active" : ""}`}
          onClick={() => setTab("post")}
        >
          Post a find
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "all"}
          className={`post-finds-tab${tab === "all" ? " post-finds-tab--active" : ""}`}
          onClick={() => setTab("all")}
        >
          All your finds
        </button>
      </div>

      {tab === "post" ? (
        <div role="tabpanel">
          <PostFindsForm
            disabled={disabled}
            onSaved={() => setListRefreshKey((k) => k + 1)}
          />
        </div>
      ) : (
        <div role="tabpanel">
          <YourFindsList
            disabled={disabled}
            refreshKey={listRefreshKey}
            initialFinds={initialFinds}
          />
        </div>
      )}
    </div>
  );
}
