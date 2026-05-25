import Link from "next/link";

const CHALLENGES = [
  {
    id: "most-clovers",
    title: "Find the most clovers",
    description:
      "Collect the highest number of verified clover badges. Every scan on your profile counts — rack up finds and climb the rankings.",
    joinHref: "/leaderboard",
    joinLabel: "Join this challenge"
  },
  {
    id: "highest-leaf",
    title: "Highest leaf clover",
    description:
      "Hunt for the rarest clover you can. Earn badges for 5-, 6-, 7-leaf clovers and beyond — the more leaves, the higher you rank.",
    joinHref: "/protected",
    joinLabel: "Join this challenge"
  },
  {
    id: "map-explorer",
    title: "Cover the map",
    description:
      "Post your finds far and wide. Drop pins wherever you discover clovers so other finders can see hot spots on the globe.",
    joinHref: "/protected/post-finds",
    joinLabel: "Join this challenge"
  }
] as const;

export default function ChallengesPage() {
  return (
    <main className="map-area credits-area challenges-area">
      <section className="credits-card challenges-card">
        <h2>Challenges</h2>
        <p className="challenges-intro">
          Join a challenge, then play on your profile and the map. Compete with other finders for the most
          clovers and the highest leaf counts.
        </p>

        <ul className="challenges-grid">
          {CHALLENGES.map((challenge) => (
            <li key={challenge.id} className="challenge-item">
              <h3 className="challenge-item-title">{challenge.title}</h3>
              <p className="challenge-item-desc">{challenge.description}</p>
              <Link href={challenge.joinHref} className="challenge-join-btn">
                {challenge.joinLabel}
              </Link>
            </li>
          ))}
        </ul>

        <p className="challenges-footnote">
          Signed in? Scan clovers on your <Link href="/protected">profile</Link> and check the{" "}
          <Link href="/leaderboard">leaderboard</Link> to see how you stack up.
        </p>
      </section>
    </main>
  );
}
