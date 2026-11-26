import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { startQaServer, stopQaServer } from "../scripts/qa-server.mjs";
import { pageDrafts } from "../src/content/generated.ts";

test(
  "all routes have mobile metadata, touch targets and usable navigation",
  { timeout: 180000 },
  async () => {
    const server = await startQaServer("launch", 3101);
    const browser = await puppeteer.launch({
      executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      headless: true,
    });
    const routes = pageDrafts.map((page) =>
      page.route === "404" ? "/missing-audit-page" : page.route,
    );
    const results = [];
    try {
      const page = await browser.newPage();
      await page.setCacheEnabled(false);
      await page.setRequestInterception(true);
      page.on("request", (r) =>
        r.url().startsWith("http://127.0.0.1") ? r.continue() : r.abort(),
      );
      for (const width of [360, 390]) {
        await page.emulate({
          viewport: { width, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
        });
        for (const route of routes) {
          const response = await page.goto("http://127.0.0.1:3101" + route, {
            waitUntil: "networkidle0",
          });
          const result = await page.evaluate(() => {
            const visible = (e) => {
              const r = e.getBoundingClientRect(),
                s = getComputedStyle(e);
              return (
                r.width > 0 &&
                r.height > 0 &&
                s.visibility !== "hidden" &&
                s.display !== "none" &&
                !e.closest("[hidden]")
              );
            };
            const small = [
              ...document.querySelectorAll(
                "a,button,input:not([type=hidden]),select,textarea,summary",
              ),
            ]
              .filter(visible)
              .map((e) => {
                const r = (
                  e.matches("input[type=checkbox]") && e.labels?.length ? e.labels[0] : e
                ).getBoundingClientRect();
                return {
                  text: (e.textContent || e.getAttribute("aria-label") || e.tagName)
                    .trim()
                    .slice(0, 70),
                  tag: e.tagName,
                  cls: e.className,
                  w: Math.round(r.width),
                  h: Math.round(r.height),
                };
              })
              .filter((r) => r.w < 44 || r.h < 44);
            const over = [...document.querySelectorAll("body *")]
              .filter(visible)
              .filter((e) => {
                const r = e.getBoundingClientRect();
                return r.right > innerWidth + 1 || r.left < -1;
              })
              .slice(0, 8)
              .map((e) => ({
                tag: e.tagName,
                cls: e.className,
                width: Math.round(e.getBoundingClientRect().width),
              }));
            return {
              title: document.title,
              description: document.querySelector("meta[name=description]")?.content,
              overflow: document.documentElement.scrollWidth > innerWidth,
              small,
              over,
              touch: navigator.maxTouchPoints,
              viewportWidth: innerWidth,
            };
          });
          assert.equal(result.overflow, false, `${width} ${route}: horizontal overflow`);
          assert.deepEqual(result.small, [], `${width} ${route}: undersized tap targets`);
          assert.ok(result.title.length <= 60, route);
          assert.ok(result.description.length <= 155, route);
          assert.equal(response.status(), route === "/missing-audit-page" ? 404 : 200);
          assert.ok(result.touch > 0);
          assert.equal(result.viewportWidth, width, `${route}: unexpected layout viewport`);
          assert.equal(
            await page.$('script[src*="googletagmanager"]'),
            null,
            "Unconfigured QA must not track",
          );
          await page.click(".menu-toggle");
          await page.click(".mobile-practice-menu summary");
          assert.equal(await page.$$eval(".mobile-practice-menu a", (links) => links.length), 7);
          const menuSmall = await page.$$eval(".mobile-nav a, .mobile-nav summary", (elements) =>
            elements.some((e) => {
              const r = e.getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            }),
          );
          assert.equal(menuSmall, false, "Mobile submenu tap targets");
          const menuOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          );
          assert.equal(menuOverflow, false, "Open mobile menu must not overflow");
          assert.equal(await page.$('script[src^="/.netlify/scripts/hud"]'), null);
          assert.doesNotMatch(
            await page.$eval("body", (e) => e.innerText),
            /powered\s+by\s+netlify|build\s+your\s+own\s+site/i,
          );
          const menu = await page.$eval(".menu-toggle", (e) => e.getAttribute("aria-expanded"));
          assert.equal(menu, "true");
          await page.keyboard.press("Escape");
          assert.equal(
            await page.$eval(".menu-toggle", (e) => e.getAttribute("aria-expanded")),
            "false",
          );
          assert.equal(await page.$eval(".menu-toggle", (e) => e === document.activeElement), true);
          await page.evaluate(() => {
            document.querySelector(".mobile-practice-menu").open = false;
          });
          const contactLinks = await page.$$('a[href^="tel:"], a[href*="google.com/maps/dir/"]');
          for (const link of contactLinks) {
            const unobscured = await link.evaluate((element) => {
              if (!element.getBoundingClientRect().height || element.closest("[hidden]"))
                return true;
              element.scrollIntoView({ block: "center", behavior: "instant" });
              const rect = element.getBoundingClientRect();
              const hit = document.elementFromPoint(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
              );
              return hit === element || element.contains(hit);
            });
            assert.equal(
              unobscured,
              true,
              `${route}: ${await link.evaluate((e) => e.textContent)} obscured while scrolling`,
            );
          }
          await page.evaluate(() => {
            document.activeElement?.blur();
            scrollTo({ top: 0, behavior: "instant" });
          });
          const mapAligned = await page.evaluate(() => {
            const card = document.querySelector(".location-card");
            const map = document.querySelector(".location-grid > .map-frame");
            return (
              !card ||
              !map ||
              card.getBoundingClientRect().bottom <= map.getBoundingClientRect().top + 1
            );
          });
          assert.equal(mapAligned, true, "Mobile location card must stack above its map");
          if (
            ["/", "/contact", "/practice-areas/employment-human-rights-matters"].includes(route)
          ) {
            await mkdir("artifacts/qa/mobile", { recursive: true });
            await page.screenshot({
              path: `artifacts/qa/mobile/${route === "/" ? "home" : route.split("/").at(-1)}-${width}.png`,
              captureBeyondViewport: false,
            });
          }
          results.push({ width, route, status: response.status(), menu, ...result });
        }
      }
      for (const key of ["title", "description"]) {
        const oneWidth = results.filter((r) => r.width === 360);
        assert.equal(new Set(oneWidth.map((r) => r[key])).size, routes.length, `Duplicate ${key}`);
      }
      await writeFile("artifacts/qa/mobile/results.json", JSON.stringify(results, null, 2));
      console.log(
        JSON.stringify(
          results.filter((r) => r.overflow || r.small.length),
          null,
          2,
        ),
      );
    } finally {
      await browser.close();
      await stopQaServer(server);
    }
  },
);
