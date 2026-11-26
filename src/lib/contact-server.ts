import { createHash, randomBytes, randomUUID } from "node:crypto";
import { site } from "../config/site.ts";
import { contactTopics, isEmail, validateContact } from "./contact.ts";
import type { ContactInquiry, ContactResult } from "./contact.ts";

interface DeliveryConfig {
  apiKey: string;
  to: string;
  from: string;
}

interface Dependencies {
  config?: DeliveryConfig | null;
  fetcher?: typeof fetch;
  limit?: (identity: string) => boolean;
}

export function getContactConfig(): DeliveryConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();

  // Require plain addresses; the display name is added by the server, never the visitor.
  return apiKey && to && from && isEmail(to) && isEmail(from) ? { apiKey, to, from } : null;
}

export function isContactConfigured(): boolean {
  return getContactConfig() !== null;
}

function parseOrigin(value: string): URL | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
      ? url
      : null;
  } catch {
    return null;
  }
}

/** Next may reconstruct Request.url with its bind address instead of the browser's host.
 * Compare the browser Origin with the direct Host authority as well. Forwarded headers
 * are intentionally ignored; proxies that rewrite Host must configure explicit origins.
 */
export function isTrustedContactOrigin(request: Request, configuredOrigins?: string[]): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }

  const header = request.headers.get("origin");

  // Non-browser clients may omit Origin. This endpoint is public, not authenticated.
  if (!header) {
    return true;
  }

  const origin = parseOrigin(header);

  if (!origin) {
    return false;
  }

  const requestUrl = new URL(request.url);

  if (origin.origin === requestUrl.origin) {
    return true;
  }

  const explicit = configuredOrigins ?? [
    process.env.NEXT_PUBLIC_SITE_URL ?? "",
    ...(process.env.CONTACT_ALLOWED_ORIGINS ?? "").split(","),
  ];

  if (explicit.some((value) => parseOrigin(value.trim())?.origin === origin.origin)) {
    return true;
  }

  const host = request.headers.get("host");

  if (!host || host !== origin.host) {
    return false;
  }

  // Match the request scheme normally. A browser-attested same-origin HTTPS request
  // can also reach an HTTP application behind TLS termination without trusting XFH/XFP.
  return (
    origin.protocol === requestUrl.protocol ||
    (origin.protocol === "https:" && fetchSite === "same-origin")
  );
}

/** Baseline per-process limit. It deliberately ignores caller-controlled forwarding headers.
 * Use a host-level or durable distributed rate limiter before public production traffic.
 * Only salted hashes and counts are retained in memory, never inquiry text/contact details.
 */
const salt = randomBytes(32).toString("hex");
const windowMs = 10 * 60 * 1000;
let windowStart = 0;
let totalAttempts = 0;
const attempts = new Map<string, number>();

export function allowContactAttempt(identity: string, now = Date.now()): boolean {
  if (now - windowStart >= windowMs) {
    attempts.clear();
    totalAttempts = 0;
    windowStart = now;
  }

  const key = createHash("sha256").update(salt).update(identity).digest("hex");
  const count = attempts.get(key) ?? 0;

  if (count >= 3 || totalAttempts >= 30) {
    return false;
  }

  attempts.set(key, count + 1);
  totalAttempts += 1;

  return true;
}

function emailPayload(inquiry: ContactInquiry, config: DeliveryConfig) {
  const topic = contactTopics.find((item) => item.value === inquiry.topic)!.label;

  const notification = {
    from: `${site.business.name} <${config.from}>`,
    to: [config.to],
    ...(inquiry.email ? { reply_to: inquiry.email } : {}),
    subject: `New website inquiry — ${topic} — ${inquiry.name}`,
    text: [
      `Name: ${inquiry.name}`,
      `Phone: ${inquiry.phone}`,
      `Email: ${inquiry.email || "Not provided"}`,
      `Service: ${topic}`,
      "",
      "Brief description:",
      inquiry.message || "Not provided",
      "",
      "The visitor acknowledged that this inquiry does not create a paralegal–client relationship or protect a deadline.",
    ].join("\n"),
  };

  if (!inquiry.email) {
    return [notification];
  }

  const acknowledgement = {
    from: `${site.business.name} <${config.from}>`,
    to: [inquiry.email],
    reply_to: config.to,
    subject: `Your inquiry to ${site.business.name}`,
    // Do not repeat sensitive case details in the automatic acknowledgement.
    text: [
      "Thank you for getting in touch. Your website inquiry has been received for review.",
      "This automated acknowledgement does not mean that the practice has accepted your matter or will take action on your behalf.",
      `If you have an approaching deadline, call ${site.phones.primary.display} or ${site.phones.office.display}.`,
      "Do not send sensitive documents in reply until the office confirms how to share them.",
      "",
      site.business.name,
    ].join("\n\n"),
  };

  return [notification, acknowledgement];
}

