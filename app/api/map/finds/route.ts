import { NextResponse } from "next/server";
import type { MapFindsFeatureCollection } from "@/lib/mapFindsGeoJson";
import { parseLeafFilter } from "@/lib/leaderboardFilters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_POINTS = 25_000;

/** Lightweight map pins for clustering; optional ?leaves=all|4|…|10 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leaves = parseLeafFilter(searchParams.get("leaves"));

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("finds").select("id, title, lat, lng").limit(MAX_POINTS);

  if (leaves !== "all") {
    const n = Number.parseInt(leaves, 10);
    query = query.eq("leaf_count", n);
  }

  const { data, error } = await query;

  if (error) {
    const missingColumn = error.message.includes("leaf_count");
    return NextResponse.json(
      {
        error: missingColumn
          ? "Map leaf filter needs a database update. Run supabase/sql/add_find_leaf_count.sql in Supabase SQL Editor."
          : error.message
      },
      { status: 400 }
    );
  }

  const features =
    data?.map((row) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [row.lng, row.lat] as [number, number]
      },
      properties: {
        id: row.id,
        title: row.title
      }
    })) ?? [];

  const body: MapFindsFeatureCollection = {
    type: "FeatureCollection",
    features
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
    }
  });
}
