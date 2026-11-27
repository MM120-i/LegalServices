import assert from "node:assert/strict";
import { test } from "node:test";
import { handleReview as submitReview } from "../src/lib/review-server.ts";
import { validateReview, reviewReceivedMessage } from "../src/lib/reviews.ts";
import { publishedReviews } from "../src/content/reviews.ts";

import { memoryReviewStore, moderation } from "./fixtures/review-store.ts";

function handleReview(request: Request, dependencies: Parameters<typeof submitReview>[1] = {}) {
  return submitReview(request, { store: memoryReviewStore(), moderation, ...dependencies });
}

const config = {
  apiKey: "mock-key",
  to: "office@example.test",
  from: "website@notify.example.test",
};

const input = {
  displayName: "Sam R.",
  email: "sam@example.test",
  rating: "1",
  text: "A fictional review used only by automated tests.",
  genuine: "on",
  permissionToPublish: "on",
  submissionId: "12345678-1234-1234-1234-123456789abc",
};

function request(value: unknown = input, headers: Record<string, string> = {}) {
  return new Request("https://example.test/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...headers },
    body: JSON.stringify(value),
  });
}

const accepted = async () => Response.json({ id: "mock-review-receipt" });

test("review validation accepts all ratings and keeps publication permission separate", () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    const result = validateReview({ ...input, rating, permissionToPublish: false });
    assert.ok(result.ok);
    assert.equal(result.value.rating, rating);
    assert.equal(result.value.permissionToPublish, false);
  }

  for (const displayName of ["Sam R.", "José", "শরফ", "李雷"])
    assert.ok(validateReview({ ...input, displayName }).ok);

  for (const change of [
    { displayName: "12345" },
    { displayName: "<script>" },
    { displayName: "x".repeat(81) },
    { email: "bad..email@example.ca" },
    { email: "" },
    { rating: "5 stars" },
    { rating: 0 },
    { rating: 6 },
    { text: "Short" },
    { text: "x".repeat(1501) },
    { text: "Private\u0000text" },
    { genuine: false },
  ]) {
    assert.equal(validateReview({ ...input, ...change }).ok, false, JSON.stringify(change));
  }
});

test("review notifications preserve consent, private reply address and idempotency without publishing", async () => {
  const publishedBefore = JSON.stringify(publishedReviews);

  for (const permissionToPublish of [false, "on"]) {
    const keys: (string | null)[] = [];

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await handleReview(request({ ...input, permissionToPublish }), {
        config,
        limit: () => true,
        fetcher: async (url, options) => {
          assert.equal(url, "https://api.resend.com/emails");
          const body = JSON.parse(String(options?.body));
          keys.push(new Headers(options?.headers).get("Idempotency-Key"));
          assert.deepEqual(body.to, [config.to]);
          assert.equal(body.reply_to, input.email);
          assert.equal(body.html, undefined, "User text must not become HTML");
          assert.match(body.text, /Rating: 1\/5/);
          assert.match(
            body.text,
            permissionToPublish ? /Permission to publish: YES/ : /NO — PRIVATE FEEDBACK ONLY/,
          );
          assert.match(body.text, /NOT been published/);

          return accepted();
        },
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true, message: reviewReceivedMessage });
    }

    assert.equal(keys[0], keys[1], "Retry must reuse the provider idempotency key");
  }

  assert.equal(
    JSON.stringify(publishedReviews),
    publishedBefore,
    "Submissions cannot update public content",
  );
});

test("invalid, spam, oversized and cross-origin reviews cannot send email", async () => {
  let calls = 0;

  const dependencies = {
    config,
    limit: () => true,
    fetcher: async () => {
      calls++;
      return accepted();
    },
  };

  for (const [submission, status] of [
    [{ ...input, rating: 9 }, 422],
    [{ ...input, website: "spam" }, 400],
    [[], 400],
    [{ ...input, text: "x".repeat(13000) }, 413],
  ] as const) {
    assert.equal((await handleReview(request(submission), dependencies)).status, status);
  }

  assert.equal(
    (
      await handleReview(
        request(input, { origin: "https://other.example", "sec-fetch-site": "cross-site" }),
        dependencies,
      )
    ).status,
    403,
  );

  const badType = new Request("https://example.test/api/reviews", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "spam",
  });

  assert.equal((await handleReview(badType, dependencies)).status, 415);
  assert.equal(calls, 0);
});

test("unconfigured, rate-limited and provider-failure states do not claim success", async () => {
  assert.equal((await handleReview(request(), { config: null })).status, 503);
  const limited = await handleReview(request(), { config, limit: () => false });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "600");

  for (const fetcher of [
    async () => new Response("rejected", { status: 403 }),
    async () => Response.json({}),
    async () => {
      throw new Error("Provider down");
    },
  ]) {
    const response = await handleReview(request(), { config, limit: () => true, fetcher });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).ok, false);
  }
});

test("native form submissions work without JavaScript and never reflect submitted markup", async () => {
  const body = new URLSearchParams(Object.entries(input));
  body.set("text", "<script>alert('fictional test')</script>");

  const response = await handleReview(
    new Request("https://example.test/api/reviews", { method: "POST", body }),
    { config, limit: () => true, fetcher: accepted },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /text\/html/);
  const html = await response.text();
  assert.match(html, /Review received/);
  assert.match(html, /It has not been published/);
  assert.doesNotMatch(html, /<script>|sam@example/);
});

test("public review catalog contains no private contact fields or placeholder quotes", () => {
  for (const review of publishedReviews) {
    assert.equal(review.permissionToPublish, true);
    assert.ok(review.rating >= 1 && review.rating <= 5);
    assert.ok(review.text.length >= 10 && review.text.length <= 1500);
    assert.equal("email" in review, false);
    assert.doesNotMatch(review.displayName, /Sample reviewer/i);
  }
});
