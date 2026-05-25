import Link from "next/link";

export const metadata = { title: "Privacy Policy — Cloverfinder" };

export default function PrivacyPage() {
  return (
    <main className="map-area credits-area">
      <section className="credits-card legal-page">
        <h2>Privacy Policy</h2>
        <p className="legal-updated">Last updated: May 25, 2026</p>

        <h3>1. What We Collect</h3>
        <p>When you use Cloverfinder, we may collect:</p>
        <ul>
          <li>
            <strong>Account information:</strong> email address and username
            when you sign up
          </li>
          <li>
            <strong>Profile information:</strong> avatar image, if you choose to
            upload one
          </li>
          <li>
            <strong>Clover finds:</strong> photos you upload, titles,
            descriptions, and the location coordinates you provide for each find
          </li>
          <li>
            <strong>Interactions:</strong> likes, follows, and badge data tied
            to your account
          </li>
        </ul>

        <h3>2. How We Use Your Data</h3>
        <p>Your data is used to:</p>
        <ul>
          <li>Display your finds on the map and in the Clovermedia feed</li>
          <li>Show your profile information to other users when you post</li>
          <li>Operate the leaderboard, badges, and challenges features</li>
          <li>Verify clover photos using our image analysis system</li>
        </ul>
        <p>We do not use your data for advertising or sell it to third parties.</p>

        <h3>3. Data Storage</h3>
        <p>
          Your data is stored securely using{" "}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Supabase
          </a>
          , which provides authentication, database, and file storage services.
          Supabase stores data in compliance with their own{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          .
        </p>

        <h3>4. Location Data</h3>
        <p>
          When you post a clover find, you may provide location coordinates.
          This location is used to display your find on the public map. You
          control whether to share a location with each post. We do not track
          your real-time location.
        </p>

        <h3>5. Image Analysis</h3>
        <p>
          Photos you upload may be processed by our local image analysis model
          to verify that they contain clover. This analysis runs on our server
          and images are not sent to any external AI service.
        </p>

        <h3>6. Cookies &amp; Local Storage</h3>
        <p>
          The App uses browser cookies and local storage for authentication
          sessions. We do not use tracking cookies or analytics cookies.
        </p>

        <h3>7. Public Content</h3>
        <p>
          Content you post to Clovermedia (photos, titles, descriptions) is
          visible to all users of the App. Your username is displayed alongside
          your posts. You can choose not to share finds publicly.
        </p>

        <h3>8. Your Rights</h3>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Delete your account and associated data</li>
          <li>Update or correct your profile information</li>
          <li>Choose not to share location data or photos publicly</li>
        </ul>

        <h3>9. Children's Privacy</h3>
        <p>
          Cloverfinder is not directed at children under 13. We do not
          knowingly collect personal information from children under 13. If you
          believe a child under 13 has created an account, please contact us so
          we can remove it.
        </p>

        <h3>10. Changes</h3>
        <p>
          We may update this policy from time to time. We will note the date of
          the last update at the top of this page. Continued use of the App
          after changes constitutes acceptance.
        </p>

        <h3>11. Contact</h3>
        <p>
          For privacy-related questions or data requests, reach out through the
          App or contact us at the email listed on your profile settings.
        </p>

        <p style={{ marginTop: "2rem" }}>
          <Link href="/terms">Terms of Service</Link> ·{" "}
          <Link href="/credits">Credits</Link>
        </p>
      </section>
    </main>
  );
}
