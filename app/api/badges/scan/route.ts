import { NextResponse } from "next/server";
import { analyzeCloverImage } from "@/lib/analyzeCloverImage";
import { badgeIdForLeaves } from "@/lib/badges";
import { badgeReviewEmail } from "@/lib/badgeReviewContact";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a clover photo to upload." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo is too large (max 5 MB)." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

  const analysis = await analyzeCloverImage(buf, mime);
  if (!analysis.ok) {
    return NextResponse.json(
      {
        error: analysis.reason,
        code: analysis.code,
        canRequestReview: analysis.canRequestReview,
        reviewEmail: badgeReviewEmail(),
        reviewPath: "/protected/request-review"
      },
      { status: 422 }
    );
  }

  const leaves = analysis.leaves;
  const badgeId = badgeIdForLeaves(leaves);
  const service = createSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      {
        error:
          "Saving badges needs the Supabase service role. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and run supabase/sql/cloverfinder_finds_badges_media.sql."
      },
      { status: 503 }
    );
  }

  const path = `${user.id}/${Date.now()}.jpg`;
  const { error: upErr } = await service.storage.from("badge-proofs").upload(path, buf, {
    contentType: mime,
    upsert: false
  });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  const {
    data: { publicUrl }
  } = service.storage.from("badge-proofs").getPublicUrl(path);

  const { data: prior } = await service
    .from("user_badges")
    .select("id")
    .eq("user_id", user.id)
    .eq("badge_id", badgeId)
    .limit(1);

  const distinctBadgeFirstTime = !prior?.length;

  const { error: insErr } = await service.from("user_badges").insert({
    user_id: user.id,
    badge_id: badgeId,
    proof_image_url: publicUrl
  });
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  return NextResponse.json({
    badgeId,
    leaves,
    method: analysis.method,
    awarded: true,
    proofImageUrl: publicUrl,
    distinctBadgeFirstTime
  });
}
