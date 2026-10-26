import { parseHTML } from "linkedom";
import { pageDrafts } from "../../src/content/generated.ts";

export const routes = pageDrafts.filter((page) => page.route !== "404").map((page) => page.route);
export const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3100";
export const launchMode = process.env.QA_MODE === "launch";
export const launchOrigin = "https://qa.lexora.test";

const target = new URL(baseUrl);

if (!["127.0.0.1", "localhost", "[::1]"].includes(target.hostname)) {
  throw new Error("QA requests must target a local server.");
}

export function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function documentFrom(html) {
  return parseHTML(html).document;
}

export function visibleText(document) {
  const copy = document.cloneNode(true);

  for (const element of copy.querySelectorAll("script, style, noscript, template")) {
    element.remove();
  }

  return normalize(copy.body.textContent ?? "");
}

export async function loadPages() {
  return Promise.all(
    routes.map(async (route) => {
      const response = await fetch(new URL(route, baseUrl), { signal: AbortSignal.timeout(15000) });

      if (!response.ok) {
        throw new Error(`${route} returned HTTP ${response.status}`);
      }

      return { route, document: documentFrom(await response.text()) };
    }),
  );
}
