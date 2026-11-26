import type { MetadataRoute } from "next";
import { getPublishedOrigin } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const origin = getPublishedOrigin() ?? "https://abeadlegalservices.ca";

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${origin}/sitemap.xml`,
  };
}
