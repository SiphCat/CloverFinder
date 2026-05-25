"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CloverBadgeArt } from "@/app/components/CloverBadgeArt";
import { BADGE_BY_ID, BADGE_DEFINITIONS } from "@/lib/badges";

type Stat = { badge_id: string; earners: number; total_users: number };
type Row = { id: string; badge_id: string; proof_image_url: string | null; created_at: string };

export function BadgesExplorer() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const [cRes, mRes] = await Promise.all([
      fetch("/api/badges/catalog"),
      fetch("/api/badges/mine")
    ]);
    if (!cRes.ok) {
      const j = (await cRes.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Could not load badge stats");
      return;
    }
    const cJson = (await cRes.json()) as { stats?: Stat[] };
    setStats(cJson.stats ?? []);
    if (mRes.ok) {
      const mJson = (await mRes.json()) as { rows?: Row[] };
      setRows(mJson.rows ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statById = useMemo(() => {
    const m = new Map<string, Stat>();
    for (const s of stats) {
      m.set(s.badge_id, {
        ...s,
        earners: Number(s.earners),
        total_users: Number(s.total_users)
      });
    }
    return m;
  }, [stats]);

  const mineByBadge = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) {
      const list = m.get(r.badge_id) ?? [];
      list.push(r);
      m.set(r.badge_id, list);
    }
    return m;
  }, [rows]);

  const earnedIds = useMemo(() => new Set(rows.map((r) => r.badge_id)), [rows]);

  const openDef = openId ? BADGE_BY_ID[openId] : undefined;
  const openStat = openId ? statById.get(openId) : undefined;
  const openProofs = openId ? mineByBadge.get(openId) ?? [] : [];

  return (
    <div className="badges-explorer">
      <p className="profile-panel-muted">
        Every badge can be earned more than once — each scan keeps another proof photo. Percentages
        use all signed-up accounts in this Supabase project as the denominator.
      </p>
      {err ? <p className="error">{err}</p> : null}

      <div className="badges-all-grid">
        {BADGE_DEFINITIONS.map((b) => {
          const st = statById.get(b.id);
          const earned = earnedIds.has(b.id);
          const pct =
            st && st.total_users > 0 ? Math.round((st.earners / st.total_users) * 1000) / 10 : 0;
          return (
            <button
              key={b.id}
              type="button"
              className={`badges-tile${earned ? " badges-tile--earned" : ""}`}
              onClick={() => setOpenId(b.id)}
            >
              <CloverBadgeArt leaves={b.leaves} size={96} />
              <span className="badges-tile-title">{b.shortName}</span>
              <span className="badges-tile-meta">
                {st ? `${pct}% of explorers · ${st.earners} earned` : "—"}
              </span>
              {!earned ? <span className="badges-tile-lock">Not yet</span> : null}
            </button>
          );
        })}
      </div>

      <p className="profile-panel-muted" style={{ marginTop: "1.25rem" }}>
        <Link href="/protected">← Back to profile</Link>
      </p>

      {openDef ? (
        <div className="badge-modal-root" role="dialog" aria-modal="true" aria-labelledby="badge-modal-title">
          <button type="button" className="badge-modal-backdrop" aria-label="Close" onClick={() => setOpenId(null)} />
          <div className="badge-modal-panel">
            <button type="button" className="badge-modal-close" onClick={() => setOpenId(null)}>
              ×
            </button>
            <div className="badge-modal-hero">
              <CloverBadgeArt leaves={openDef.leaves} size={120} />
              <div>
                <h2 id="badge-modal-title">{openDef.title}</h2>
                <p className="profile-panel-muted">{openDef.description}</p>
                <p className="badge-modal-rarity">{openDef.rarityNote}</p>
                {openStat ? (
                  <p className="badge-modal-stats">
                    <strong>{openStat.earners}</strong> explorers earned this ·{" "}
                    <strong>
                      {openStat.total_users > 0
                        ? Math.round((openStat.earners / openStat.total_users) * 1000) / 10
                        : 0}
                    </strong>
                    % of all accounts
                  </p>
                ) : null}
              </div>
            </div>
            <h3 className="badge-modal-sub">Your photos for this badge</h3>
            {openProofs.length === 0 ? (
              <p className="profile-panel-muted">Scan a matching photo from your profile to start this shelf.</p>
            ) : (
              <ul className="badge-modal-proofs">
                {openProofs.map((p) => (
                  <li key={p.id}>
                    {p.proof_image_url ? (
                      <a href={p.proof_image_url} target="_blank" rel="noreferrer" className="badge-proof-card">
                        <img src={p.proof_image_url} alt="" className="badge-proof-thumb" />
                        <span className="badge-proof-date">
                          {new Date(p.created_at).toLocaleString(undefined, { dateStyle: "medium" })}
                        </span>
                      </a>
                    ) : (
                      <span className="profile-panel-muted">Proof missing</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
