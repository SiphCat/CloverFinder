import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeReviewContact } from "@/app/components/BadgeReviewContact";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { isSupabaseReady } from "@/lib/supabase/env";

export default async function RequestReviewPage() {
  if (!isSupabaseReady()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/log-in?next=/protected/request-review");
  }

  return (
    <>
      <h1 className="profile-panel-title">Request a human review</h1>
      <p className="profile-panel-muted">
        If automatic checking declined your photo but you believe it shows a real clover, a person on
        the Cloverfinder team can review it. Automatic uploads only accept photos our system
        recognizes as clover.
      </p>
      <BadgeReviewContact userId={user.id} userEmail={user.email ?? null} />
      <p className="profile-panel-muted" style={{ marginTop: "1.25rem" }}>
        <Link href="/protected">← Back to profile</Link>
      </p>
    </>
  );
}
