import Link from "next/link";
import { LandingStats } from "@/app/components/LandingStats";
import { fetchSiteStats } from "@/lib/siteStats";

export default async function HomePage() {
  const stats = await fetchSiteStats();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <img
            src="/cloverfinder-logo.png?v=3"
            alt=""
            className="landing-hero-logo"
            width={80}
            height={80}
          />
          <h2 className="landing-hero-title">
            Find four-leaf clovers and share them with the world
          </h2>
          <p className="landing-hero-sub">
            CloverFinder is a community-powered map where people log their lucky
            clover finds. Snap a photo, get it verified by AI, earn badges, and
            see where clovers grow near you.
          </p>
          <div className="landing-hero-cta">
            <Link href="/auth/sign-up" className="landing-btn landing-btn--primary">
              Sign Up
            </Link>
            <Link href="/map" className="landing-btn landing-btn--secondary">
              Explore the Map
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section">
        <h3 className="landing-section-title">How It Works</h3>
        <div className="landing-steps">
          <div className="landing-step">
            <span className="landing-step-num">1</span>
            <h4>Post a Find</h4>
            <p>
              Snap a photo of your clover, drop a pin on the map, and upload
              your discovery.
            </p>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">2</span>
            <h4>AI Verification</h4>
            <p>
              Our built-in AI checks your photo to confirm it&apos;s a real
              clover and counts the leaves.
            </p>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">3</span>
            <h4>Earn Badges &amp; Climb</h4>
            <p>
              Collect badges for rare finds, compete on the leaderboard, and
              build your clover portfolio.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section landing-section--alt">
        <h3 className="landing-section-title">Features</h3>
        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-icon">🗺️</span>
            <h4>Interactive Globe</h4>
            <p>
              A 3D globe with satellite imagery, real planet positions, and
              every clover find pinned in place.
            </p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">📸</span>
            <h4>Clovermedia</h4>
            <p>
              Scroll through a feed of the best clover finds, like your
              favorites, and leave comments.
            </p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">🏅</span>
            <h4>Badges</h4>
            <p>
              Unlock badges for four-leaf, five-leaf, and rarer clovers. Show
              off your collection on your profile.
            </p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">🏆</span>
            <h4>Leaderboard</h4>
            <p>
              See who&apos;s found the most clovers and compete for the top
              spot in your region or worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <LandingStats initialStats={stats} />

      {/* Footer CTA */}
      <section className="landing-section landing-footer-cta">
        <h3 className="landing-section-title">Ready to start?</h3>
        <p className="landing-footer-sub">
          Join the community and pin your first clover find on the map.
        </p>
        <div className="landing-hero-cta">
          <Link href="/auth/sign-up" className="landing-btn landing-btn--primary">
            Sign Up
          </Link>
          <Link href="/map" className="landing-btn landing-btn--secondary">
            Explore the Map
          </Link>
        </div>
        <div className="landing-legal-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/credits">Credits</Link>
        </div>
      </section>
    </div>
  );
}
