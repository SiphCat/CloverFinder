import { NextResponse } from "next/server";
import { fetchLeaderboardRows, parseLeavesFilter, type LeaderboardRow } from "@/lib/leaderboardData";

export type { LeaderboardRow };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leavesParam = searchParams.get("leaves");
  const badgeId = parseLeavesFilter(leavesParam);

  if (badgeId === "invalid") {
    return NextResponse.json(
      { error: "Invalid leaves filter. Use all or 4–10." },
      { status: 400 }
    );
  }

  const leaves = leavesParam && leavesParam !== "all" ? leavesParam : "all";
  const { rows, error, truncated } = await fetchLeaderboardRows(leaves);

  if (error) {
    return NextResponse.json({ error, hint: undefined }, { status: 400 });
  }

  return NextResponse.json(
    { rows, filter: leaves, truncated },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120"
      }
    }
  );
}
