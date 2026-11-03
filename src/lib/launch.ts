/** A missing production domain must never become a made-up canonical URL. */
export function parsePublishedOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    if (
      !url.hostname.includes(".") ||
      /(^|\.)(localhost|example\.(com|org|net)|invalid)$/.test(url.hostname) ||
      /^\d+(\.\d+){3}$/.test(url.hostname)
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

/** Only redirect the alternate www hostname; never redirect local QA or preview hosts. */
export function canonicalRedirects(originValue: string | undefined, published: boolean) {
  const origin = parsePublishedOrigin(originValue);

  if (!published || !origin) {
    return [];
  }

  const host = new URL(origin).hostname;
  const alternate = host.startsWith("www.") ? host.slice(4) : `www.${host}`;

  return [
    {
      source: "/:path*",
      has: [{ type: "host" as const, value: alternate.replace(/\./g, "\\.") }],
      destination: `${origin}/:path*`,
      permanent: true,
    },
  ];
}

export function placeholderFindings(value: string) {
  const rules = [
    ["example-domain", /\b(?:[a-z0-9._%+-]+@)?(?:www\.)?xyz\.ca\b/i],
    ["lorem", /\blorem(?:\s+ipsum)?\b/i],
    ["draft-token", /\[(?:CONFIRM|PLACEHOLDER):|\{\{\s*[a-z][a-z0-9_.]*\s*\}\}/i],
    ["sample-review", /not a real client review|illustrative reviews|sample reviewer/i],
    ["portrait-placeholder", /portrait placeholder|photo to be supplied/i],
  ] as const;

  return rules.filter(([, pattern]) => pattern.test(value)).map(([name]) => name);
}
