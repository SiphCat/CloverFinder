import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/protected/", "/dev", "/api/"]
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
