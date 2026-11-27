import { createHmac, timingSafeEqual } from "node:crypto";
import { getContactConfig, allowContactAttempt, isTrustedContactOrigin } from "./contact-server.ts";
import { site } from "../config/site.ts";
import { getReviewStore, reviewKey } from "./review-store.ts";
import type { ReviewStore, StoredReview } from "./review-store.ts";

const lifetime = 30 * 24 * 60 * 60 * 1000;
type DeliveryConfig = NonNullable<ReturnType<typeof getContactConfig>>;

export interface ModerationConfig {
  secret: string;
  origin: string;
}

export interface ModerationDependencies {
  store?: ReviewStore | null;
  moderation?: ModerationConfig | null;
  config?: DeliveryConfig | null;
  fetcher?: typeof fetch;
  limit?: (identity: string) => boolean;
  now?: number;
}

export function getModerationConfig(): ModerationConfig | null {
  const secret = process.env.REVIEW_MODERATION_SECRET?.trim();
  const origin = process.env.REVIEWS_SITE_URL?.trim();

  if (!secret || secret.length < 32 || !origin) {
    return null;
  }

  try {
    const url = new URL(origin);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    ) {
      return null;
    }

    return { secret, origin: url.origin };
  } catch {
    return null;
  }
}

export function moderationToken(
  review: StoredReview,
  store: ReviewStore,
  config: ModerationConfig,
  issuedAt: number,
): string {
  const payload = Buffer.from(
    JSON.stringify({ id: review.id, nonce: review.nonce, expires: issuedAt + lifetime }),
  ).toString("base64url");

  const signature = createHmac("sha256", config.secret)
    .update(`${store.name}\n${config.origin}\n${payload}`)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function moderationUrl(
  review: StoredReview,
  store: ReviewStore,
  config: ModerationConfig,
  issuedAt: number,
): string {
  const url = new URL("/api/reviews/moderate", config.origin);
  url.searchParams.set("token", moderationToken(review, store, config, issuedAt));
  return url.href;
}

async function authenticate(token: string, store: ReviewStore, config: ModerationConfig) {
  if (token.length > 1500) {
    return null;
  }

  const [payload, signature, extra] = token.split(".");

  if (!payload || !signature || extra) {
    return null;
  }

  const expected = createHmac("sha256", config.secret)
    .update(`${store.name}\n${config.origin}\n${payload}`)
    .digest();

  const supplied = Buffer.from(signature, "base64url");

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return null;
  }

  let data: { id: string; nonce: string; expires: number };

  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (
      typeof data.id !== "string" ||
      typeof data.nonce !== "string" ||
      !Number.isSafeInteger(data.expires)
    ) {
      return null;
    }

    reviewKey(data.id);
  } catch {
    return null;
  }

  const entry = await store.get(data.id);

  if (!entry || entry.review.nonce !== data.nonce) {
    return null;
  }

  return { ...entry, expires: data.expires };
}

const escape = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );

function page(title: string, content: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow, noarchive"><meta name="referrer" content="no-referrer"><title>${escape(title)} | Abead Legal Services</title><style>
  *{box-sizing:border-box}body{margin:0;background:#faf9f5;color:#102332;font:17px/1.6 system-ui,sans-serif}main{max-width:760px;margin:48px auto;padding:32px;background:white;border-top:5px solid #805b0b}h1{font:600 2rem Georgia,serif}h2{font-size:1.2rem}.brand{color:#805b0b;font-weight:700}blockquote{margin:24px 0;padding:20px;background:#f6f4ef;white-space:pre-wrap;overflow-wrap:anywhere}button,a{min-height:48px;display:inline-flex;align-items:center;padding:10px 18px;margin:6px 8px 6px 0}button{border:1px solid #102332;border-radius:4px;background:#102332;color:white;font:inherit;cursor:pointer}a{color:#102332}button:focus-visible,a:focus-visible{outline:3px solid #805b0b;outline-offset:3px}form{display:inline}.note{color:#4b5a65}.status{font-weight:700}input{max-width:100%}@media(max-width:600px){main{margin:20px 12px;padding:22px}button{width:100%;margin-right:0}} </style></head><body><main><p class="brand">ABEAD LEGAL SERVICES · PRIVATE REVIEW</p><h1>${escape(title)}</h1>${content}</main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function sendModerationEmail(
  config: DeliveryConfig,
  text: string,
  key: string,
  fetcher: typeof fetch = fetch,
  replyTo?: string,
): Promise<void> {
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({
      from: `${site.business.name} <${config.from}>`,
      to: [config.to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: "Website review — pending office approval",
      text,
    }),
    signal: AbortSignal.timeout(12000),
  });

  const receipt = response.ok ? await response.json() : null;

  if (!receipt || typeof receipt.id !== "string" || !receipt.id)
    throw new Error("Review email unavailable");
}

