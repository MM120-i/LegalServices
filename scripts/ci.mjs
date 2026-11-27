import { command, qaEnvironment, startQaServer, stopQaServer } from "./qa-server.mjs";

const env = {
  ...qaEnvironment("launch"),
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
  GOOGLE_SITE_VERIFICATION: "",
};

switch (process.argv[2]) {
  case "build":
    await command(["node_modules/next/dist/bin/next", "build", "--webpack"], env);
    break;

  case "runtime": {
    const port = 3110;
    const server = await startQaServer("launch", port);

    try {
      await command(
        ["--experimental-strip-types", "--test", "tests/links.test.mjs", "tests/seo.test.mjs"],
        { ...env, QA_MODE: "launch", QA_BASE_URL: `http://127.0.0.1:${port}` },
      );
      await command(["--experimental-strip-types", "--test", "tests/audit-content.test.mjs"], env);
    } finally {
      await stopQaServer(server);
    }

    break;
  }

  default:
    throw new Error("Usage: node scripts/ci.mjs build|runtime");
}
