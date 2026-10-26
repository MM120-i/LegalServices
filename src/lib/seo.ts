import type { Metadata } from "next";
import { site, fullAddress } from "@/config/site";
import { getPageDraft, resolveCopy } from "@/content";
import type { ContentRoute, DraftFaq, PageDraft } from "@/content/types";

/** A missing production domain must never become a made-up canonical URL. */
export function getPublishedOrigin(): string | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL;

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    if (
      !url.hostname.includes(".") ||
      /(^|\.)(localhost|example\.(com|org|net)|invalid)$/.test(url.hostname) ||
      /^\d+(\.\d+){3}$/.test(url.hostname)
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function isPublished(): boolean {
  return process.env.SITE_PUBLISHED === "true" && getPublishedOrigin() !== null;
}

export function getPageMetadata(route: ContentRoute): Metadata {
  const page = getPageDraft(route);

  if (!page) {
    return { title: "Page not found", robots: { index: false, follow: false } };
  }

  const title = resolveCopy(page.metadata.title);
  const description = resolveCopy(page.metadata.description);
  const origin = getPublishedOrigin();
  const index = isPublished() && page.metadata.productionIndexing === "index";
  const url = origin && route !== "404" ? `${origin}${route}` : undefined;

  return {
    title,
    description,
    robots: { index, follow: index },
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: site.business.name,
      locale: "en_CA",
      ...(url ? { url } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function getLegalServiceSchema() {
  const origin = getPublishedOrigin();

  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    ...(origin ? { "@id": `${origin}/#practice`, url: origin } : {}),
    name: site.business.name,
    telephone: site.phones.primary.display,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.province,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    founder: { "@type": "Person", name: site.business.principal, jobTitle: "Licensed Paralegal" },
    areaServed: { "@type": "City", name: "Scarborough, Toronto" },
    description: `Paralegal practice at ${fullAddress}.`,
  };
}

/** Call with the same sanitized FAQ answers rendered on the page. */
export function getFaqSchema(faqs: DraftFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function getBreadcrumbSchema(page: PageDraft) {
  const origin = getPublishedOrigin();

  if (!origin) {
    return null;
  }

  const items = [{ name: "Home", item: `${origin}/` }];

  if (page.route.startsWith("/practice-areas/"))
    items.push({ name: "Practice areas", item: `${origin}/practice-areas` });

  items.push({ name: resolveCopy(page.h1), item: `${origin}${page.route}` });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...item,
    })),
  };
}
