import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseHTML } from "linkedom";
import { randomUUID } from "node:crypto";
import { handleReview } from "../src/lib/review-server.ts";

import {
  handleModeration,
  moderationUrl,
  getModerationConfig,
} from "../src/lib/review-moderation.ts";

import { getPublishedReviews, localReviewStore, reviewKey } from "../src/lib/review-store.ts";
import type { StoredReview } from "../src/lib/review-store.ts";
import { memoryReviewStore, moderation } from "./fixtures/review-store.ts";

const config = { apiKey: "mock-only", to: "office@example.test", from: "site@example.test" };
const now = Date.now();

const fixture = (permissionToPublish = true): StoredReview => ({
  id: randomUUID(),
  nonce: "a".repeat(64),
  createdAt: now,
  updatedAt: now,
  status: "pending",
  formVersion: "2026-11-26",
  displayName: "Sam R.",
  email: "private@example.test",
  rating: 1,
  text: "A fictional test review <script>neverExecute()</script>",
  genuine: true,
  permissionToPublish,
});

const delivery = async () => Response.json({ id: "mock-receipt" });

async function formData(response: Response, action: string) {
  const document = parseHTML(await response.text()).document;
  const button = document.querySelector(`button[value="${action}"]`)!;
  assert.ok(button, `${action} button must exist`);
  const form = button.closest("form")!;

  return {
    body: new URLSearchParams({
      action,
      version: form.querySelector("input[name=version]")!.getAttribute("value")!,
    }),
    action: form.getAttribute("action")!,
  };
}

test("GET is read-only; owner publishes and unpublishes, with stale/replayed decisions blocked", async () => {
  const store = memoryReviewStore();
  const review = fixture();
  await store.create(review);

  const dependencies = { store, moderation, now, config, fetcher: delivery };
  const url = moderationUrl(review, store, moderation, now);
  const get = await handleModeration(new Request(url), dependencies);

  assert.equal(get.status, 200);
  assert.match(get.headers.get("x-robots-tag")!, /noindex/);
  assert.match(get.headers.get("cache-control")!, /no-store/);
  assert.equal(get.headers.get("referrer-policy"), "no-referrer");
  assert.match(get.headers.get("content-security-policy")!, /frame-ancestors 'none'/);

  const html = await get.clone().text();

  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /private@example|<script>|googletag|analytics/i);
  assert.deepEqual(await getPublishedReviews(store), []);
  assert.equal((await store.get(review.id))!.review.status, "pending");

  const form = await formData(get, "publish");
  const post = () => new Request(url, { method: "POST", body: form.body });
  assert.equal((await handleModeration(post(), dependencies)).status, 303);
  const published = await getPublishedReviews(store);
  assert.equal(published.length, 1);

  assert.deepEqual(Object.keys(published[0]).sort(), [
    "displayName",
    "id",
    "permissionToPublish",
    "rating",
    "text",
  ]);

  assert.equal(published[0].rating, 1, "Low ratings use the same publication path");
  assert.equal((await handleModeration(post(), dependencies)).status, 409);

  const remove = await formData(
    await handleModeration(new Request(url), dependencies),
    "unpublish",
  );

  assert.equal(
    (await handleModeration(new Request(url, { method: "POST", body: remove.body }), dependencies))
      .status,
    303,
  );
  assert.deepEqual(await getPublishedReviews(store), []);
});

test("private feedback cannot be published, including a forged action; rejection stays private", async () => {
  const store = memoryReviewStore();
  const review = fixture(false);
  await store.create(review);
  const dependencies = { store, moderation, now };
  const url = moderationUrl(review, store, moderation, now);
  const get = await handleModeration(new Request(url), dependencies);
  assert.doesNotMatch(await get.clone().text(), /value="publish"/);
  const form = await formData(get, "reject");
  const forged = new URLSearchParams(form.body);
  forged.set("action", "publish");

  assert.equal(
    (await handleModeration(new Request(url, { method: "POST", body: forged }), dependencies))
      .status,
    403,
  );

  assert.equal(
    (
      await handleModeration(
        new Request(url, {
          method: "POST",
          body: form.body,
          headers: { origin: "null", "sec-fetch-site": "same-origin" },
        }),
        dependencies,
      )
    ).status,
    303,
  );

  assert.equal((await store.get(review.id))!.review.status, "rejected");
  assert.deepEqual(await getPublishedReviews(store), []);
});