export async function handleContact(
  request: Request,
  dependencies: Dependencies = {},
): Promise<Response> {
  const json = request.headers.get("accept")?.includes("application/json") ?? false;

  const respond = (
    status: number,
    result: ContactResult,
    extraHeaders: Record<string, string> = {},
  ) => {
    if (json) {
      return Response.json(result, {
        status,
        headers: { "Cache-Control": "no-store", ...extraHeaders },
      });
    }

    if (result.ok) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/thank-you", "Cache-Control": "no-store" },
      });
    }

    const text = `${result.message} Call ${site.phones.primary.display} or ${site.phones.office.display}. Return to the contact page to try again.`;

    // Plain text is a safe, accessible fallback for a native no-JS form POST.
    return new Response(text, {
      status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        ...extraHeaders,
      },
    });
  };

  if (!isTrustedContactOrigin(request)) {
    return respond(403, {
      ok: false,
      message: `Please submit this form from the ${site.business.shortName} website.`,
    });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (
    !contentType.startsWith("application/json") &&
    !contentType.startsWith("application/x-www-form-urlencoded") &&
    !contentType.startsWith("multipart/form-data")
  ) {
    return respond(415, {
      ok: false,
      message: "Please use the consultation form to send an inquiry.",
    });
  }

  // Enforce the byte limit while streaming, rather than trusting Content-Length.
  const maximumBytes = 16 * 1024;
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;

  if (reader) {
    try {
      while (true) {
        const chunk = await reader.read();

        if (chunk.done) {
          break;
        }

        bytes += chunk.value.byteLength;

        if (bytes > maximumBytes) {
          await reader.cancel();
          return respond(413, {
            ok: false,
            message: "That message is too large. Please keep your inquiry brief.",
          });
        }

        chunks.push(chunk.value);
      }
    } catch {
      return respond(400, {
        ok: false,
        message: "The request could not be read. Please try again.",
      });
    }
  }

  const body = new Uint8Array(bytes);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }

  let input: Record<string, unknown>;

  try {
    const parsedRequest = new Request(request.url, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    });

    if (contentType.startsWith("application/json")) {
      const value: unknown = await parsedRequest.json();

      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Invalid object");

      input = value as Record<string, unknown>;
    } else {
      const data = await parsedRequest.formData();
      input = Object.fromEntries(data.entries());
    }
  } catch {
    return respond(400, { ok: false, message: "Please check your form and try again." });
  }

  // Honeypot submissions are rejected without claiming the inquiry was sent.
  if (typeof input.website === "string" && input.website.trim())
    return respond(400, { ok: false, message: "Please check your form and try again." });

  const validated = validateContact(input);

  if (!validated.ok) {
    return respond(422, {
      ok: false,
      message: "Please check the highlighted fields.",
      errors: validated.errors,
    });
  }

  const config = dependencies.config === undefined ? getContactConfig() : dependencies.config;

  if (!config) {
    if (dependencies.config === undefined) {
      const missingOrInvalid = [
        !process.env.RESEND_API_KEY?.trim() ? "RESEND_API_KEY" : null,
        !isEmail(process.env.CONTACT_TO_EMAIL?.trim() ?? "") ? "CONTACT_TO_EMAIL" : null,
        !isEmail(process.env.CONTACT_FROM_EMAIL?.trim() ?? "") ? "CONTACT_FROM_EMAIL" : null,
      ].filter(Boolean);

      console.error("Contact delivery configuration unavailable", { missingOrInvalid });
    }

    return respond(503, {
      ok: false,
      message: "Online delivery is not configured in this preview. Please call the office instead.",
    });
  }

  const limit = dependencies.limit ?? allowContactAttempt;

  if (!limit(validated.value.phone.replace(/\D/g, ""))) {
    return respond(
      429,
      { ok: false, message: "Please wait a little before trying again, or call the office." },
      { "Retry-After": "600" },
    );
  }

  const id =
    typeof input.submissionId === "string" && /^[a-f\d-]{36}$/i.test(input.submissionId)
      ? input.submissionId
      : randomUUID();

  const payload = emailPayload(validated.value, config);

  try {
    const response = await (dependencies.fetcher ?? fetch)("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `lexora-inquiry/${id}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error("Delivery provider rejected the request");
    }

    const result: unknown = await response.json();

    if (
      !result ||
      typeof result !== "object" ||
      !("data" in result) ||
      !Array.isArray(result.data) ||
      result.data.length !== payload.length ||
      !result.data.every(
        (item: unknown) =>
          item && typeof item === "object" && "id" in item && typeof item.id === "string",
      )
    ) {
      throw new Error("Delivery was not acknowledged");
    }

    return respond(200, { ok: true, message: "Your inquiry has been sent for review." });
  } catch {
    // Do not log messages, provider payloads, addresses, or credentials.
    return respond(502, {
      ok: false,
      message:
        "We could not confirm that your inquiry was sent. Please call the office, or try again using the same form.",
    });
  }
}
