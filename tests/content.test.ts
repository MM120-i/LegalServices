import assert from "node:assert/strict";
import { test } from "node:test";
import { pageDrafts, sharedCopyDraft, getPageDraft, resolveCopy } from "../src/content/index.ts";
import { site } from "../src/config/site.ts";

test("content drafts have valid routes, metadata, links, FAQs, and preview labels", () => {
  const routes = new Set<string>(pageDrafts.map((page) => page.route));

  assert.equal(pageDrafts.length, 16, "All planned pages and the 404 need copy");
  assert.equal(routes.size, pageDrafts.length, "Duplicate content routes");

  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const page of pageDrafts) {
    assert.equal(page.status, "draft");
    assert.ok(page.h1.trim(), `Missing H1 for ${page.route}`);
    assert.ok(page.sections.length, `Empty page: ${page.route}`);
    const title = resolveCopy(page.metadata.title);
    const description = resolveCopy(page.metadata.description);
    assert.ok(title.length <= 60, `Title too long: ${page.route}`);
    assert.ok(description.length <= 155, `Description too long: ${page.route}`);
    assert.ok(!titles.has(title), `Duplicate title: ${page.route}`);

    assert.ok(!descriptions.has(description), `Duplicate description: ${page.route}`);

    titles.add(title);
    descriptions.add(description);

    // Resolve every string to catch unknown business-data tokens, including those in notes.
    resolveCopy(JSON.stringify(page));

    for (const section of page.sections) {
      for (const block of section.blocks) {
        for (const match of block.markdown.matchAll(/`(\/[^`\s]*)`/g)) {
          assert.ok(routes.has(match[1]), `Unknown internal route ${match[1]} in ${page.route}`);
        }
      }
    }

    for (const faq of page.faqs) {
      assert.ok(faq.answer.trim(), `Empty FAQ on ${page.route}`);
      assert.ok(
        page.sections.some((section) => section.heading === faq.question),
        "FAQ must come from visible content",
      );
    }
  }

  resolveCopy(JSON.stringify(sharedCopyDraft));

  assert.equal(getPageDraft("/thank-you")?.metadata.productionIndexing, "noindex");
  assert.equal(getPageDraft("404")?.metadata.productionIndexing, "noindex");
  assert.equal(getPageDraft("/missing"), undefined);
  assert.throws(() => resolveCopy("{{unknown.token}}"), /Unknown content token/);
  assert.equal(resolveCopy("{{business.name}}"), site.business.name);
  assert.equal(site.email, "info@abeadlegalservices.ca", "Use the email printed on the client’s card");
  assert.equal(site.domain, null, "Do not invent a production domain");
  assert.equal(site.consultationModel, null, "Consultation terms are not confirmed");

  assert.ok(
    !pageDrafts
      .flatMap((page) =>
        page.sections.flatMap((section) =>
          section.blocks
            .filter((block) => block.kind !== "editorial")
            .map((block) => block.markdown),
        ),
      )
      .join("\n")
      .includes("info@xyz.ca"),
    "Placeholder mailbox must stay out of visitor copy",
  );

  const home = getPageDraft("/");

  assert.ok(home);
  assert.equal(home.faqs.length, 6);

  const reviews = home.sections.find((section) => section.heading.startsWith("Reviews"));

  assert.ok(reviews);
  const reviewCopy = reviews.blocks.map((block) => block.markdown).join("\n");

  assert.equal(
    (reviewCopy.match(/SAMPLE — NOT A REAL CLIENT REVIEW/g) ?? []).length,
    3,
    "Keep every dummy review visibly labelled",
  );

  for (const page of pageDrafts.filter(
    (page) => page.route.startsWith("/practice-areas/") || page.route === "/notary-public",
  )) {
    assert.ok(page.faqs.length >= 3, `Missing service FAQs: ${page.route}`);
    assert.ok(
      page.sections.some((section) => section.blocks.some((block) => block.kind === "editorial")),
      `Keep review notes for ${page.route}`,
    );
  }

  console.log(
    `Content checks passed: ${routes.size} routes, ${pageDrafts.reduce((count, page) => count + page.faqs.length, 0)} FAQs, unique metadata, valid links and tokens, labelled samples.`,
  );
});
