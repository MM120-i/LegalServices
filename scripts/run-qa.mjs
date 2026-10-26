import { mkdir, writeFile } from "node:fs/promises";
import { command, qaEnvironment, startQaServer, stopQaServer } from "./qa-server.mjs";

const results = [];

for (const [mode, port] of [
  ["preview", 3100],
  ["launch", 3101],
]) {
  const env = qaEnvironment(mode);
  await command(["node_modules/next/dist/bin/next", "build"], env);
  const server = await startQaServer(mode, port);

  try {
    await command(
      [
        "--experimental-strip-types",
        "--test",
        "tests/links.test.mjs",
        "tests/seo.test.mjs",
        "tests/external-links.test.mjs",
      ],
      {
        ...env,
        QA_MODE: mode,
        QA_BASE_URL: `http://127.0.0.1:${port}`,
      },
    );

    results.push({ mode, status: "passed", contentRoutes: 15, custom404: true });
  } finally {
    await stopQaServer(server);
  }
}

await mkdir("artifacts/qa", { recursive: true });

await writeFile(
  "artifacts/qa/local-checks-summary.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2) + "\n",
);
