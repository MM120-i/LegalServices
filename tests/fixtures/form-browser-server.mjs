/** Browser-only fixture: proxies the real preview, but never forwards contact POSTs. */
import { createServer } from "node:http";
import { Readable } from "node:stream";

const mode = process.env.QA_FORM_RESULT ?? "failure";
let submissions = 0;

if (!["failure", "success"].includes(mode)) {
  throw new Error("QA_FORM_RESULT must be failure or success.");
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === "/__qa__/metrics") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ mode, submissions }));
      return;
    }

    if (request.method === "POST" && request.url === "/api/contact") {
      submissions++;
      request.resume();
      await new Promise((resolve) => setTimeout(resolve, 1800));

      response.writeHead(mode === "success" ? 200 : 502, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });

      response.end(
        JSON.stringify({
          ok: mode === "success",
          message:
            mode === "success"
              ? "Fictional QA delivery accepted."
              : "Fictional QA provider failure. Please call the office.",
        }),
      );

      return;
    }

    const target = new URL(request.url, "http://127.0.0.1:3100");
    const headers = { ...request.headers, host: target.host };
    delete headers["accept-encoding"];

    const upstream = await fetch(target, { method: request.method, headers, redirect: "manual" });
    const returnedHeaders = Object.fromEntries(upstream.headers);
    delete returnedHeaders["content-encoding"];
    delete returnedHeaders["content-length"];

    if (process.env.QA_BLOCK_MAP === "true") {
      returnedHeaders["content-security-policy"] = "frame-src 'none'";
    }
    response.writeHead(upstream.status, returnedHeaders);

    if (upstream.body) {
      Readable.fromWeb(upstream.body).pipe(response);
    } else {
      response.end();
    }
  } catch {
    response.writeHead(502, { "content-type": "text/plain" });
    response.end("The local QA preview is unavailable.");
  }
});

server.listen(3102, "127.0.0.1", () =>
  console.log(`Browser fixture at http://127.0.0.1:3102 (${mode}); no real email delivery.`),
);
