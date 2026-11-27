import assert from "node:assert/strict";
import { test } from "node:test";

import { fullAddress, site } from "../src/config/site.ts";
import { baseUrl, documentFrom, loadPages, normalize } from "./helpers/qa.mjs";

test("every page has the shared footer and legal pages have the required links and contact copy", async () => {
  const pages = await loadPages();
  const missing = await fetch(new URL("/missing-footer-test", baseUrl));

  assert.equal(missing.status, 404);
  pages.push({ route: "404", document: documentFrom(await missing.text()) });

  for (const { route, document } of pages) {
    const footers = document.querySelectorAll("footer");
    assert.equal(footers.length, 1, route);

    const footer = footers[0];
    assert.equal(footer.querySelector(".footer-grid"), null, route);
    assert.equal(footer.querySelector("address"), null, route);
    assert.equal(
      normalize(footer.querySelector(".footer-copyright").textContent),
      `© ${new Date().getFullYear()} ${site.business.shortName} Legal Services`,
      route,
    );
    assert.deepEqual(
      [...footer.querySelectorAll(".footer-legal-links a")].map((link) =>
        link.getAttribute("href"),
      ),
      ["/#reviews", "/privacy-policy", "/disclaimer"],
      route,
    );
    const social = [...footer.querySelectorAll(".footer-social-links a")];
    assert.deepEqual(
      social.map((link) => [link.getAttribute("aria-label"), link.getAttribute("href")]),
      [
        ["Facebook", "https://www.facebook.com/"],
        ["Instagram", "https://www.instagram.com/"],
        ["LinkedIn", "https://www.linkedin.com/"],
      ],
      route,
    );
    for (const link of social) {
      assert.ok(link.querySelector("svg"), route);
      assert.equal(link.getAttribute("target"), "_blank", route);
      assert.match(link.getAttribute("rel"), /noopener/, route);
    }
    assert.equal(document.querySelector("main").nextElementSibling, footer, route);
  }

  const privacy = pages.find((page) => page.route === "/privacy-policy").document;
  assert.equal(
    privacy.querySelector('main a[href="/disclaimer"]').textContent,
    "Website Disclaimer",
  );
  assert.ok(
    normalize(privacy.querySelector("main").textContent).includes("See also: Website Disclaimer"),
  );

  const disclaimer = pages.find((page) => page.route === "/disclaimer").document;
  const contactHeadings = [...disclaimer.querySelectorAll("main h2")].filter((heading) =>
    /^Contact(?: the office)?$/.test(heading.textContent),
  );

  assert.equal(contactHeadings.length, 1);
  assert.equal(contactHeadings[0].textContent, "Contact the office");
  assert.ok(
    normalize(contactHeadings[0].nextElementSibling.textContent).startsWith(
      `${site.business.name}, ${fullAddress}`,
    ),
  );
});
