/** Where users can ask for a human badge photo review. */
export function badgeReviewEmail(): string {
  return (
    process.env.NEXT_PUBLIC_BADGE_REVIEW_EMAIL?.trim() ||
    process.env.BADGE_REVIEW_EMAIL?.trim() ||
    "reviews@cloverfinder.app"
  );
}

export function badgeReviewMailtoUrl(opts: {
  userEmail?: string | null;
  userId?: string;
  note?: string;
}): string {
  const to = badgeReviewEmail();
  const subject = encodeURIComponent("Cloverfinder — badge photo review request");
  const lines = [
    "Hi Cloverfinder team,",
    "",
    "Please review my photo for a badge. I believe it shows a real clover but automatic check declined it.",
    "",
    opts.userId ? `Account user id: ${opts.userId}` : "",
    opts.userEmail ? `Account email: ${opts.userEmail}` : "",
    "",
    "Attach your photo to this email or describe where we can find it in the app.",
    opts.note ? `\nMy note: ${opts.note}` : ""
  ].filter(Boolean);
  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
