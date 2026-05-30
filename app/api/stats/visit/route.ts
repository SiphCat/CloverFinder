import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchSiteStats } from "@/lib/siteStats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VISIT_COOKIE = "cf_visit_recorded";
const VISIT_COOKIE_MAX_AGE = 60 * 60 * 24;

export async function GET() {
  const stats = await fetchSiteStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120"
    }
  });
}

/** Count one visit per browser per day (deduped via cookie). */
export async function POST() {
  const cookieStore = await cookies();
  if (cookieStore.get(VISIT_COOKIE)) {
    const stats = await fetchSiteStats();
    return NextResponse.json({ recorded: false, ...stats });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: visitors, error } = await supabase.rpc("increment_site_visitors");

    if (error) {
      const stats = await fetchSiteStats();
      return NextResponse.json(
        { recorded: false, ...stats, error: error.message },
        { status: 400 }
      );
    }

    const stats = await fetchSiteStats();
    const response = NextResponse.json({
      recorded: true,
      visitors: typeof visitors === "number" ? visitors : stats.visitors,
      finds: stats.finds
    });

    response.cookies.set(VISIT_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: VISIT_COOKIE_MAX_AGE
    });

    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not record visit.";
    return NextResponse.json({ recorded: false, error: message }, { status: 500 });
  }
}
