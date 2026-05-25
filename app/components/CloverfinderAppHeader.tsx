import Link from "next/link";
import { CloverLogo } from "@/app/components/CloverLogo";

/** Shared top strip: clover (home), title, tagline — used on profile and auth screens. */
export function CloverfinderAppHeader() {
  return (
    <header className="hero app-chrome-header">
      <div className="hero-top">
        <Link className="logo-link" href="/" aria-label="Go to CloverFinder homepage">
          <CloverLogo />
        </Link>
        <div className="hero-text">
          <h1>CloverFinder</h1>
          <p>
            look at where people find their clovers, you might find some of your own there!
          </p>
        </div>
      </div>
    </header>
  );
}
