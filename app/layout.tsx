import "./globals.css";
import type { Metadata } from "next";
import { BundlePrefetch } from "@/app/components/BundlePrefetch";
import { ProfilePreferencesSync } from "@/app/components/ProfilePreferencesSync";
import { SupabaseSetupBanner } from "@/app/components/SupabaseSetupBanner";

export const metadata: Metadata = {
  title: "CloverFinder",
  description: "Find clovers on the map — secure sign in with Supabase",
  icons: {
    icon: "/cloverfinder-logo.png",
    apple: "/cloverfinder-logo.png"
  }
};

const themeBootScript = `
(function () {
  try {
    var raw = localStorage.getItem("cloverfinder:profilePrefs:v1");
    if (!raw) return;
    var p = JSON.parse(raw);
    var s = p && p.colorScheme;
    var dark =
      s === "dark" ||
      (s === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-color-scheme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://a.tile.openstreetmap.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://b.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://unpkg.com" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <BundlePrefetch />
        <ProfilePreferencesSync />
        <SupabaseSetupBanner />
        {children}
      </body>
    </html>
  );
}
