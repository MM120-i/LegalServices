import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

test("built pages have valid metadata, structured data, and preview content", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const build = resolve(root, ".next/server/app");
  const csv = readFileSync(resolve(root, "content/phase-1/06-metadata.csv"), "utf8");

  // Route fields contain no commas or quotes; copy fields later in each CSV row may.
  const routes = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.slice(0, line.indexOf(",")));
  assert.equal(routes.length, 16, "Expected the 16 catalog routes, including the custom 404");
  assert.equal(
    routes.filter((route) => route.startsWith("/practice-areas/")).length,
    6,
    "Expected six practice-area pages",
  );

  assert.ok(routes.includes("/notary-public"), "Missing notary page in content catalog");

  function decode(text) {
    return text
      .replace(/&#(x[0-9a-f]+|\d+);/gi, (_match, value) =>
        String.fromCodePoint(
          value[0].toLowerCase() === "x" ? parseInt(value.slice(1), 16) : Number(value),
        ),
      )
      .replace(
        /&(?:amp|quot|apos|lt|gt|nbsp);/g,
        (entity) =>
          ({ "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " })[
            entity
          ],
      );
  }

  function attributes(tag) {
    return Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
        match[1].toLowerCase(),
        decode(match[2] ?? match[3]),
      ]),
    );
  }

  function withoutInertContent(html) {
    return html
      .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ");
  }

  function visibleText(html) {
    return decode(withoutInertContent(html).replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
  }

  function rejectReviewSchema(value, route) {
    if (!value || typeof value !== "object") {
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      assert.ok(
        !/^(?:aggregateRating|review|reviews)$/i.test(key),
        `Unexpected rating/review markup in ${route}`,
      );

      if (key === "@type") {
        const types = Array.isArray(child) ? child : [child];

        assert.ok(
          !types.some((type) => /^(?:Review|AggregateRating)$/i.test(String(type))),
          `Unexpected rating/review schema type in ${route}`,
        );
      }

      rejectReviewSchema(child, route);
    }
  }

  const titles = new Set();
  const descriptions = new Set();
  let schemaCount = 0;

  for (const route of routes) {
    const filename =
      route === "/" ? "index.html" : route === "404" ? "_not-found.html" : `${route.slice(1)}.html`;

    const path = resolve(build, filename);
    assert.ok(existsSync(path), `Built page missing: ${route}. Run npm run build first.`);
    const html = readFileSync(path, "utf8");
    const rendered = withoutInertContent(html);

    assert.equal(
      [...rendered.matchAll(/<h1\b[^>]*>/gi)].length,
      1,
      `Expected exactly one H1 on ${route}`,
    );

    const titleMatches = [...rendered.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    assert.equal(titleMatches.length, 1, `Expected exactly one title on ${route}`);
    const title = decode(titleMatches[0][1]);
    assert.ok(title.trim(), `Empty title on ${route}`);
    assert.ok(!titles.has(title), `Duplicate title on ${route}: ${title}`);
    titles.add(title);

    const metadata = [...rendered.matchAll(/<meta\b[^>]*>/gi)].map((match) => attributes(match[0]));
    const descriptionTags = metadata.filter((item) => item.name?.toLowerCase() === "description");
    assert.equal(descriptionTags.length, 1, `Expected exactly one meta description on ${route}`);
    const description = descriptionTags[0].content;

    assert.ok(description?.trim(), `Missing meta description on ${route}`);
    assert.ok(!descriptions.has(description), `Duplicate meta description on ${route}`);
    descriptions.add(description);

    const robots = metadata.filter((item) => item.name?.toLowerCase() === "robots");
    assert.ok(robots.length > 0, `No preview robots directive on ${route}`);

    assert.ok(
      robots.every((item) => /\bnoindex\b/i.test(item.content ?? "")),
      `Preview page is indexable: ${route}`,
    );

    const body = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html;
    const text = visibleText(body);

    assert.doesNotMatch(
      text,
      /\[(?:CONFIRM|PLACEHOLDER):|Editorial (?:note|status):|Research:|08-sources\.md|src\/content\/|content\/phase-1\//i,
      `Internal draft instruction leaked on ${route}`,
    );

    assert.doesNotMatch(text, /\{\{[^{}]+\}\}/, `Unresolved content token on ${route}`);

    for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (attributes(script[1]).type !== "application/ld+json") {
        continue;
      }

      let data;

      try {
        data = JSON.parse(script[2]);
      } catch (error) {
        throw new Error(`Invalid JSON-LD on ${route}: ${error.message}`);
      }

      assert.ok(data && typeof data === "object", `Empty JSON-LD on ${route}`);
      rejectReviewSchema(data, route);
      schemaCount++;
    }

    if (route === "/")
      assert.equal(
        (text.match(/SAMPLE — NOT A REAL CLIENT REVIEW/g) ?? []).length,
        3,
        "Every sample review on Home needs its visible fictional label",
      );
  }

  console.log(
    `Built-page checks passed: ${routes.length} routes, unique metadata, one H1 each, ${schemaCount} valid JSON-LD blocks, no editorial leaks, preview noindex, and three labelled sample reviews.`,
  );
});
