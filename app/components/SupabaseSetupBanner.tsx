import { isSupabaseReady } from "@/lib/supabase/env";

export function SupabaseSetupBanner() {
  if (isSupabaseReady()) return null;

  return (
    <div
      role="alert"
      style={{
        background: "#fef3c7",
        borderBottom: "1px solid #f59e0b",
        padding: "0.65rem 1rem",
        fontSize: "0.92rem",
        color: "#78350f"
      }}
    >
      <strong>Supabase not connected.</strong> In the project folder, run{" "}
      <code style={{ background: "#fde68a", padding: "0 4px", borderRadius: 4 }}>
        cp .env.example .env.local
      </code>
      , open{" "}
      <code style={{ background: "#fde68a", padding: "0 4px", borderRadius: 4 }}>
        .env.local
      </code>
      , paste <strong>Project URL</strong> and <strong>anon public</strong> key from{" "}
      <a
        href="https://supabase.com/dashboard/project/_/settings/api"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#92400e" }}
      >
        Supabase → Settings → API
      </a>
      , then restart <code style={{ background: "#fde68a", padding: "0 4px", borderRadius: 4 }}>npm run dev</code>.
      Check{" "}
      <a href="/api/health/supabase" style={{ color: "#92400e" }}>
        /api/health/supabase
      </a>{" "}
      — it should say <code>ok: true</code>.
    </div>
  );
}
