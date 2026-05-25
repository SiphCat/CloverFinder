"use client";

import { useCallback, useEffect, useState } from "react";

const MINIMAL_SQL = `-- Paste in Supabase SQL Editor → Run
create table if not exists public.finds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  lat double precision not null check (lat >= -90 and lat <= 90),
  lng double precision not null check (lng >= -180 and lng <= 180),
  image_path text,
  share_clovermedia boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.finds enable row level security;
drop policy if exists "finds_select_visible" on public.finds;
create policy "finds_select_visible" on public.finds for select
using (auth.uid() = user_id or (share_clovermedia = true and image_path is not null));
drop policy if exists "finds_insert_own" on public.finds;
create policy "finds_insert_own" on public.finds for insert to authenticated
with check (auth.uid() = user_id);
notify pgrst, 'reload schema';`;

type Health = {
  findsTableReady?: boolean;
  findsHint?: string;
};

export function DatabaseSetupPanel({ sqlEditorUrl }: { sqlEditorUrl: string }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [copied, setCopied] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupMsg, setSetupMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/health/supabase");
    setHealth((await res.json()) as Health);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function copySql() {
    await navigator.clipboard.writeText(MINIMAL_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function runAutoSetup() {
    setSetupBusy(true);
    setSetupMsg(null);
    const res = await fetch("/api/dev/setup-database", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      error?: string;
      hint?: string;
    };
    setSetupBusy(false);
    if (!res.ok) {
      setSetupMsg([data.error, data.hint].filter(Boolean).join(" — "));
      return;
    }
    setSetupMsg(data.message ?? "Table created.");
    await refresh();
  }

  return (
    <div className="dev-setup-panel">
      <p className={`dev-setup-status${health?.findsTableReady ? " dev-setup-status--ok" : ""}`}>
        {health === null
          ? "Checking database…"
          : health.findsTableReady
            ? "finds table is ready."
            : "finds table is missing — follow the steps below."}
      </p>

      {!health?.findsTableReady ? (
        <>
          <p className="dev-setup-auto">
            <strong>Automatic (easiest):</strong> add your Supabase <strong>database password</strong> to{" "}
            <code>.env.local</code>, restart <code>npm run dev</code>, then click below.
          </p>
          <pre className="dev-setup-env-line">SUPABASE_DB_PASSWORD=your_database_password</pre>
          <p className="profile-panel-muted dev-setup-auto-hint">
            Password: Supabase → Project Settings → Database (same project as your app URL).
          </p>
          <button type="button" disabled={setupBusy} onClick={() => void runAutoSetup()}>
            {setupBusy ? "Creating table…" : "Create finds table from this app"}
          </button>
          {setupMsg ? (
            <p className={setupMsg.toLowerCase().includes("created") ? "success" : "error"}>{setupMsg}</p>
          ) : null}

          <p className="dev-setup-or">or manually in SQL Editor:</p>
          <ol className="dev-setup-steps">
            <li>
              <a href={sqlEditorUrl} target="_blank" rel="noreferrer">
                Open Supabase SQL Editor
              </a>{" "}
              for this project
            </li>
            <li>
              <button type="button" className="secondary" onClick={() => void copySql()}>
                {copied ? "Copied!" : "Copy SQL to clipboard"}
              </button>
            </li>
            <li>Paste into the editor and click <strong>Run</strong></li>
            <li>
              <button type="button" onClick={() => void refresh()}>
                Re-check status
              </button>
            </li>
          </ol>
          <details className="dev-setup-sql-details">
            <summary>Show SQL</summary>
            <pre className="dev-setup-sql-pre">{MINIMAL_SQL}</pre>
          </details>
          <p className="profile-panel-muted">
            Or in Terminal: <code>npm run db:setup</code> (after <code>SUPABASE_DB_PASSWORD</code> is in{" "}
            <code>.env.local</code>).
          </p>
        </>
      ) : null}
    </div>
  );
}
