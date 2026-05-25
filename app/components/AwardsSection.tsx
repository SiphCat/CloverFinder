"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeReviewContact } from "@/app/components/BadgeReviewContact";
import { CloverLoadingScreen } from "@/app/components/CloverLoadingScreen";
import { BADGE_BY_ID } from "@/lib/badges";
import { CloverBadgeArt } from "@/app/components/CloverBadgeArt";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type BadgeRow = {
  id: string;
  badge_id: string;
  proof_image_url: string | null;
  created_at: string;
};

type Props = {
  initialRows?: BadgeRow[];
};

type ScanReject = {
  message: string;
  code?: string;
};

export function AwardsSection({ initialRows }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BadgeRow[]>(initialRows ?? []);
  const [loading, setLoading] = useState(initialRows === undefined);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [scanReject, setScanReject] = useState<ScanReject | null>(null);
  const [reviewUser, setReviewUser] = useState<{ id: string; email: string | null } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/badges/mine", { cache: "no-store" });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { rows?: BadgeRow[] };
    setRows(data.rows ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialRows === undefined) {
      void load();
    }
  }, [load, initialRows]);

  useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();
      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setReviewUser({ id: data.user.id, email: data.user.email ?? null });
        }
      });
    } catch {
      /* env not configured */
    }
  }, []);

  const distinct = useMemo(() => {
    const map = new Map<string, BadgeRow>();
    for (const r of rows) {
      if (!map.has(r.badge_id)) map.set(r.badge_id, r);
    }
    return [...map.values()].sort((a, b) => a.badge_id.localeCompare(b.badge_id));
  }, [rows]);

  async function onPhotoSelected(file: File | null) {
    if (!file) return;
    setScanBusy(true);
    setScanReject(null);
    setScanMsg(null);

    const fd = new FormData();
    fd.set("image", file);
    try {
      const res = await fetch("/api/badges/scan", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        canRequestReview?: boolean;
        badgeId?: string;
        leaves?: number;
        method?: string;
        distinctBadgeFirstTime?: boolean;
      };

      if (!res.ok) {
        if (res.status === 422 && data.canRequestReview) {
          setScanReject({
            message: data.error ?? "This photo could not be accepted.",
            code: data.code
          });
        } else {
          setScanReject({ message: data.error ?? "Upload failed." });
        }
        return;
      }

      const def = data.badgeId ? BADGE_BY_ID[data.badgeId] : undefined;
      setScanMsg(
        `Verified ${data.leaves}-leaf clover${def ? ` — ${def.shortName}` : ""}. ` +
          (data.distinctBadgeFirstTime ? "New badge for you! " : "Proof saved. ")
      );
      await load();
      router.refresh();
    } catch {
      setScanReject({ message: "Network error while checking your photo." });
    } finally {
      setScanBusy(false);
    }
  }

  return (
    <section className="awards-section" aria-labelledby="awards-heading">
      <h2 id="awards-heading" className="awards-heading">
        Your awards
      </h2>
      <p className="profile-panel-muted awards-lead">
        Choose a clover photo — we check it automatically. Only real clover images are saved; other
        photos are rejected.
      </p>

      <div
        className={`awards-upload-zone${scanBusy ? " awards-upload-zone--busy" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => !scanBusy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!scanBusy) inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="awards-scan-input"
          disabled={scanBusy}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = "";
            void onPhotoSelected(f);
          }}
        />
        <span className="awards-upload-icon" aria-hidden>
          🍀
        </span>
        <span className="awards-upload-title">
          {scanBusy ? "Checking your photo…" : "Upload a clover photo"}
        </span>
        <span className="awards-upload-hint">
          {scanBusy ? "Please wait" : "Tap to pick — scanning starts right away"}
        </span>
      </div>

      {scanReject ? (
        <div className="awards-reject" role="alert">
          <p className="error">{scanReject.message}</p>
          {reviewUser ? (
            <BadgeReviewContact
              userId={reviewUser.id}
              userEmail={reviewUser.email}
              compact
            />
          ) : (
            <p className="profile-panel-muted">
              <Link href="/protected/request-review">Request a human review</Link>
            </p>
          )}
        </div>
      ) : null}
      {scanMsg ? <p className="success">{scanMsg}</p> : null}

      {loading ? (
        <CloverLoadingScreen label="Loading awards…" />
      ) : null}
      {!loading && distinct.length === 0 ? (
        <p className="profile-panel-muted">No badges yet — upload a clover photo above.</p>
      ) : null}
      {!loading && distinct.length > 0 ? (
        <ul className="awards-grid">
          {distinct.map((r) => {
            const def = BADGE_BY_ID[r.badge_id];
            const leaves = def?.leaves ?? (Number(r.badge_id.replace("leaf-", "")) || 4);
            return (
              <li key={r.badge_id} className="awards-card">
                <div className="awards-card-art">
                  <CloverBadgeArt leaves={leaves} size={88} />
                </div>
                <div className="awards-card-body">
                  <p className="awards-card-title">{def?.title ?? r.badge_id}</p>
                  {r.proof_image_url ? (
                    <a href={r.proof_image_url} target="_blank" rel="noreferrer" className="awards-proof">
                      Latest proof
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="awards-footer">
        <Link href="/protected/badges" className="button secondary">
          See more badges
        </Link>
      </div>
    </section>
  );
}
