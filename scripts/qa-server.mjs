import { spawn } from "node:child_process";
import { once } from "node:events";

export function qaEnvironment(mode) {
  if (!["preview", "launch"].includes(mode)) {
    throw new Error("QA_MODE must be preview or launch.");
  }

  return {
    ...process.env,
    NEXT_BUILD_DIR: `.next-qa-${mode}`,
    SITE_PUBLISHED: mode === "launch" ? "true" : "false",
    NEXT_PUBLIC_SITE_URL: mode === "launch" ? "https://qa.lexora.test" : "",
    RESEND_API_KEY: "",
    CONTACT_TO_EMAIL: "",
    CONTACT_FROM_EMAIL: "",
    REVIEWS_STORE_NAME: "",
    REVIEWS_LOCAL_DIRECTORY: "",
    REVIEWS_SITE_URL: "",
    REVIEW_MODERATION_SECRET: "",
  };
}

export async function command(args, env) {
  const child = spawn(process.execPath, args, { env, stdio: "inherit" });
  const [code] = await once(child, "exit");

  if (code !== 0) {
    throw new Error(`Command failed (${code}): ${args.join(" ")}`);
  }
}

export async function startQaServer(mode, port, reviewSettings = {}) {
  const allowed = ["REVIEWS_LOCAL_DIRECTORY", "REVIEWS_SITE_URL", "REVIEW_MODERATION_SECRET"];
  if (Object.keys(reviewSettings).some((key) => !allowed.includes(key))) {
    throw new Error("QA overrides only support isolated local review storage.");
  }
  if (
    reviewSettings.REVIEWS_SITE_URL &&
    !["localhost", "127.0.0.1"].includes(new URL(reviewSettings.REVIEWS_SITE_URL).hostname)
  ) {
    throw new Error("Review QA must use a loopback origin.");
  }
  const env = { ...qaEnvironment(mode), ...reviewSettings };

  const child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { env, stdio: "inherit" },
  );

  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) {
        throw new Error(`QA server exited with ${child.exitCode}`);
      }

      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, {
          signal: AbortSignal.timeout(1000),
        });

        if (response.ok) {
          return child;
        }
      } catch {
        // Retry only while this owned server is starting.
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    throw new Error("QA server did not become ready.");
  } catch (error) {
    child.kill("SIGTERM");
    throw error;
  }
}

export async function stopQaServer(child) {
  if (child.exitCode !== null) {
    return;
  }

  const exited = once(child, "exit");
  child.kill("SIGTERM");
  await exited;
}
