import assert from "node:assert/strict";
import { test } from "node:test";

import { fullAddress, site } from "../src/config/site.ts";
import { baseUrl, loadPages, normalize, visibleText } from "./helpers/qa.mjs";

test("all page links, anchors, telephone numbers, and directions use valid targets", async () => {
  const pages = await loadPages();
  const byRoute = new Map(pages.map((page) => [page.route, page.document]));
  const phones = Object.values(site.phones);
  const phoneHrefs = new Set(phones.map((phone) => phone.href));
  const external = new Set();

  for (const { route, document } of pages) {
    const text = visibleText(document);

    assert.equal(
      document.getElementById("main-content")?.getAttribute("tabindex"),
      "-1",
      `${route}: skip target must accept focus`,
    );

    for (const brand of document.querySelectorAll("a.brand")) {
      const letters = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

      assert.ok(
        letters(brand.getAttribute("aria-label") ?? brand.textContent ?? "").includes(
          letters(brand.textContent ?? ""),
        ),
        `${route}: brand name must include its visible text`,
      );
    }

    for (const phone of phones) {
      assert.ok(text.includes(phone.display), `${route} must show ${phone.display}`);
    }

    assert.doesNotMatch(text, /Accedent|info@xyz\.ca|www\.xyz\.ca/i, route);

    for (const link of document.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href");
      const label = normalize(link.textContent ?? "");

      assert.ok(href?.trim(), `${route}: empty link`);
      assert.ok(label || link.getAttribute("aria-label"), `${route}: unnamed link ${href}`);

      if (href.startsWith("tel:")) {
        assert.ok(phoneHrefs.has(href), `${route}: unexpected telephone ${href}`);
        const digits = label.replace(/\D/g, "");

        if (digits) {
          assert.equal(digits, href.replace(/\D/g, "").slice(1), `${route}: label/href mismatch`);
        }

        continue;
      }

      if (href.startsWith("mailto:")) {
        assert.ok(site.email, `${route}: no real email is configured`);
        assert.equal(decodeURIComponent(href.slice(7).split("?")[0]), site.email);
        continue;
      }

      const url = new URL(href, new URL(route, baseUrl));

      if (url.origin === new URL(baseUrl).origin) {
        const destination = byRoute.get(url.pathname);
        assert.ok(destination, `${route}: unknown internal link ${href}`);

        if (url.hash) {
          assert.ok(
            destination.getElementById(decodeURIComponent(url.hash.slice(1))),
            `${route}: missing anchor ${href}`,
          );
        }
      } else {
        assert.equal(url.protocol, "https:", `${route}: unsupported external URL ${href}`);
        external.add(url.href);

        if (url.pathname === "/maps/dir/") {
          assert.equal(url.searchParams.get("api"), "1");
          assert.equal(url.searchParams.get("destination"), fullAddress);
        }
      }
    }
  }

  const about = byRoute.get("/about");

  for (const credential of site.business.credentials) {
    assert.ok(
      [...about.querySelectorAll(".credential-list li")].some(
        (item) => normalize(item.textContent) === credential,
      ),
      `Credential must be verbatim: ${credential}`,
    );
  }

  const missing = await fetch(new URL("/qa-page-that-does-not-exist", baseUrl));
  assert.equal(missing.status, 404);

  console.log(
    `${pages.length} pages checked; ${external.size} unique external links; real mailto verification ${site.email ? "included" : "pending client email"}.`,
  );
});
