import assert from "node:assert/strict";
import { test } from "node:test";
import { parseHTML } from "linkedom";
import { startQaServer, stopQaServer } from "../scripts/qa-server.mjs";
import { legacyRedirects } from "../src/lib/launch.ts";

const base = "http://127.0.0.1:3109";

test(
  "audited legacy URLs redirect permanently to real pages; privacy disclosures survive rendering",
  { timeout: 60000 },
  async () => {
    const server = await startQaServer("launch", 3109);

    try {
      for (const { source, destination } of legacyRedirects) {
        const response = await fetch(`${base}${source}?ref=audit`, { redirect: "manual" });
        assert.equal(response.status, 308, source);
        const target = new URL(response.headers.get("location"), base);
        assert.equal(target.pathname, destination);
        assert.equal(target.searchParams.get("ref"), "audit");
        assert.equal((await fetch(target)).status, 200, destination);
      }

      const response = await fetch(`${base}/privacy-policy`);
      assert.equal(response.status, 200);
      const { document } = parseHTML(await response.text());
      const article = document.querySelector("article");
      assert.ok(article);
      const text = article.textContent;
      assert.match(text, /Effective date: November 27, 2026/);
      assert.match(text, /Privacy inquiries are handled by Sharf Uddin Abead/);
      assert.ok(article.querySelector('a[href="mailto:info@abeadlegalservices.ca"]'));
      assert.ok(article.querySelector('a[href="tel:+14167223244"]'));

      assert.doesNotMatch(
        text,
        /Preview policy|final review pending|will be added before publication|\[CONFIRM/,
      );

      assert.match(text, /Netlify Blobs/);
      assert.match(text, /Resend/);
      assert.match(text, /Zoho Mail/);
      assert.match(text, /no automatic deletion period/);

      for (const destination of new Set(
        legacyRedirects
          .map((rule) => rule.destination)
          .concat([
            "/practice-areas/traffic-tickets-provincial-offences",
            "/practice-areas/accident-benefits-claims",
          ]),
      )) {
        const { document } = parseHTML(await (await fetch(`${base}${destination}`)).text());
        assert.doesNotMatch(
          document.querySelector("main").textContent,
          /lists [^.]*among (?:its practice areas|his credentials)/,
        );
      }
      const benefits = parseHTML(
        await (await fetch(`${base}/practice-areas/accident-benefits-claims`)).text(),
      ).document;

      assert.ok(
        benefits.querySelector(
          'a[href="https://www.fsrao.ca/consumers/auto-insurance/purchasing-your-policy/customize-your-liability-and-accident-benefits-coverage"]',
        ),
      );

      assert.match(
        benefits.querySelector("main").textContent,
        /medical, rehabilitation and attendant care benefits remain mandatory/,
      );

      const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();

      for (const { source } of legacyRedirects)
        assert.ok(!sitemap.includes(`${source}</loc>`), source);
    } finally {
      await stopQaServer(server);
    }
  },
);
