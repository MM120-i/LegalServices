import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { startQaServer, stopQaServer } from "../scripts/qa-server.mjs";
import { reviewReceivedMessage } from "../src/lib/reviews.ts";

test(
  "on-site reviews work on mobile and desktop with consent, keyboard controls and retained errors",
  { timeout: 120000 },
  async () => {
    const server = await startQaServer("launch", 3105);
    let browser;

    try {
      browser = await puppeteer.launch({
        executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        headless: true,
      });

      const page = await browser.newPage();
      await page.setCacheEnabled(false);
      await page.setRequestInterception(true);
      let mode = "failure";
      const submissions = [];

      page.on("request", async (request) => {
        if (request.url().endsWith("/api/reviews") && request.method() === "POST") {
          submissions.push(request.postData());
          const status = mode === "success" ? 200 : 502;
          await new Promise((resolve) => setTimeout(resolve, 700));

          await request.respond({
            status,
            contentType: "application/json",
            body: JSON.stringify({
              ok: status === 200,
              message:
                status === 200 ? reviewReceivedMessage : "Fictional review delivery failure.",
            }),
          });
        } else if (request.url().startsWith("http://127.0.0.1:3105")) {
          await request.continue();
        } else {
          await request.abort();
        }
      });

      await mkdir("artifacts/qa/reviews", { recursive: true });
      const evidence = [];
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

      const missing = await page.goto("http://127.0.0.1:3105/missing-review-page", {
        waitUntil: "networkidle2",
      });

      assert.equal(missing.status(), 404);
      await page.waitForSelector('footer a[href="/#reviews"]');

      for (const width of [360, 390, 768, 1440, 2560]) {
        await page.emulate({
          viewport: {
            width,
            height: 1000,
            deviceScaleFactor: 1,
            isMobile: width < 768,
            hasTouch: width < 768,
          },
          userAgent:
            width < 768
              ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
              : "Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36",
        });

        await page.goto("http://127.0.0.1:3105/", { waitUntil: "networkidle2" });
        assert.equal(
          await page.$eval("#write-review", (e) => e.open),
          false,
          "Form collapsed by default",
        );

        assert.doesNotMatch(
          await page.$eval("#reviews", (e) => e.innerText),
          /Sample reviewer|Illustrative reviews|SAMPLE —/i,
        );

        assert.equal(
          await page.$("#reviews .review-card"),
          null,
          "Empty catalog must not invent reviews",
        );

        assert.equal(
          await page.$eval('footer a[href="/#reviews"]', (e) => e.textContent),
          "Leave a review",
        );
        await page.$eval("#write-review summary", (e) => e.focus());
        await page.keyboard.press("Enter");
        assert.equal(await page.$eval("#write-review", (e) => e.open), true);
        await page.keyboard.press("Space");
        assert.equal(await page.$eval("#write-review", (e) => e.open), false);
        await page.keyboard.press("Space");
        assert.equal(await page.$eval("#write-review", (e) => e.open), true);
        assert.equal(await page.$eval("#review-permission", (e) => e.checked), false);
        assert.equal(
          await page.$eval('input[name="rating"]:checked', (e) => e.value).catch(() => null),
          null,
        );

        const metrics = await page.evaluate(() => {
          const elements = [
            ...document.querySelectorAll(
              '#reviews input:not([name="website"]), #reviews textarea, #reviews button, #reviews summary, #reviews a',
            ),
          ].filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width && r.height;
          });

          const small = elements
            .filter((e) => {
              const r = (
                e.matches('input[type="radio"],input[type="checkbox"]') ? e.labels[0] : e
              ).getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            })
            .map((e) => e.id || e.textContent);
          return { inner: innerWidth, scroll: document.documentElement.scrollWidth, small };
        });

        assert.equal(metrics.inner, width);
        assert.equal(metrics.scroll, width, "No sideways document overflow with the form open");
        assert.deepEqual(metrics.small, [], "Review touch targets must be at least 44px");
        await page.$eval("#reviews", (e) =>
          e.scrollIntoView({ block: "start", behavior: "instant" }),
        );
        await new Promise((resolve) => setTimeout(resolve, 200));
        await page.screenshot({
          path: `artifacts/qa/reviews/reviews-${width}.png`,
          captureBeyondViewport: false,
        });
        evidence.push({
          width,
          ...metrics,
          disclosure: "keyboard passed",
          permissionDefault: false,
        });
      }

      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await page.goto("http://127.0.0.1:3105/#reviews", { waitUntil: "networkidle2" });
      await page.click("#write-review summary");
      await page.click('#reviews button[type="submit"]');
      await page.waitForSelector("#review-displayName-error");
      await page.waitForSelector("#review-rating-error");
      await page.waitForSelector("#review-genuine-error");
      assert.equal(submissions.length, 0, "Invalid fields must not send a request");
      await page.type("#review-displayName", "Sam R.");
      await page.type("#review-email", "reviewer@example.test");
      await page.type("#review-text", "A fictional experience for browser checks only.");
      await page.click('input[name="rating"][value="1"]');
      await page.keyboard.press("ArrowRight");
      assert.equal(await page.$eval('input[name="rating"]:checked', (e) => e.value), "2");
      await page.click("#review-genuine");
      await page.click('#reviews button[type="submit"]');
      await page.waitForFunction(() =>
        document.querySelector('#reviews button[type="submit"]').matches(":disabled"),
      );
      await page.waitForFunction(() =>
        document
          .querySelector("#reviews .form-status")
          ?.textContent.includes("Fictional review delivery failure."),
      );
      assert.equal(
        await page.$eval("#review-text", (e) => e.value),
        "A fictional experience for browser checks only.",
      );
      assert.equal(
        await page.$eval("#reviews .form-status", (e) => e === document.activeElement),
        true,
      );
      assert.equal(await page.$eval("#review-permission", (e) => e.checked), false);
      mode = "success";
      await page.click('#reviews button[type="submit"]');
      await page.waitForSelector("#reviews .review-success");
      assert.match(
        await page.$eval("#reviews .review-success", (e) => e.textContent),
        /It has not been published/,
      );
      assert.match(
        await page.$eval("#reviews .review-success", (e) => e.textContent),
        /remain private feedback/,
      );
      assert.equal(await page.$("#reviews .review-card"), null);
      assert.equal(submissions.length, 2);
      const id = (text) => /name="submissionId"\r?\n\r?\n([^\r\n]+)/.exec(text)?.[1];
      assert.ok(id(submissions[0]));
      assert.equal(
        id(submissions[0]),
        id(submissions[1]),
        "Failure retry must retain its idempotency key",
      );

      await writeFile(
        "artifacts/qa/reviews/results.json",
        JSON.stringify(
          {
            viewports: evidence,
            invalidBlocked: true,
            nativeRatingKeyboard: true,
            retainedInput: true,
            retryIdempotency: true,
            successNotPublished: true,
            delivery: "mocked only",
          },
          null,
          2,
        ),
      );
    } finally {
      if (browser) {
        await browser.close();
      }

      await stopQaServer(server);
    }
  },
);
