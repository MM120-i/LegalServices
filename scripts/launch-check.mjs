import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { site } from "../src/config/site.ts";
import { parsePublishedOrigin, placeholderFindings } from "../src/lib/launch.ts";

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)],
    ),
  );

  return nested.flat();
}

const findings = [];
const origin = parsePublishedOrigin(process.env.NEXT_PUBLIC_SITE_URL);

if (!origin || /\.(test|invalid)$/.test(new URL(origin).hostname))
  findings.push({ scope: "configuration", reason: "Real HTTPS production origin required" });

if (process.env.SITE_PUBLISHED !== "true")
  findings.push({ scope: "configuration", reason: "Publication remains disabled" });

if (!site.email || !site.business.independentlyVerified) {
  findings.push({
    scope: "client",
    reason: "Real contact email and verified business facts required",
  });
}

if (
  !["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"].every((key) => process.env[key])
) {
  findings.push({ scope: "configuration", reason: "Real email delivery configuration required" });
}

for (const file of await files("src")) {
  if (file === join("src", "lib", "launch.ts")) {
    continue;
  }

  if (!/\.(tsx?|css)$/.test(file)) {
    continue;
  }

  const reasons = placeholderFindings(await readFile(file, "utf8"));

  if (reasons.length) {
    findings.push({ scope: "source", file, reasons });
  }
}

const build = join(process.env.LAUNCH_BUILD_DIR ?? ".next", "server/app");
let htmlFiles = [];

try {
  htmlFiles = (await files(build)).filter((file) => file.endsWith(".html"));
} catch {
  findings.push({
    scope: "build",
    reason: "Build output unavailable; rendered scan not completed",
  });
}

if (!htmlFiles.length) {
  findings.push({ scope: "build", reason: "No rendered HTML found" });
}

for (const file of htmlFiles) {
  const { document } = parseHTML(await readFile(file, "utf8"));
  document.querySelectorAll("script, style, noscript, template").forEach((node) => node.remove());
  const reasons = placeholderFindings(document.body.textContent ?? "");

  if (reasons.length) {
    findings.push({ scope: "rendered", file, reasons });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  status: findings.length ? "blocked" : "automated-checks-passed",
  renderedPages: htmlFiles.length,
  findings,
  manualChecksRequired: [
    "Written client approval and approved assets/policies",
    "HTTPS and alternate-host redirect on live hosting",
    "Search Console ownership, sitemap submission, indexing request",
    "GA4 consent/privacy configuration and actual event receipt",
    "Business Profile ownership and verification status",
    "Three confirmed inbox receipts and phone test on mobile data",
  ],
};

await mkdir("artifacts/launch", { recursive: true });
await writeFile("artifacts/launch/readiness.json", JSON.stringify(report, null, 2) + "\n");

console.log(
  `Launch ${report.status}: ${findings.length} findings; ${htmlFiles.length} rendered pages. See artifacts/launch/readiness.json.`,
);

process.exitCode = findings.length ? 1 : 0;
