"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DatabaseSetupPanel } from "@/app/components/DatabaseSetupPanel";
import { PostFindsPanel } from "@/app/components/PostFindsPanel";
import type { UserFind } from "@/app/components/YourFindsList";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseReady } from "@/lib/supabase/env";

function sqlEditorUrl(): string {
  const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  return ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : "https://supabase.com/dashboard";
}

export function PostFindsPageClient() {
  const router = useRouter();
  const [findsTableReady, setFindsTableReady] = useState<boolean | null>(null);
  const [initialFinds, setInitialFinds] = useState<UserFind[]>([]);

  useEffect(() => {
    if (!isSupabaseReady()) {
      router.replace("/");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        router.replace("/auth/log-in?next=/protected/post-finds");
        return;
      }

      const { error: findsErr } = await supabase.from("finds").select("id").limit(1);
      const ready = !findsErr;
      setFindsTableReady(ready);

      if (ready) {
        const { data } = await supabase
          .from("finds")
          .select("id, title, description, lat, lng, image_path, share_clovermedia, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setInitialFinds((data ?? []) as UserFind[]);
      }
    })();
  }, [router]);

  if (findsTableReady === null) {
    return (
      <>
        <h1 className="profile-panel-title">Post your finds</h1>
        <p className="profile-panel-muted">Loading…</p>
      </>
    );
  }

  return (
    <>
      <h1 className="profile-panel-title">Post your finds</h1>
      {!findsTableReady ? (
        <section className="dev-setup-card" style={{ marginBottom: "1.5rem" }}>
          <h2 className="profile-panel-title" style={{ fontSize: "1.1rem" }}>
            Database setup required
          </h2>
          <p className="profile-panel-muted">
            The <code>finds</code> table is not in your Supabase project yet. Create it once using
            the steps below, then post finds as usual.
          </p>
          <DatabaseSetupPanel sqlEditorUrl={sqlEditorUrl()} />
        </section>
      ) : (
        <p className="profile-panel-muted">
          Drag the pin on the map, add a title and story, and optionally share a photo on Clovermedia.
        </p>
      )}
      <PostFindsPanel disabled={!findsTableReady} initialFinds={initialFinds} />
    </>
  );
}
