"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostFindsMap } from "@/app/components/PostFindsMap";
import { CloverBadgeArt } from "@/app/components/CloverBadgeArt";
import { BADGE_BY_ID } from "@/lib/badges";
import { FINDS_LIMITS, formatImageMaxMb } from "@/lib/findsLimits";

const DEFAULT_LAT = 51.505;
const DEFAULT_LNG = -0.09;

type Props = {
  disabled?: boolean;
  onSaved?: () => void;
};

export function PostFindsForm({ disabled = false, onSaved }: Props) {
  const router = useRouter();
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shareClovermedia, setShareClovermedia] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [badgeBanner, setBadgeBanner] = useState<string | null>(null);

  const onMove = useCallback((nextLat: number, nextLng: number) => {
    setLat(nextLat);
    setLng(nextLng);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("description", description.trim());
    form.set("lat", String(lat));
    form.set("lng", String(lng));
    form.set("share_clovermedia", shareClovermedia ? "true" : "false");
    if (file) {
      if (file.size > FINDS_LIMITS.imageMaxBytes) {
        setBusy(false);
        setErr(`Photo is too large (max ${formatImageMaxMb()}).`);
        return;
      }
      form.set("image", file);
    }

    const res = await fetch("/api/finds", { method: "POST", body: form });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      hint?: string;
      badgeAwarded?: string;
    };
    setBusy(false);
    if (!res.ok) {
      const missingTable =
        data.error?.includes("schema cache") ||
        data.error?.includes("Could not find the table");
      setErr(
        missingTable
          ? `${data.error} Set up the database on the Dev page (/dev) or run supabase/sql/ensure_finds_table.sql in Supabase SQL Editor.`
          : (data.hint ? `${data.error} ${data.hint}` : (data.error ?? "Could not save find"))
      );
      return;
    }
    setMsg(data.message ?? "Saved");
    if (data.badgeAwarded) {
      setBadgeBanner(data.badgeAwarded);
    }
    setTitle("");
    setDescription("");
    setShareClovermedia(false);
    setFile(null);
    onSaved?.();
    router.refresh();
  }

  // Auto-dismiss badge banner after 6 seconds
  useEffect(() => {
    if (!badgeBanner) return;
    const t = setTimeout(() => setBadgeBanner(null), 6000);
    return () => clearTimeout(t);
  }, [badgeBanner]);

  const badgeDef = badgeBanner ? BADGE_BY_ID[badgeBanner] : null;
  const badgeLeaves = badgeDef?.leaves ?? 4;

  return (
    <>
      {badgeBanner && badgeDef ? (
        <div className="badge-toast">
          <div className="badge-toast-inner">
            <CloverBadgeArt leaves={badgeLeaves} size={72} />
            <div className="badge-toast-text">
              <span className="badge-toast-heading">Badge earned!</span>
              <span className="badge-toast-title">{badgeDef.title}</span>
              <span className="badge-toast-desc">{badgeDef.shortName}</span>
              <span className="badge-toast-leaderboard">
                You&apos;re on the{" "}
                <a href="/leaderboard" className="badge-toast-link">leaderboard</a>
                {" "}— check your{" "}
                <a href="/protected/badges" className="badge-toast-link">badges</a>!
              </span>
            </div>
            <button
              className="badge-toast-dismiss"
              onClick={() => setBadgeBanner(null)}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      ) : null}
    <form className="form post-finds-form" onSubmit={onSubmit}>
      <p className="profile-panel-muted post-finds-map-intro">
        Drag the pin or tap the map to set where this find belongs. Coordinates update live (
        {lat.toFixed(5)}, {lng.toFixed(5)}).
      </p>
      <PostFindsMap initialLat={DEFAULT_LAT} initialLng={DEFAULT_LNG} onPositionChange={onMove} />
      <label>
        Title
        <input
          type="text"
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Seven-leaf behind the bench"
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          placeholder="What made this spot special?"
          className="post-finds-textarea"
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={shareClovermedia}
          onChange={(e) => setShareClovermedia(e.target.checked)}
        />
        Also publish my photo on Clovermedia (community gallery). Requires an image.
      </label>
      <label>
        Photo (optional, max {formatImageMaxMb()})
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <p className="profile-panel-muted field-hint">
        You can save many finds — each has its own title, story, and pin. Limits per find: title{" "}
        {FINDS_LIMITS.titleMax} characters, description {FINDS_LIMITS.descriptionMax} characters,
        photo {formatImageMaxMb()}.
      </p>
      {shareClovermedia && !file ? (
        <p className="prefs-note">Pick a photo above for Clovermedia sharing.</p>
      ) : null}
      {err ? <p className="error">{err}</p> : null}
      {msg ? <p className="success">{msg}</p> : null}
      <button type="submit" disabled={busy || disabled}>
        {disabled ? "Create finds table first (above)" : busy ? "Saving…" : "Save find"}
      </button>
      <div className="actions" style={{ marginTop: "1rem" }}>
        <Link href="/clovermedia" className="button secondary">
          Browse Clovermedia
        </Link>
        <Link href="/" className="button secondary">
          Back to map
        </Link>
      </div>
    </form>
    </>
  );
}
