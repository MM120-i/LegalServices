import assert from "node:assert/strict";

import {
  handleContact,
  allowContactAttempt,
  isTrustedContactOrigin,
} from "../src/lib/contact-server.ts";

import { validateContact } from "../src/lib/contact.ts";

const inquiry = {
  name: "Sample Visitor",
  phone: "416-555-0123",
  email: "visitor@example.test",
  topic: "other",
  message: "This is a fictional test inquiry.",
  consent: "on",
  website: "",
  submissionId: "12345678-1234-1234-1234-123456789abc",
};

const config = {
  apiKey: "test-placeholder-no-real-email",
  to: "office@example.test",
  from: "intake@example.test",
};

function request(
  data: Record<string, unknown> = inquiry,
  options: { origin?: string; accept?: string; contentType?: string; body?: string } = {},
) {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      accept: options.accept ?? "application/json",
      "content-type": options.contentType ?? "application/json",
      ...(options.origin ? { origin: options.origin } : {}),
    },
    body: options.body ?? JSON.stringify(data),
  });
}

assert.equal(validateContact(inquiry).ok, true);

for (const change of [
  { name: "A" },
  { phone: "abc" },
  { email: "not-an-email" },
  { topic: "invalid" },
  { message: "x".repeat(2001) },
  { consent: false },
  { name: "Header\nInjection" },
]) {
  assert.equal(validateContact({ ...inquiry, ...change }).ok, false);
}

assert.equal(validateContact({ ...inquiry, email: "" }).ok, true);

function originRequest(origin: string | null, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { ...(origin ? { origin } : {}), ...headers },
    body: JSON.stringify(inquiry),
  });
}

assert.equal(
  isTrustedContactOrigin(
    originRequest("http://127.0.0.1:3000", {
      host: "127.0.0.1:3000",
      "sec-fetch-site": "same-origin",
    }),
    [],
  ),
  true,
  "Next bind address must not reject the browser's real local host",
);

assert.equal(
  isTrustedContactOrigin(originRequest("http://127.0.0.1:3000", { host: "127.0.0.1:3000" }), []),
  true,
  "Native forms without Fetch Metadata still match the direct host",
);

assert.equal(
  isTrustedContactOrigin(
    originRequest("https://lexora.example.test", {
      host: "lexora.example.test",
      "sec-fetch-site": "same-origin",
    }),
    [],
  ),
  true,
  "TLS termination may change the application scheme",
);

assert.equal(
  isTrustedContactOrigin(originRequest("https://public.example.test", { host: "internal:3000" }), [
    "https://public.example.test",
  ]),
  true,
  "Explicit origin supports proxies that rewrite Host",
);

assert.equal(
  isTrustedContactOrigin(
    originRequest("https://evil.example.test", {
      host: "127.0.0.1:3000",
      "x-forwarded-host": "evil.example.test",
      "x-forwarded-proto": "https",
      "sec-fetch-site": "same-origin",
    }),
    [],
  ),
  false,
  "Forwarded headers must not grant trust",
);

assert.equal(
  isTrustedContactOrigin(
    originRequest("http://127.0.0.1:3000", {
      host: "127.0.0.1:3000",
      "sec-fetch-site": "cross-site",
    }),
    [],
  ),
  false,
);

assert.equal(
  isTrustedContactOrigin(
    originRequest("http://localhost:3000", {
      host: "localhost:3000",
      "sec-fetch-site": "same-site",
    }),
    [],
  ),
  false,
);

assert.equal(isTrustedContactOrigin(originRequest("null", { host: "localhost:3000" }), []), false);

assert.equal(
  isTrustedContactOrigin(
    originRequest("http://localhost:3000@evil.example.test", { host: "evil.example.test" }),
    [],
  ),
  false,
);

assert.equal(
  isTrustedContactOrigin(originRequest(null, { "sec-fetch-site": "cross-site" }), []),
  false,
);

let calls = 0;

const fetcher: typeof fetch = async (_url, init) => {
  calls++;
  assert.equal(_url, "https://api.resend.com/emails/batch");

  const payload = JSON.parse(String(init?.body));

  assert.equal(payload.length, 2);
  assert.equal(payload[0].reply_to, inquiry.email);
  assert.equal(payload[1].to[0], inquiry.email);

  assert.ok(
    !payload[1].text.includes(inquiry.message),
    "Do not echo case details to automatic acknowledgement",
  );

  assert.equal(
    new Headers(init?.headers).get("Idempotency-Key"),
    `lexora-inquiry/${inquiry.submissionId}`,
  );

  return Response.json({ data: [{ id: "mock-notification" }, { id: "mock-acknowledgement" }] });
};

