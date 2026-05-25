"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PostFindsMap } from "@/app/components/PostFindsMap";
import { CloverLoadingScreen } from "@/app/components/CloverLoadingScreen";
import { FINDS_LIMITS, formatImageMaxMb } from "@/lib/findsLimits";

export type UserFind = {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  image_path: string | null;
  share_clovermedia: boolean;
  created_at: string;
};

type Props = {
  disabled?: boolean;
  refreshKey?: number;
  initialFinds?: UserFind[];
};

export function YourFindsList({
  disabled = false,
  refreshKey = 0,
  initialFinds
}: Props) {
  const [finds, setFinds] = useState<UserFind[]>(initialFinds ?? []);
  const [loading, setLoading] = useState(initialFinds === undefined);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState(51.505);
  const [lng, setLng] = useState(-0.09);
  const [shareClovermedia, setShareClovermedia] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (disabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadErr(null);
    const res = await fetch("/api/finds");
    const data = (await res.json().catch(() => ({}))) as {
      finds?: UserFind[];
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setLoadErr(data.error ?? "Could not load your finds.");
      setFinds([]);
      return;
    }
    setFinds(data.finds ?? []);
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;
    if (initialFinds !== undefined && refreshKey === 0) return;
    void load();
  }, [load, refreshKey, initialFinds, disabled]);

  const selected = finds.find((f) => f.id === selectedId) ?? null;

  function selectFind(f: UserFind) {
    setSelectedId(f.id);
    setTitle(f.title);
    setDescription(f.description);
    setLat(f.lat);
    setLng(f.lng);
    setShareClovermedia(f.share_clovermedia);
    setMsg(null);
    setErr(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || disabled) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await fetch(`/api/finds/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        lat,
        lng,
        share_clovermedia: shareClovermedia
      })
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      find?: UserFind;
    };
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "Could not update find.");
      return;
    }
    setMsg(data.message ?? "Updated.");
    if (data.find) {
      setFinds((prev) => prev.map((f) => (f.id === data.find!.id ? data.find! : f)));
    } else {
      await load();
    }
  }

  if (disabled) {
    return (
      <p className="profile-panel-muted">Create the finds table first, then your saved finds will appear here.</p>
    );
  }

  if (loading) {
    return <CloverLoadingScreen label="Loading your finds…" />;
  }

  if (loadErr) {
    return <p className="error">{loadErr}</p>;
  }

  if (finds.length === 0) {
    return (
      <p className="profile-panel-muted">
        You have not saved any finds yet. Use the <strong>Post a find</strong> tab to add one.
      </p>
    );
  }

  return (
    <div className="your-finds">
      <ul className="your-finds-list" role="list">
        {finds.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              className={`your-finds-item${selectedId === f.id ? " your-finds-item--active" : ""}`}
              onClick={() => selectFind(f)}
            >
              <span className="your-finds-item-title">{f.title}</span>
              <span className="your-finds-item-meta">
                {new Date(f.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <form className="form your-finds-edit" onSubmit={onSave}>
          <h2 className="your-finds-edit-title">Edit find</h2>
          <p className="profile-panel-muted post-finds-map-intro">
            Drag the pin or tap the map to move this find ({lat.toFixed(5)}, {lng.toFixed(5)}).
          </p>
          <PostFindsMap
            key={selected.id}
            initialLat={selected.lat}
            initialLng={selected.lng}
            onPositionChange={(nextLat, nextLng) => {
              setLat(nextLat);
              setLng(nextLng);
            }}
          />
          <label>
            Title
            <input
              type="text"
              required
              maxLength={FINDS_LIMITS.titleMax}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <span className="field-hint">
              {title.length}/{FINDS_LIMITS.titleMax}
            </span>
          </label>
          <label>
            Description
            <textarea
              rows={4}
              maxLength={FINDS_LIMITS.descriptionMax}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="post-finds-textarea"
            />
            <span className="field-hint">
              {description.length}/{FINDS_LIMITS.descriptionMax}
            </span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={shareClovermedia}
              onChange={(e) => setShareClovermedia(e.target.checked)}
              disabled={!selected.image_path}
            />
            Publish on Clovermedia {selected.image_path ? "" : "(add a photo when posting to enable)"}
          </label>
          {selected.image_path ? (
            <p className="profile-panel-muted field-hint">
              Photo is kept from when you posted. To change it, post a new find.
            </p>
          ) : null}
          <p className="profile-panel-muted field-hint">
            Limits: title {FINDS_LIMITS.titleMax} chars, description {FINDS_LIMITS.descriptionMax}{" "}
            chars, photos up to {formatImageMaxMb()} when posting.
          </p>
          {err ? <p className="error">{err}</p> : null}
          {msg ? <p className="success">{msg}</p> : null}
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      ) : (
        <p className="profile-panel-muted your-finds-pick">Select a find above to view and edit it.</p>
      )}
    </div>
  );
}
