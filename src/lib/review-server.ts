import { randomBytes, randomUUID } from "node:crypto";
import { site } from "../config/site.ts";
import { allowContactAttempt, getContactConfig, isTrustedContactOrigin } from "./contact-server.ts";
import { reviewReceivedMessage, validateReview } from "./reviews.ts";
import { getReviewStore } from "./review-store.ts";
import type { ReviewStore, StoredReview } from "./review-store.ts";
import { getModerationConfig, moderationUrl, sendModerationEmail } from "./review-moderation.ts";
import type { ModerationConfig } from "./review-moderation.ts";
import type { ReviewResult } from "./reviews.ts";

type DeliveryConfig = NonNullable<ReturnType<typeof getContactConfig>>;

interface Dependencies {
  config?: DeliveryConfig | null;
  store?: ReviewStore | null;
  moderation?: ModerationConfig | null;
  fetcher?: typeof fetch;
  limit?: (identity: string) => boolean;
}

export async function handleReview(
  request: Request,
  dependencies: Dependencies = {},
): Promise<Response> {
  const json = request.headers.get("accept")?.includes("application/json") ?? false;

  const respond = (
    status: number,
    result: ReviewResult,
    extraHeaders: Record<string, string> = {},
  ) => {
    const headers = { "Cache-Control": "no-store", ...extraHeaders };

    if (json) {
      return Response.json(result, { status, headers });
    }

    const fieldMessages = result.errors
      ? `<ul>${Object.values(result.errors)
          .map((message) => `<li>${message}</li>`)
          .join("")}</ul>`
      : "";

    return new Response(
      `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${result.ok ? "Review received" : "Review not sent"}</title><main><h1>${result.ok ? "Review received" : "Review not sent"}</h1><p>${result.message}</p>${fieldMessages}<p><a href="/#reviews">Return to reviews</a></p><p>Need help? <a href="${site.phones.primary.href}">Call ${site.phones.primary.display}</a> or <a href="${site.phones.office.href}">${site.phones.office.display}</a>.</p></main></html>`,
      {
        status,
        headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      },
    );
  };

  if (!isTrustedContactOrigin(request))
    return respond(403, { ok: false, message: "Please submit your review from this website." });

  const contentType = request.headers.get("content-type") ?? "";

  if (
    !["application/json", "application/x-www-form-urlencoded", "multipart/form-data"].some((type) =>
      contentType.startsWith(type),
    )
  ) {
    return respond(415, { ok: false, message: "Please use the review form." });
  }

  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;

  try {
    if (reader) {
      while (true) {
        const chunk = await reader.read();

        if (chunk.done) {
          break;
        }

        bytes += chunk.value.byteLength;

        if (bytes > 12 * 1024) {
          await reader.cancel();

          return respond(413, {
            ok: false,
            message: "That review is too large. Please keep it under 1,500 characters.",
          });
        }

        chunks.push(chunk.value);
      }
    }
  } catch {
    return respond(400, { ok: false, message: "Your review could not be read. Please try again." });
  }

  let input: Record<string, unknown>;

  try {
    const body = new Uint8Array(bytes);
    let offset = 0;

    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }

    const parsed = new Request(request.url, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    });

    if (contentType.startsWith("application/json")) {
      const value: unknown = await parsed.json();

      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Invalid review");

      input = value as Record<string, unknown>;
    } else {
      input = Object.fromEntries((await parsed.formData()).entries());
    }
  } catch {
    return respond(400, { ok: false, message: "Please check your review and try again." });
  }

  if (input.website)
    return respond(400, { ok: false, message: "Please check your review and try again." });

  const checked = validateReview(input);

  if (!checked.ok) {
    return respond(422, {
      ok: false,
      message: "Please check the highlighted fields.",
      errors: checked.errors,
    });
  }

  const config = dependencies.config === undefined ? getContactConfig() : dependencies.config;

  if (!config) {
    return respond(503, {
      ok: false,
      message:
        "Online reviews are temporarily unavailable. Please try again later or call the office.",
    });
  }

  if (!(dependencies.limit ?? allowContactAttempt)(`review:${checked.value.email.toLowerCase()}`)) {
    return respond(
      429,
      { ok: false, message: "Please wait a little before sending another review." },
      { "Retry-After": "600" },
    );
  }

  const review = checked.value;

  const id =
    typeof input.submissionId === "string" &&
    /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(input.submissionId)
      ? input.submissionId
      : randomUUID();

  let store: ReviewStore | null;
  const moderation =
    dependencies.moderation === undefined ? getModerationConfig() : dependencies.moderation;
  try {
    store = dependencies.store === undefined ? getReviewStore() : dependencies.store;
    if (!store || !moderation) throw new Error("Review setup unavailable");
  } catch {
    return respond(503, {
      ok: false,
      message:
        "Online reviews are temporarily unavailable. Please try again later or call the office.",
    });
  }

  try {
    const now = Date.now();
    const candidate: StoredReview = {
      ...review,
      id: id.toLowerCase(),
      nonce: randomBytes(32).toString("hex"),
      status: "pending",
      createdAt: now,
      updatedAt: now,
      formVersion: "2026-11-26",
    };
    await store.create(candidate);
    const entry = await store.get(candidate.id);
    if (!entry) throw new Error("Review was not saved");
    const saved = entry.review;
    // A retry can resume notification, but cannot replace an existing submission or its consent.
    if (
      Object.keys(review).some(
        (key) => review[key as keyof typeof review] !== saved[key as keyof typeof review],
      )
    ) {
      return respond(409, {
        ok: false,
        message:
          "This submission reference was already used. Reload the page to send a new review.",
      });
    }
    if (!saved.notifiedAt) {
      await sendModerationEmail(
        config,
        [
          "A website review was submitted. It has NOT been published.",
          "Review form version: 2026-11-26",
          `Submission reference: ${saved.id}`,
          `Display name: ${saved.displayName}`,
          `Private email: ${saved.email}`,
          `Rating: ${saved.rating}/5`,
          "First-hand experience confirmed: Yes",
          `Permission to publish: ${saved.permissionToPublish ? "YES — subject to authenticity and privacy review" : "NO — PRIVATE FEEDBACK ONLY. Do not publish."}`,
          "Publication permission wording: The practice may publish my review, rating and display name on this website.",
          "",
          "Review text:",
          saved.text,
          "",
          "Review this submission:",
          moderationUrl(saved, store, moderation, saved.createdAt),
          "",
          "This private link expires in 30 days. Keep it private and save this email. Opening it does not publish anything. Use Publish or Reject on the page. Return to this link to Unpublish later. If expired, request a fresh link on that page; it goes only to the office inbox.",
          "Check authenticity and confidentiality; apply the same standards to every rating. Never publish private feedback without permission. Do not materially edit a review without the author's approval.",
        ].join("\n"),
        `abead-review/${saved.id}`,
        dependencies.fetcher,
        saved.email,
      );
      await store.update({ ...saved, notifiedAt: Date.now() }, entry.etag);
    }

    return respond(200, { ok: true, message: reviewReceivedMessage });
  } catch {
    return respond(502, {
      ok: false,
      message: "We could not confirm your review was sent. Please try again or call the office.",
    });
  }
}
