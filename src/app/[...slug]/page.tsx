import { notFound } from "next/navigation";
import { pageDrafts, getPageDraft } from "@/content";
import type { ContentRoute } from "@/content/types";
import { ContentPage } from "@/components/content-page";
import { getPublicPageContent } from "@/lib/public-content";
import { JsonLd } from "@/components/json-ld";

import {
  getPageMetadata,
  getBreadcrumbSchema,
  getFaqSchema,
  getLegalServiceSchema,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return pageDrafts
    .filter((page) => page.route.startsWith("/") && page.route !== "/")
    .map((page) => ({ slug: page.route.slice(1).split("/") }));
}

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return getPageMetadata(`/${slug.join("/")}` as ContentRoute);
}

export default async function InteriorPage({ params }: Props) {
  const { slug } = await params;
  const page = getPageDraft(`/${slug.join("/")}` as ContentRoute);

  if (!page) {
    notFound();
  }

  const content = getPublicPageContent(page);

  return (
    <>
      <ContentPage page={page} />
      <JsonLd data={getLegalServiceSchema()} />
      <JsonLd data={getBreadcrumbSchema(page)} />
      {content.faqs.length > 0 ? <JsonLd data={getFaqSchema(content.faqs)} /> : null}
    </>
  );
}
