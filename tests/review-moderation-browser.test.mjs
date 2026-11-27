import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import puppeteer from "puppeteer-core";
import { startQaServer, stopQaServer } from "../scripts/qa-server.mjs";
import { localReviewStore } from "../src/lib/review-store.ts";
import { handleReview } from "../src/lib/review-server.ts";

test(
  "owner email link publishes and removes a stored review in the existing homepage without a build",
  { timeout: 120000 },
  async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "abead-review-browser-"));
    const origin = "http://127.0.0.1:3106";
    const moderation = { origin, secret: "fictional-local-browser-key-at-least-32-characters" };
    const store = localReviewStore(directory);
    const id = randomUUID();
    const config = { apiKey: "mock-only", to: "office@example.test", from: "site@example.test" };
    let privateUrl;
    let server;
    let browser;

    try {
      const submission = await handleReview(
        new Request(`${origin}/api/reviews`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            submissionId: id,
            displayName: "Fictional QA Reviewer",
            email: "private-qa@example.test",
            rating: "1",
            text: "Fictional browser test: publication without a site rebuild.",
            genuine: true,
            permissionToPublish: true,
          }),
        }),
        {
          store,
          moderation,
          config,
          limit: () => true,
          fetcher: async (_url, options) => {
            privateUrl = JSON.parse(String(options?.body)).text.match(
              /http:\/\/127\.0\.0\.1:3106\/api\/reviews\/moderate\?token=\S+/,
            )[0];
            return Response.json({ id: "mock-receipt" });
          },
        },
      );

      assert.equal(submission.status, 200);
      assert.ok(privateUrl);

      server = await startQaServer("launch", 3106, {
        REVIEWS_LOCAL_DIRECTORY: directory,
        REVIEWS_SITE_URL: origin,
        REVIEW_MODERATION_SECRET: moderation.secret,
      });

      browser = await puppeteer.launch({
        executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        headless: true,
      });

      const page = await browser.newPage();
      await page.setRequestInterception(true);

      page.on("request", (request) =>
        request.url().startsWith(origin) || request.url().startsWith("data:")
          ? request.continue()
          : request.abort(),
      );

      const homeBefore = await (await fetch(origin)).text();
      assert.doesNotMatch(homeBefore, /Fictional QA Reviewer|private-qa@example/);
      assert.equal((await store.get(id)).review.status, "pending");
      const results = [];
      await mkdir("artifacts/qa/review-moderation", { recursive: true });

      for (const width of [360, 390, 1440]) {
        await page.setViewport({
          width,
          height: 900,
          isMobile: width < 500,
          hasTouch: width < 500,
          deviceScaleFactor: 1,
        });

        await page.goto(privateUrl, { waitUntil: "networkidle0" });

        assert.equal(
          (await store.get(id)).review.status,
          "pending",
          "GET/scanner must not approve",
        );

        assert.equal(
          await page.$eval("h1", (element) => element.textContent),
          "Review this submission",
        );

        const dimensions = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          buttons: [...document.querySelectorAll("button")].map((button) => ({
            width: button.getBoundingClientRect().width,
            height: button.getBoundingClientRect().height,
          })),
        }));

        assert.equal(dimensions.width, width);
        assert.equal(dimensions.scrollWidth, width);
        assert.ok(dimensions.buttons.every((button) => button.width >= 44 && button.height >= 44));

        await page.screenshot({
          path: `artifacts/qa/review-moderation/owner-${width}.png`,
          fullPage: true,
        });

        results.push({ width, overflow: false, tapTargets: "pass", getIsReadOnly: true });
      }

      await page.setJavaScriptEnabled(false);

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click('button[value="publish"]'),
      ]);

      assert.equal(
        (await store.get(id)).review.status,
        "published",
        await page.$eval("main", (element) => element.innerText),
      );

      assert.match(await page.$eval(".status", (element) => element.textContent), /published/);
      const homepage = await fetch(origin, { cache: "no-store" });
      const html = await homepage.text();
      assert.match(html, /Fictional QA Reviewer/);
      assert.doesNotMatch(html, /private-qa@example|fictional-local-browser-key|token=|\"nonce\"/);
      await page.goto(`${origin}/#reviews`, { waitUntil: "networkidle0" });

      assert.equal(
        await page.$eval(".review-card figcaption", (element) =>
          element.textContent.includes("Fictional QA Reviewer"),
        ),
        true,
      );

      await page.screenshot({
        path: "artifacts/qa/review-moderation/published-home.png",
        fullPage: false,
      });

      await page.goto(privateUrl, { waitUntil: "networkidle0" });

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click('button[value="unpublish"]'),
      ]);

      assert.equal((await store.get(id)).review.status, "unpublished");

      assert.doesNotMatch(
        await (await fetch(origin, { cache: "no-store" })).text(),
        /Fictional QA Reviewer/,
      );

      await stopQaServer(server);

      server = await startQaServer("launch", 3106, {
        REVIEWS_LOCAL_DIRECTORY: directory,
        REVIEWS_SITE_URL: origin,
        REVIEW_MODERATION_SECRET: moderation.secret,
      });

      assert.doesNotMatch(await (await fetch(origin)).text(), /Fictional QA Reviewer/);
      await page.goto(privateUrl, { waitUntil: "networkidle0" });
      assert.match(await page.$eval(".status", (element) => element.textContent), /unpublished/);

      await writeFile(
        "artifacts/qa/review-moderation/results.json",
        JSON.stringify(
          {
            testedAt: new Date().toISOString(),
            results,
            realEmailSent: false,
            noJavaScript: "pass",
            publication: "pass",
            unpublication: "pass",
            restartPersistence: "pass",
            productionNetlifyCredentials: "not tested locally",
          },
          null,
          2,
        ) + "\n",
      );
    } finally {
      await browser?.close();

      if (server) {
        await stopQaServer(server);
      }

      await rm(directory, { recursive: true, force: true });
    }
  },
);
