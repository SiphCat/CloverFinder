/** Lightweight placeholder rows — avoids the full clover animation on filter changes. */
export function LeaderboardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ol className="leaderboard-list leaderboard-list--loading" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="leaderboard-row leaderboard-row--skeleton">
          <span className="leaderboard-skeleton-block leaderboard-skeleton-rank" />
          <span className="leaderboard-skeleton-block leaderboard-skeleton-avatar" />
          <span className="leaderboard-skeleton-block leaderboard-skeleton-name" />
          <span className="leaderboard-skeleton-block leaderboard-skeleton-count" />
        </li>
      ))}
    </ol>
  );
}
