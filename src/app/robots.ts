import type { MetadataRoute } from "next";
import { getPublishedOrigin, isPublished } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const origin = getPublishedOrigin();

  return {
    rules: isPublished()
      ? { userAgent: "*", allow: "/", disallow: ["/api/", "/thank-you"] }
      : { userAgent: "*", disallow: "/" },
    ...(isPublished() && origin ? { sitemap: `${origin}/sitemap.xml`, host: origin } : {}),
  };
}
