import assert from "node:assert/strict";
import { test } from "node:test";
import puppeteer from "puppeteer-core";
import { startQaServer, stopQaServer } from "../scripts/qa-server.mjs";

test("form validates on blur, clears corrected errors and retains input on delivery failure", async () => {
  const server = await startQaServer("launch", 3104);
  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    let submissions = 0;

    page.on("request", async (request) => {
      if (request.url().endsWith("/api/contact") && request.method() === "POST") {
        submissions++;
        await new Promise((resolve) => setTimeout(resolve, 400));
        await request.respond({
          status: 502,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, message: "Fictional provider failure." }),
        });
      } else if (request.url().startsWith("http://127.0.0.1:3104")) {
        await request.continue();
      } else {
        await request.abort();
      }
    });

    await page.goto("http://127.0.0.1:3104/contact", { waitUntil: "networkidle0" });

    for (const [field, invalid, valid] of [
      ["name", "12345", "José O’Connor"],
      ["phone", "1234567", "416-555-0123"],
      ["email", "a..b@example.ca", "visitor+test@example.ca"],
    ]) {
      const selector = `#contact-${field}`;
      await page.click(selector);
      await page.type(selector, invalid);
      await page.keyboard.press("Tab");
      await page.waitForSelector(`${selector}-error`);
      assert.equal(await page.$eval(selector, (e) => e.getAttribute("aria-invalid")), "true");
      await page.$eval(selector, (element) => element.select());
      await page.keyboard.press("Backspace");
      await page.type(selector, valid);
      await page.waitForSelector(`${selector}-error`, { hidden: true });
    }

    assert.equal(submissions, 0);
    await page.click('button[type="submit"]');
    await page.waitForSelector("#contact-topic-error");
    await page.waitForSelector("#contact-consent-error");
    assert.equal(submissions, 0, "Invalid submission must stay in the browser");
    await page.select("#contact-topic", "other");
    await page.click("#contact-consent");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => document.querySelector('button[type="submit"]').disabled);
    await page.waitForFunction(() =>
      document.querySelector(".form-status")?.textContent.includes("Fictional provider failure."),
    );
    assert.equal(submissions, 1);
    assert.equal(await page.$eval("#contact-name", (e) => e.value), "José O’Connor");
    assert.equal(await page.$eval('button[type="submit"]', (e) => e.disabled), false);
    assert.equal(await page.$eval(".form-status", (e) => e === document.activeElement), true);
  } finally {
    if (browser) {
      await browser.close();
    }

    await stopQaServer(server);
  }
});
