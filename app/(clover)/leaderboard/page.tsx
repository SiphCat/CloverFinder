import { LeaderboardPanel } from "@/app/components/LeaderboardPanel";
import { fetchLeaderboardRows } from "@/lib/leaderboardData";
import { parseLeafFilter } from "@/lib/leaderboardFilters";

type Props = {
  searchParams: Promise<{ leaves?: string }>;
};

export default async function LeaderboardPage({ searchParams }: Props) {
  const { leaves } = await searchParams;
  const initialFilter = parseLeafFilter(leaves);
  const { rows, error, truncated } = await fetchLeaderboardRows(initialFilter);

  return (
    <main className="map-area credits-area leaderboard-area">
      <LeaderboardPanel
        initialRows={rows}
        initialError={error}
        initialFilter={initialFilter}
        initialTruncated={truncated}
      />
    </main>
  );
}
