import { randomUUID } from "node:crypto";
import { site } from "../config/site.ts";
import { allowContactAttempt, getContactConfig, isTrustedContactOrigin } from "./contact-server.ts";
import { reviewReceivedMessage, validateReview } from "./reviews.ts";
import type { ReviewResult } from "./reviews.ts";

type DeliveryConfig = NonNullable<ReturnType<typeof getContactConfig>>;

interface Dependencies {
  config?: DeliveryConfig | null;
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
    typeof input.submissionId === "string" && /^[a-f\d-]{36}$/i.test(input.submissionId)
      ? input.submissionId
      : randomUUID();

  try {
    const response = await (dependencies.fetcher ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `abead-review/${id}`,
      },
      body: JSON.stringify({
        from: `${site.business.name} <${config.from}>`,
        to: [config.to],
        reply_to: review.email,
        subject: "Website review — pending office approval",
        text: [
          "A website review was submitted. It has NOT been published.",
          "Review form version: 2026-11-26",
          `Submission reference: ${id}`,
          `Display name: ${review.displayName}`,
          `Private email: ${review.email}`,
          `Rating: ${review.rating}/5`,
          `First-hand experience confirmed: ${review.genuine ? "Yes" : "No"}`,
          `Permission to publish: ${review.permissionToPublish ? "YES — subject to authenticity and privacy review" : "NO — PRIVATE FEEDBACK ONLY. Do not publish."}`,
          "Publication permission wording: The practice may publish my review, rating and display name on this website.",
          "",
          "Review text:",
          review.text,
          "",
          "Review authenticity and confidentiality before publication. Do not publish the email address. Keep permission evidence in office records. Apply the same standards to every rating. If permission was given and publication approved, send the exact approved quote and display name to the website maintainer for the next batch update. Do not materially edit a review without the author's approval.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error("Provider rejected review");
    }

    const receipt: unknown = await response.json();

    if (
      !receipt ||
      typeof receipt !== "object" ||
      !("id" in receipt) ||
      typeof receipt.id !== "string" ||
      !receipt.id
    ) {
      throw new Error("Missing receipt");
    }

    return respond(200, { ok: true, message: reviewReceivedMessage });
  } catch {
    return respond(502, {
      ok: false,
      message: "We could not confirm your review was sent. Please try again or call the office.",
    });
  }
}
