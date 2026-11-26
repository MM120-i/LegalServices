import type { MetadataRoute } from "next";
import { pageDrafts } from "@/content";
import { getPublishedOrigin, isPublished } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublishedOrigin();

  if (!isPublished() || !origin) {
    return [];
  }

  // Use the same catalog as generateStaticParams so only real pages are emitted.
  return pageDrafts
    .filter((page) => page.route.startsWith("/") && page.metadata.productionIndexing === "index")
    .map((page) => ({ url: `${origin}${page.route}` }));
}
