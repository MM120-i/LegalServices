import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { baseUrl, launchMode, loadPages } from "./helpers/qa.mjs";

test("external link reachability is recorded separately from blocked automated requests", async () => {
  const pages = await loadPages();

  const urls = new Set(
    pages.flatMap(({ document }) =>
      [...document.querySelectorAll('a[href^="https:"]')].map((link) => link.getAttribute("href")),
    ),
  );

  const results = await Promise.all(
    [...urls].map(async (url) => {
      const parsed = new URL(url);
      assert.equal(parsed.protocol, "https:");

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
        await response.body?.cancel();

        const status = response.ok
          ? "passed"
          : [401, 403, 429].includes(response.status)
            ? "blocked by service"
            : [404, 410].includes(response.status)
              ? "failed"
              : "not verified";
        return { url, status, httpStatus: response.status };
      } catch (error) {
        return { url, status: "not verified", reason: error.name };
      }
    }),
  );

  await mkdir("artifacts/qa", { recursive: true });

  await writeFile(
    `artifacts/qa/external-links-${launchMode ? "launch" : "preview"}.json`,
    JSON.stringify({ baseUrl, results }, null, 2) + "\n",
  );

  assert.ok(
    !results.some((result) => result.status === "failed"),
    "An external service returned 404/410; inspect the saved report.",
  );

  console.log(JSON.stringify(results));
});
