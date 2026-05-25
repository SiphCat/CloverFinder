import Link from "next/link";

export const metadata = { title: "Terms of Service — Cloverfinder" };

export default function TermsPage() {
  return (
    <main className="map-area credits-area">
      <section className="credits-card legal-page">
        <h2>Terms of Service</h2>
        <p className="legal-updated">Last updated: May 25, 2026</p>

        <h3>1. Acceptance</h3>
        <p>
          By accessing or using Cloverfinder ("the App"), you agree to these
          Terms of Service. If you do not agree, do not use the App.
        </p>

        <h3>2. Eligibility</h3>
        <p>
          You must be at least 13 years old to create an account or use the App.
          If you are under 18, you must have permission from a parent or
          guardian.
        </p>

        <h3>3. Accounts</h3>
        <p>
          You are responsible for keeping your login credentials secure. You are
          responsible for all activity that occurs under your account. You may
          delete your account at any time.
        </p>

        <h3>4. User Content</h3>
        <p>
          You retain ownership of any photos, text, or other content you upload
          ("User Content"). By posting User Content, you grant Cloverfinder a
          non-exclusive, royalty-free license to display, distribute, and store
          your content within the App for the purpose of operating the service.
        </p>
        <p>You agree not to upload content that:</p>
        <ul>
          <li>You do not have the right to share</li>
          <li>Is illegal, harmful, or violates another person's rights</li>
          <li>Contains malware or malicious code</li>
          <li>Is spam or misleading</li>
        </ul>
        <p>
          We reserve the right to remove any content that violates these terms.
        </p>

        <h3>5. Acceptable Use</h3>
        <p>You agree not to:</p>
        <ul>
          <li>Use the App for any illegal purpose</li>
          <li>Harass, bully, or impersonate other users</li>
          <li>
            Attempt to gain unauthorized access to other users' accounts or the
            App's systems
          </li>
          <li>Scrape, crawl, or collect data from the App without permission</li>
        </ul>

        <h3>6. Clover Verification</h3>
        <p>
          The App uses automated image analysis to help verify clover photos.
          This is provided as-is and may not always be accurate. Cloverfinder
          does not guarantee the accuracy of leaf counts or species
          identification.
        </p>

        <h3>7. Third-Party Services</h3>
        <p>
          The App uses third-party services including Supabase (authentication
          and storage), map tile providers (Esri, OpenStreetMap), and others
          listed on the{" "}
          <Link href="/credits">Credits page</Link>. Your use of these services
          is subject to their respective terms.
        </p>

        <h3>8. Disclaimer</h3>
        <p>
          The App is provided "as is" without warranties of any kind. We do not
          guarantee that the App will be available at all times or free of
          errors.
        </p>

        <h3>9. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, Cloverfinder shall not be
          liable for any indirect, incidental, or consequential damages arising
          from your use of the App.
        </p>

        <h3>10. Changes</h3>
        <p>
          We may update these terms at any time. Continued use of the App after
          changes constitutes acceptance of the new terms.
        </p>

        <h3>11. Contact</h3>
        <p>
          If you have questions about these terms, reach out through the App or
          contact us at the email listed on your profile settings.
        </p>

        <p style={{ marginTop: "2rem" }}>
          <Link href="/privacy">Privacy Policy</Link> ·{" "}
          <Link href="/credits">Credits</Link>
        </p>
      </section>
    </main>
  );
}
