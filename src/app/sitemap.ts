import type { MetadataRoute } from "next";
import { pageDrafts } from "@/content";
import { getPublishedOrigin, isPublished } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublishedOrigin();

  if (!isPublished() || !origin) {
    return [];
  }

  return pageDrafts
    .filter((page) => page.metadata.productionIndexing === "index" && page.route !== "404")
    .map((page) => ({ url: `${origin}${page.route}` }));
}