test("tampered, missing, wrong-environment and expired capabilities cannot authorize changes; renewal emails the fixed office only", async () => {
  const store = memoryReviewStore();
  const review = fixture();
  await store.create(review);
  const dependencies = { store, moderation, now, config, fetcher: delivery };
  const url = moderationUrl(review, store, moderation, now);

  for (const invalid of [
    url.replace("token=", "token=x"),
    "https://example.test/api/reviews/moderate",
  ]) {
    assert.equal((await handleModeration(new Request(invalid), dependencies)).status, 404);
  }

  assert.equal(
    (
      await handleModeration(new Request(url), {
        ...dependencies,
        store: memoryReviewStore("other-environment"),
      })
    ).status,
    404,
  );

  const later = now + 31 * 86400000;
  const expired = await handleModeration(new Request(url), { ...dependencies, now: later });
  assert.equal(expired.status, 410);
  assert.doesNotMatch(await expired.clone().text(), /Sam R|fictional/);
  const form = await formData(expired, "renew");
  const forge = new URLSearchParams(form.body);
  forge.set("action", "publish");

  assert.equal(
    (
      await handleModeration(new Request(url, { method: "POST", body: forge }), {
        ...dependencies,
        now: later,
      })
    ).status,
    410,
  );

  let emails = 0;
  let freshUrl = "";

  const renewed = await handleModeration(new Request(url, { method: "POST", body: form.body }), {
    ...dependencies,
    now: later,
    fetcher: async (_url, options) => {
      const email = JSON.parse(String(options?.body));
      assert.deepEqual(email.to, [config.to]);
      freshUrl = email.text.match(/https:\/\/example.test\/api\/reviews\/moderate\?token=\S+/)[0];
      emails++;
      return delivery();
    },
  });

  assert.equal(renewed.status, 200);
  assert.equal(emails, 1);

  assert.equal(
    (await handleModeration(new Request(freshUrl), { ...dependencies, now: later })).status,
    200,
  );

  assert.equal((await store.get(review.id))!.review.status, "pending");
  assert.equal(
    (
      await handleModeration(new Request(url, { method: "POST", body: form.body }), {
        ...dependencies,
        now: later,
        limit: () => false,
      })
    ).status,
    429,
  );
});

test("submission persists before mail; failures are retryable without duplicates or overwrites", async () => {
  const store = memoryReviewStore();
  const review = fixture();
  const { id, ...fields } = review;

  const request = (changes = {}) =>
    new Request("https://example.test/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ ...fields, submissionId: id, ...changes }),
    });

  const dependencies = { store, moderation, config, limit: () => true };

  assert.equal(
    (
      await handleReview(request(), {
        ...dependencies,
        fetcher: async () => new Response(null, { status: 503 }),
      })
    ).status,
    502,
  );

  const saved = (await store.get(id))!.review;
  assert.equal(saved.status, "pending");
  assert.deepEqual(await getPublishedReviews(store), []);
  let calls = 0;
  let url = "";

  const accepted = {
    ...dependencies,
    fetcher: async (_url: unknown, options?: RequestInit) => {
      calls++;
      const email = JSON.parse(String(options?.body));
      url = email.text.match(/https:\/\/example.test\/api\/reviews\/moderate\?token=\S+/)[0];
      assert.equal((await store.get(id))!.review.nonce, saved.nonce);
      return delivery();
    },
  };

  assert.equal((await handleReview(request(), accepted)).status, 200);
  assert.equal((await handleReview(request(), accepted)).status, 200);
  assert.equal(calls, 1, "Successful retries do not send another notification");

  assert.equal(
    (await handleReview(request({ text: "Replace the review with something else" }), accepted))
      .status,
    409,
  );

  assert.equal((await handleModeration(new Request(url), dependencies)).status, 200);
  assert.equal((await store.get(id))!.review.text, review.text);
  assert.equal((await handleReview(request(), { ...accepted, store: null })).status, 503);
  assert.equal((await handleReview(request(), { ...accepted, moderation: null })).status, 503);
});