const options = { config, fetcher, limit: () => true };

const localhostAlias = new Request("http://localhost:3000/api/contact", {
  method: "POST",
  headers: {
    origin: "http://127.0.0.1:3000",
    host: "127.0.0.1:3000",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
    accept: "application/json",
  },
  body: JSON.stringify(inquiry),
});

const aliasResponse = await handleContact(localhostAlias, { config: null });
assert.equal(
  aliasResponse.status,
  503,
  "A same-origin browser reaches configuration handling, not false 403",
);

let response = await handleContact(request(), options);

assert.equal(response.status, 200);
assert.equal((await response.json()).ok, true);
assert.equal(calls, 1);

response = await handleContact(request(), { ...options, config: null });

assert.equal(response.status, 503);
assert.equal(calls, 1);

response = await handleContact(request({ ...inquiry, consent: false }), options);

assert.equal(response.status, 422);
assert.equal(calls, 1);

response = await handleContact(request({ ...inquiry, website: "bot-filled" }), options);

assert.equal(response.status, 400);
assert.equal(calls, 1);

response = await handleContact(request(inquiry, { origin: "https://unrelated.example" }), options);

assert.equal(response.status, 403);
assert.equal(calls, 1);

response = await handleContact(request(), { ...options, limit: () => false });

assert.equal(response.status, 429);
assert.equal(response.headers.get("retry-after"), "600");
assert.equal(calls, 1);

response = await handleContact(request(inquiry, { body: "x".repeat(17000) }), options);

assert.equal(response.status, 413);
assert.equal(calls, 1);

response = await handleContact(request(inquiry, { body: "not valid json" }), options);
assert.equal(response.status, 400);
assert.equal(calls, 1);

response = await handleContact(request(inquiry, { contentType: "text/plain" }), options);

assert.equal(response.status, 415);
assert.equal(calls, 1);

response = await handleContact(request(), {
  ...options,
  fetcher: async () => Response.json({ error: "mock" }, { status: 500 }),
});

assert.equal(response.status, 502);
assert.equal((await response.json()).ok, false);

response = await handleContact(request(), {
  ...options,
  fetcher: async () => Response.json({ data: [] }),
});

assert.equal(response.status, 502);

response = await handleContact(request(), {
  ...options,
  fetcher: async () => {
    throw new Error("mock network failure");
  },
});

assert.equal(response.status, 502);

response = await handleContact(request(inquiry, { accept: "text/html" }), options);

assert.equal(response.status, 303);
assert.equal(response.headers.get("location"), "/thank-you");

response = await handleContact(request(inquiry, { accept: "text/html" }), {
  ...options,
  config: null,
});

assert.equal(response.status, 503);
assert.match(await response.text(), /Call/);

const nativeFields = new URLSearchParams(
  Object.fromEntries(Object.entries(inquiry).map(([key, value]) => [key, String(value)])),
);

response = await handleContact(
  new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { accept: "text/html", "content-type": "application/x-www-form-urlencoded" },
    body: nativeFields,
  }),
  options,
);

assert.equal(response.status, 303);
const multipart = new FormData();

for (const [key, value] of Object.entries(inquiry)) {
  multipart.set(key, String(value));
}

response = await handleContact(
  new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { accept: "application/json" },
    body: multipart,
  }),
  options,
);

assert.equal(response.status, 200);
let singleSent = false;

response = await handleContact(request({ ...inquiry, email: "" }), {
  ...options,
  fetcher: async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.length, 1);
    assert.ok(!("reply_to" in payload[0]));
    singleSent = true;
    return Response.json({ data: [{ id: "mock-office-only" }] });
  },
});

assert.equal(response.status, 200);
assert.equal(singleSent, true);

const time = Date.now() + 600000;

assert.equal(allowContactAttempt("fictional-test-key", time), true);
assert.equal(allowContactAttempt("fictional-test-key", time), true);
assert.equal(allowContactAttempt("fictional-test-key", time), true);
assert.equal(allowContactAttempt("fictional-test-key", time), false);
assert.equal(allowContactAttempt("fictional-test-key", time + 600001), true);

console.log(
  "Contact checks passed: validation, native fallback, provider mocks, acknowledgement privacy, missing configuration, abuse limits and failure paths. No real email sent.",
);
