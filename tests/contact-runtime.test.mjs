import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { qaEnvironment, stopQaServer } from "../scripts/qa-server.mjs";

test("Contact page reads delivery settings at request time", async () => {
  for (const configured of [false, true]) {
    const env = {
      ...qaEnvironment("launch"),
      ...(configured
        ? {
            RESEND_API_KEY: "runtime-test-not-a-real-key",
            CONTACT_TO_EMAIL: "office@example.test",
            CONTACT_FROM_EMAIL: "website@notify.example.test",
          }
        : {}),
    };

    const child = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3103"],
      { env, stdio: "inherit" },
    );

    try {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        if (child.exitCode !== null) {
          throw new Error("Test server exited");
        }

        try {
          ready = (await fetch("http://127.0.0.1:3103/", { signal: AbortSignal.timeout(1000) })).ok;

          if (ready) {
            break;
          }
        } catch {}

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      assert.ok(ready, "Server did not become ready");
      const response = await fetch("http://127.0.0.1:3103/contact");
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.equal(html.includes("Preview mode: email delivery is not connected yet"), !configured);
      assert.ok(!html.includes("runtime-test-not-a-real-key"), "Secret exposed in page HTML");
      assert.ok(html.includes('action="/api/contact"'));
    } finally {
      await stopQaServer(child);
    }
  }
});
