"use client";

import Link from "next/link";
import { badgeReviewEmail, badgeReviewMailtoUrl } from "@/lib/badgeReviewContact";

type Props = {
  userId: string;
  userEmail: string | null;
  compact?: boolean;
};

export function BadgeReviewContact({ userId, userEmail, compact = false }: Props) {
  const mailto = badgeReviewMailtoUrl({ userId, userEmail });
  const email = badgeReviewEmail();

  return (
    <div className={`badge-review-contact${compact ? " badge-review-contact--compact" : ""}`}>
      <p className="profile-panel-muted">
        Email us with your photo attached. Include your account details so a reviewer can find you.
      </p>
      <p className="badge-review-email">
        <a href={mailto} className="button secondary">
          Email for human review
        </a>
        <span className="profile-panel-muted">
          {" "}
          or write to <a href={`mailto:${email}`}>{email}</a>
        </span>
      </p>
      {!compact ? (
        <p className="profile-panel-muted">
          <Link href="/protected/request-review">More about review requests</Link>
        </p>
      ) : null}
    </div>
  );
}
