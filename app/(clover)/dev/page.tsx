import Link from "next/link";
import { DatabaseSetupPanel } from "@/app/components/DatabaseSetupPanel";

function projectRefFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
}

export default function DevPage() {
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const sqlEditorUrl = ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : "https://supabase.com/dashboard";

  return (
    <main className="map-area credits-area dev-setup-page">
      <section className="credits-card dev-setup-card">
        <h2>Dev — database setup</h2>
        <p>
          If you see <strong>Could not find the table &apos;public.finds&apos;</strong>, the table
          has not been created in your Supabase project yet.
        </p>
        {ref ? (
          <p className="dev-setup-ref">
            Your project ref: <code>{ref}</code> (must match <code>.env.local</code>)
          </p>
        ) : null}
        <DatabaseSetupPanel sqlEditorUrl={sqlEditorUrl} />
        <p className="dev-setup-links">
          <Link href="/api/health/supabase">Check /api/health/supabase</Link>
          {" · "}
          <Link href="/clovermedia">Clovermedia</Link>
        </p>
      </section>
    </main>
  );
}