export async function handleModeration(
  request: Request,
  dependencies: ModerationDependencies = {},
): Promise<Response> {
  try {
    const store = dependencies.store === undefined ? getReviewStore() : dependencies.store;
    const config =
      dependencies.moderation === undefined ? getModerationConfig() : dependencies.moderation;

    if (!store || !config) {
      return page(
        "Review management unavailable",
        "<p>Please contact your website administrator to finish review setup.</p>",
        503,
      );
    }

    const token = new URL(request.url).searchParams.get("token") ?? "";
    const entry = await authenticate(token, store, config);

    if (!entry) {
      return page(
        "Link unavailable",
        "<p>This private link is invalid or the review has been removed. Open the original review notification in the office inbox.</p>",
        404,
      );
    }

    const now = dependencies.now ?? Date.now();
    const expired = entry.expires <= now;
    const actionPath = `/api/reviews/moderate?token=${encodeURIComponent(token)}`;
    const form = (action: string, label: string) =>
      `<form method="post" action="${escape(actionPath)}"><input type="hidden" name="version" value="${escape(entry.etag)}"><button name="action" value="${action}">${label}</button></form>`;

    if (request.method === "POST") {
      const privateNativeForm =
        request.headers.get("origin") === "null" &&
        request.headers.get("sec-fetch-site") === "same-origin" &&
        (request.headers.get("host") ?? new URL(request.url).host) === new URL(config.origin).host;

      if (!isTrustedContactOrigin(request) && !privateNativeForm)
        return page("Request blocked", "<p>Please reopen the email link and try again.</p>", 403);

      if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded"))
        return page("Invalid request", "<p>Use the buttons on the review page.</p>", 415);

      const reader = request.body?.getReader();
      let body = "";
      let bytes = 0;

      if (reader) {
        while (true) {
          const chunk = await reader.read();

          if (chunk.done) {
            break;
          }

          bytes += chunk.value.byteLength;

          if (bytes > 4096) {
            await reader.cancel();
            return page("Invalid request", "<p>Request too large.</p>", 413);
          }

          body += new TextDecoder().decode(chunk.value);
        }
      }

      const data = new URLSearchParams(body);
      const action = data.get("action");

      if (action === "renew") {
        if (!(dependencies.limit ?? allowContactAttempt)(`review-renew:${entry.review.id}`))
          return page("Please wait", "<p>Try again in ten minutes.</p>", 429);

        const delivery =
          dependencies.config === undefined ? getContactConfig() : dependencies.config;

        if (!delivery) {
          return page("Email unavailable", "<p>Please try again later.</p>", 503);
        }

        await sendModerationEmail(
          delivery,
          `A fresh private review management link was requested. It expires in 30 days. Keep it private.\n\n${moderationUrl(entry.review, store, config, Math.floor(now / 600000) * 600000)}\n\nOpening this link does not publish anything.`,
          `abead-review-renew/${entry.review.id}/${Math.floor(now / 600000)}`,
          dependencies.fetcher,
        );

        return page(
          "New link sent",
          "<p>A fresh link has been sent to the office inbox. This review has not changed.</p>",
        );
      }

      if (expired) {
        return page(
          "Link expired",
          `<p>Request a fresh link sent only to the office inbox.</p>${form("renew", "Email me a fresh link")}`,
          410,
        );
      }

      if (data.get("version") !== entry.etag) {
        return page(
          "Review changed",
          `<p>This form is out of date. Reload before making another decision.</p><a href="${escape(actionPath)}">Reload review</a>`,
          409,
        );
      }

      const status =
        action === "publish"
          ? "published"
          : action === "reject"
            ? "rejected"
            : action === "unpublish"
              ? "unpublished"
              : null;

      if (!status || (status === "unpublished" && entry.review.status !== "published"))
        return page("Invalid action", "<p>Reload the review and use its buttons.</p>", 400);

      if (status === "published" && !entry.review.permissionToPublish) {
        return page(
          "Publication not permitted",
          "<p>The author did not give publication permission. This feedback must stay private.</p>",
          403,
        );
      }

      const updated = await store.update(
        { ...entry.review, status, updatedAt: Math.max(now, entry.review.updatedAt + 1) },
        entry.etag,
      );

      if (!updated) {
        return page(
          "Review changed",
          `<p>Another decision was saved first. Reload to see the current status.</p><a href="${escape(actionPath)}">Reload review</a>`,
          409,
        );
      }

      return new Response(null, {
        status: 303,
        headers: {
          Location: actionPath,
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
    }

    if (expired) {
      return page(
        "Link expired",
        `<p>For privacy, management links expire after 30 days. A fresh link will go only to the configured office inbox.</p>${form("renew", "Email me a fresh link")}`,
        410,
      );
    }

    const review = entry.review;

    return page(
      "Review this submission",
      `<p class="note">Keep this link private. Anyone with it can manage this review. Opening it makes no changes.</p><p class="status">Status: ${escape(review.status)}</p><h2>${escape(review.displayName)} · ${review.rating}/5 stars</h2><blockquote>${escape(review.text)}</blockquote><p>Publication permission: <strong>${review.permissionToPublish ? "Yes" : "No — private feedback only"}</strong></p><p>Apply the same authenticity and privacy checks to every rating. Do not publish confidential details. To correct wording, obtain a new submission from the author.</p>${review.status === "published" ? form("unpublish", "Unpublish review") : `${review.permissionToPublish ? form("publish", "Publish review") : ""}${form("reject", "Reject / keep private")}`}<hr><p class="note">Save the original notification to return here later. To change or withdraw permission, use Unpublish first. Reviews update on the next homepage load without a build.</p>${form("renew", "Email me a fresh link")}<a href="/#reviews">View public reviews</a>`,
    );
  } catch {
    return page(
      "Could not complete request",
      "<p>No change is confirmed. Reopen your link to check its status, or try again later.</p>",
      503,
    );
  }
}