test("cross-origin, unknown actions, concurrent updates and storage failures cannot claim success", async () => {
  const store = memoryReviewStore();
  const review = fixture();
  await store.create(review);
  const dependencies = { store, moderation, now };
  const url = moderationUrl(review, store, moderation, now);
  const form = await formData(await handleModeration(new Request(url), dependencies), "publish");

  assert.equal(
    (
      await handleModeration(
        new Request(url, {
          method: "POST",
          body: form.body,
          headers: { origin: "https://evil.test" },
        }),
        dependencies,
      )
    ).status,
    403,
  );

  const unknown = new URLSearchParams(form.body);
  unknown.set("action", "erase-everything");

  assert.equal(
    (await handleModeration(new Request(url, { method: "POST", body: unknown }), dependencies))
      .status,
    400,
  );

  assert.equal(
    (
      await handleModeration(
        new Request(url, {
          method: "POST",
          body: form.body,
          headers: { origin: "null", "sec-fetch-site": "cross-site" },
        }),
        dependencies,
      )
    ).status,
    403,
  );

  const results = await Promise.all(
    [1, 2].map(() =>
      handleModeration(
        new Request(url, {
          method: "POST",
          body: form.body,
          headers: { origin: "null", "sec-fetch-site": "same-origin" },
        }),
        dependencies,
      ),
    ),
  );

  assert.deepEqual(results.map((response) => response.status).sort(), [303, 409]);

  const unavailable = {
    ...store,
    update: async () => {
      throw new Error("offline");
    },
  };

  const fresh = await formData(await handleModeration(new Request(url), dependencies), "unpublish");

  assert.equal(
    (
      await handleModeration(new Request(url, { method: "POST", body: fresh.body }), {
        ...dependencies,
        store: unavailable,
      })
    ).status,
    503,
  );

  assert.equal((await getPublishedReviews(store)).length, 1);
});

test("local storage survives a new instance and implements atomic compare-and-swap", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "abead-review-test-"));

  try {
    const review = fixture();
    const first = localReviewStore(directory);
    assert.equal(await first.create(review), true);
    assert.equal(await first.create(review), false);
    const second = localReviewStore(directory);
    const entry = (await second.get(review.id))!;
    assert.equal(entry.review.email, review.email);

    const statuses = await Promise.all(
      [first, second].map((store) => store.update({ ...review, status: "published" }, entry.etag)),
    );

    assert.equal(statuses.filter(Boolean).length, 1);
    assert.equal((await getPublishedReviews(second)).length, 1);
    assert.throws(() => reviewKey("../../private"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("moderation setup rejects insecure origins and short secrets without exposing values", () => {
  const saved = {
    secret: process.env.REVIEW_MODERATION_SECRET,
    origin: process.env.REVIEWS_SITE_URL,
  };

  try {
    process.env.REVIEW_MODERATION_SECRET = moderation.secret;

    for (const origin of [
      "http://example.com",
      "https://user:pass@example.com",
      "https://example.com/path",
      "https://example.com?x=1",
    ]) {
      process.env.REVIEWS_SITE_URL = origin;
      assert.equal(getModerationConfig(), null);
    }

    process.env.REVIEWS_SITE_URL = moderation.origin;
    assert.deepEqual(getModerationConfig(), moderation);
    process.env.REVIEW_MODERATION_SECRET = "short";
    assert.equal(getModerationConfig(), null);
  } finally {
    for (const [key, value] of [
      ["REVIEW_MODERATION_SECRET", saved.secret],
      ["REVIEWS_SITE_URL", saved.origin],
    ]) {
      if (value === undefined) {
        delete process.env[key!];
      } else {
        process.env[key!] = value;
      }
    }
  }
});
