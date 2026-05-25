import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { analyzeCloverImage } from "@/lib/analyzeCloverImage";
import { badgeIdForLeaves } from "@/lib/badges";
import { FINDS_LIMITS } from "@/lib/findsLimits";
import { parseFindInput } from "@/lib/parseFindInput";
import { resolveSupabaseDbUrl } from "@/lib/resolveSupabaseDbUrl";
import { runFindsMigration } from "@/lib/runFindsMigration";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

let findsMigrationAttempted = false;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("finds")
    .select("id, title, description, lat, lng, image_path, share_clovermedia, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ finds: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const parsed = parseFindInput(
    form.get("title"),
    form.get("description"),
    form.get("lat"),
    form.get("lng"),
    form.get("share_clovermedia")
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { title, description, lat, lng, shareRequested } = parsed.data;
  const file = form.get("image");

  let imagePath: string | null = null;
  let leafCount: number | null = null;
  let imageHash: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > FINDS_LIMITS.imageMaxBytes) {
      return NextResponse.json(
        {
          error: `Photo is too large (max ${FINDS_LIMITS.imageMaxBytes / (1024 * 1024)} MB).`
        },
        { status: 400 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

    imageHash = createHash("sha256").update(buf).digest("hex");

    // Check for duplicate image across all users
    try {
      const { data: dup } = await supabase
        .from("finds")
        .select("id")
        .eq("image_hash", imageHash)
        .limit(1);
      if (dup && dup.length > 0) {
        return NextResponse.json(
          { error: "This exact photo has already been posted. Please use a different image." },
          { status: 409 }
        );
      }
    } catch {
      // image_hash column might not exist yet — skip check
    }

    const analysis = await analyzeCloverImage(buf, mime);
    if (!analysis.ok) {
      return NextResponse.json(
        { error: analysis.reason, code: analysis.code },
        { status: 422 }
      );
    }
    leafCount = analysis.leaves;
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from("finds").upload(path, buf, {
      contentType: mime,
      upsert: false
    });
    if (upErr) {
      return NextResponse.json(
        {
          error: upErr.message.includes("Bucket not found")
            ? "Photo upload needs the finds bucket. Run supabase/sql/cloverfinder_finds_badges_media.sql."
            : upErr.message
        },
        { status: 400 }
      );
    }
    imagePath = path;
  }

  const share_clovermedia = Boolean(shareRequested && imagePath);

  if (process.env.NODE_ENV !== "production" && !findsMigrationAttempted) {
    findsMigrationAttempted = true;
    const dbUrl = resolveSupabaseDbUrl(process.env);
    if (dbUrl) await runFindsMigration(dbUrl);
  }

  const { data: row, error } = await supabase
    .from("finds")
    .insert({
      user_id: user.id,
      title,
      description,
      lat,
      lng,
      image_path: imagePath,
      image_hash: imageHash,
      share_clovermedia,
      leaf_count: leafCount
    })
    .select("id")
    .single();

  if (error) {
    const missingTable =
      error.message.includes("schema cache") ||
      error.message.includes("Could not find the table");
    return NextResponse.json(
      {
        error: error.message,
        hint: missingTable
          ? "Open /dev to create the table (add SUPABASE_DB_PASSWORD to .env.local for one-click setup), or run supabase/sql/ensure_finds_table.sql in Supabase → SQL Editor."
          : undefined
      },
      { status: 400 }
    );
  }

  // Auto-award badge when a valid clover photo is posted
  let badgeAwarded: string | null = null;
  if (leafCount && leafCount >= 4) {
    const badgeId = badgeIdForLeaves(leafCount);
    const proofUrl = imagePath
      ? supabase.storage.from("finds").getPublicUrl(imagePath).data.publicUrl
      : null;

    // Try service client first (bypasses RLS), fall back to user client
    const badgeClient = createSupabaseServiceClient() ?? supabase;
    try {
      const { error: badgeErr } = await badgeClient.from("user_badges").insert({
        user_id: user.id,
        badge_id: badgeId,
        proof_image_url: proofUrl,
      });
      if (!badgeErr) {
        badgeAwarded = badgeId;
      }
    } catch {
      // user_badges table might not exist yet — non-fatal
    }
  }

  return NextResponse.json({
    id: row?.id,
    share_clovermedia,
    badgeAwarded,
    message: shareRequested && !imagePath
      ? "Find saved. Add a photo next time to publish on Clovermedia."
      : badgeAwarded
        ? `Find saved! You earned the ${badgeAwarded} badge!`
        : "Find saved."
  });
}
