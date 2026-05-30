import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/siteUrl";

/** Public routes to index. Auth-only and dev pages are omitted. */
const PUBLIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/map", changeFrequency: "daily", priority: 0.9 },
  { path: "/clovermedia", changeFrequency: "hourly", priority: 0.9 },
  { path: "/leaderboard", changeFrequency: "daily", priority: 0.8 },
  { path: "/challenges", changeFrequency: "weekly", priority: 0.7 },
  { path: "/auth/sign-up", changeFrequency: "monthly", priority: 0.6 },
  { path: "/auth/log-in", changeFrequency: "monthly", priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/credits", changeFrequency: "yearly", priority: 0.3 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteBaseUrl();
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority
  }));
}
