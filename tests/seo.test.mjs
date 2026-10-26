import assert from "node:assert/strict";
import { test } from "node:test";

import { site } from "../src/config/site.ts";
import { baseUrl, launchMode, launchOrigin, loadPages, normalize } from "./helpers/qa.mjs";

function assertNoRatings(value) {
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    assert.ok(
      !/^(aggregateRating|reviews?)$/i.test(key),
      "Sample reviews must not become rating markup",
    );
    assertNoRatings(child);
  }
}

test("SEO directives, sitemap, structured data, and displayed FAQs agree", async () => {
  const pages = await loadPages();

  for (const { route, document } of pages) {
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "";
    const shouldIndex = launchMode && route !== "/thank-you";

    assert.match(robots, shouldIndex ? /\bindex\b/ : /\bnoindex\b/, route);

    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
    if (launchMode) {
      assert.equal(new URL(canonical).href, new URL(route, launchOrigin).href, route);
    } else {
      assert.equal(canonical, undefined, route);
    }

    const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (script) => JSON.parse(script.textContent),
    );

    const business = schemas.find((schema) => schema["@type"] === "LegalService");

    assert.ok(business, `${route}: missing business schema`);
    assert.equal(business.name, site.business.name);
    assert.equal(business.telephone, site.phones.primary.display);
    assert.equal(business.address.streetAddress, site.address.street);
    assert.equal(business.address.postalCode, site.address.postalCode);
    assert.equal(business.founder.name, site.business.principal);
    schemas.forEach(assertNoRatings);

    const faqSchema = schemas.find((schema) => schema["@type"] === "FAQPage");
    const displayedFaqs = [...document.querySelectorAll(".faq-item")];

    assert.equal(faqSchema?.mainEntity.length ?? 0, displayedFaqs.length, `${route}: FAQ count`);

    displayedFaqs.forEach((item, index) => {
      const summary = item.querySelector("summary")?.cloneNode(true);
      summary.querySelectorAll('[aria-hidden="true"]').forEach((element) => element.remove());
      const answer = item.querySelector(".faq-answer, .prose");
      const entity = faqSchema.mainEntity[index];

      assert.equal(
        normalize(entity.name),
        normalize(summary.textContent),
        `${route}: FAQ question`,
      );
      assert.equal(
        normalize(entity.acceptedAnswer.text),
        normalize(answer.textContent),
        `${route}: FAQ answer`,
      );
    });

    const breadcrumb = schemas.find((schema) => schema["@type"] === "BreadcrumbList");

    if (launchMode && route !== "/") {
      assert.ok(breadcrumb, `${route}: missing breadcrumb`);
      assert.deepEqual(
        breadcrumb.itemListElement.map((item) => item.position),
        breadcrumb.itemListElement.map((_, index) => index + 1),
      );

      assert.equal(breadcrumb.itemListElement.at(-1).item, `${launchOrigin}${route}`);
    }
  }

  const robots = await (await fetch(new URL("/robots.txt", baseUrl))).text();
  const sitemap = await (await fetch(new URL("/sitemap.xml", baseUrl))).text();

  if (launchMode) {
    assert.match(robots, /Allow: \//);
    assert.ok(robots.includes(`Sitemap: ${launchOrigin}/sitemap.xml`));
    assert.ok(!sitemap.includes("/thank-you"));

    for (const { route } of pages.filter((page) => page.route !== "/thank-you"))
      assert.ok(sitemap.includes(`<loc>${launchOrigin}${route}</loc>`));
  } else {
    assert.match(robots, /Disallow: \/\s*$/);
    assert.ok(!sitemap.includes("<loc>"));
  }
});
