import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import lighthouse from "lighthouse";
import { Launcher } from "chrome-launcher";
import { startQaServer, stopQaServer } from "./qa-server.mjs";

const mode = process.env.QA_MODE ?? "launch";
const port = mode === "launch" ? 3101 : 3100;

const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";

const runs = Number(process.env.QA_RUNS ?? 3);
const cases = process.env.QA_ROUTE
  ? [["target", process.env.QA_ROUTE]]
  : [
      ["home", "/"],
      ["contact", "/contact"],
      ["small-claims", "/practice-areas/small-claims-court-matters"],
    ];

if (
  !existsSync(chromePath) ||
  !Number.isInteger(runs) ||
  runs < 1 ||
  runs > 3 ||
  cases.some(([, route]) => !route.startsWith("/") || route.startsWith("//"))
) {
  throw new Error("Supply an installed Chromium executable, 1–3 runs, and a local route.");
}

const runId = new Date().toISOString().replace(/[:.]/g, "-");
const directory = `artifacts/qa/raw/lighthouse-${mode}/${runId}`;
await mkdir(directory, { recursive: true });
const server = await startQaServer(mode, port);
let chrome;
const results = [];

try {
  chrome = new Launcher({
    chromePath,
    chromeFlags: ["--headless"],
    logLevel: "silent",
    maxConnectionRetries: 120,
  });
  await chrome.launch();

  for (const [name, route] of cases) {
    const scores = [];

    for (let run = 1; run <= runs; run++) {
      const result = await lighthouse(`http://127.0.0.1:${port}${route}`, {
        port: chrome.port,
        output: ["json", "html"],
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "seo"],
        formFactor: "mobile",
      });

      if (!result || result.lhr.runtimeError) {
        throw new Error(result?.lhr.runtimeError?.message ?? "Lighthouse did not return a report.");
      }

      await writeFile(`${directory}/${name}-${run}.json`, result.report[0]);
      await writeFile(`${directory}/${name}-${run}.html`, result.report[1]);

      const score = Object.fromEntries(
        Object.entries(result.lhr.categories).map(([key, value]) => [
          key,
          Math.round(value.score * 100),
        ]),
      );

      const failures = Object.values(result.lhr.audits)
        .filter(
          (audit) =>
            audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== "informative",
        )
        .map((audit) => ({ id: audit.id, title: audit.title, score: audit.score }));

      const accessibilityFailures = [
        "label-content-name-mismatch",
        "color-contrast",
        "target-size",
        "link-name",
      ].filter((id) => result.lhr.audits[id]?.score === 0);

      scores.push({
        ...score,
        accessibilityFailures,
        benchmarkIndex: result.lhr.environment.benchmarkIndex,
      });
      console.log(JSON.stringify({ mode, name, run, score, failures }));
    }

    const median = Object.fromEntries(
      ["performance", "accessibility", "seo"].map((key) => [
        key,
        scores.map((score) => score[key]).sort((a, b) => a - b)[Math.floor(scores.length / 2)],
      ]),
    );

    results.push({ name, route, scores, median });
  }

  await writeFile(
    `artifacts/qa/lighthouse-${mode}${process.env.QA_ROUTE ? "-target" : ""}-summary.json`,
    JSON.stringify(
      { mode, runs, reportsDirectory: directory, generatedAt: new Date().toISOString(), results },
      null,
      2,
    ) + "\n",
  );
  const failed = results.filter(
    ({ median, scores }) =>
      median.performance < 90 ||
      median.accessibility < 100 ||
      (mode === "launch" && median.seo < 100) ||
      scores.some(({ accessibilityFailures }) => accessibilityFailures.length > 0),
  );

  if (failed.length) {
    console.error(
      "Lighthouse targets not met:",
      JSON.stringify(failed.map(({ name, median }) => ({ name, median }))),
    );
    process.exitCode = 1;
  }
} finally {
  chrome?.kill();
  await stopQaServer(server);
}
