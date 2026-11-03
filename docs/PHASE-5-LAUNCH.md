# Phase 5 — launch preparation and execution record

Updated November 2, 2026. **Status: local preparation implemented; launch blocked on client details and Phase 4 acceptance.** No site, domain, Google property, or Business Profile has been published or changed. Phase 4 sign-off remains outstanding; the user has authorized independent Phase 5 preparation in parallel.

## Prepared locally

- [x] Conditional canonical-host permanent redirect. `NEXT_PUBLIC_SITE_URL` selects www or non-www. Only the alternate hostname matches; local and unrelated preview hosts are not redirected. The rule is disabled unless `SITE_PUBLISHED=true` and a valid HTTPS origin is configured. Paths are preserved; confirm query strings and redirect chains on the selected host at launch.
- [x] Existing canonical metadata, sitemap/robots, and thank-you noindex behavior retained.
- [x] Optional `GOOGLE_SITE_VERIFICATION` metadata for a URL-prefix property; no token configured. Domain-property verification uses Google's DNS record instead.
- [x] `npm run launch:check` scans source and rendered build output for known draft domains, lorem text, drafting tokens, fictional testimonials, and portrait placeholders. It checks domain/publication/email readiness and saves `artifacts/launch/readiness.json` without printing credentials.
- [x] Focused redirect and placeholder-scanner tests in `tests/launch.test.ts`, included in `npm test`.
- [x] Google setup sequence, measurement contract, mobile-data checks, and rollback steps prepared below.

The readiness check is deliberately expected to fail on the current preview. It does not replace client approval, validate credentials, contact a provider, certify current build environment settings, or deploy anything. A zero-finding result would still require every manual check listed in the report.

## Placeholder inventory and removal

The current preview intentionally still has sample reviews, a portrait placeholder, and missing business facts. Client-approved replacements or approved omission are required. The scan reports source findings separately from rendered findings so hidden editorial content is not mistaken for displayed copy.

`src/content/generated.ts` is generated from `content/phase-1/`; correct the authoritative Markdown, then run `npm run content:sync`. Do not edit generated content directly. Remove obsolete draft-domain references and unresolved notes from shipping source once approved facts exist. Source scanning includes comments and generated editorial records, so findings must be reviewed rather than blindly replaced. Test fixtures, QA specimens, and historical documentation are not shipping website copy and intentionally retain examples; legitimate HTML form hint attributes are not placeholder business claims.

For a final candidate:

```sh
npm run check
npm run build
npm run launch:check
```

Build with the actual intended environment first. For an isolated build, set `LAUNCH_BUILD_DIR` to its output directory for the scanner. Keep `SITE_PUBLISHED=false` on the current preview; do not enable publication merely to silence a blocker. Also manually review rendered copy and assets for examples the scanner's known patterns may miss.

## Domain and HTTPS — pending client and hosting choice

1. Confirm the client's domain, preferred www/non-www origin, hosting project, and authorized DNS access. Record existing DNS before making changes; preserve email records.
2. Attach both domain variants to the selected host. Use that host's actual DNS instructions, not guessed record values.
3. Ensure TLS certificates cover both hostnames and enforce HTTP-to-HTTPS at the hosting layer. The application redirect is not a replacement for TLS or host-level HTTPS enforcement.
4. Configure the canonical HTTPS origin and privately configure real email delivery. Keep previews noindexed.
5. After approved content, written sign-off, and candidate checks, authorize the production release. Confirm one consistent final HTTPS origin, expected redirects without loops, canonical URLs, robots, sitemap, and continued thank-you noindex.

## Google Search Console — prepared, not submitted

1. Use a client-owned Google account/property and delegated access. A Domain property requires DNS verification; alternatively use a URL-prefix property with the configured meta token.
2. Verify ownership using Google's actual issued record/token. Do not request account passwords or store credentials in this repository.
3. Once the approved site is live and crawlable, submit the canonical `/sitemap.xml` in the Sitemaps report.
4. Inspect the canonical Home URL and request indexing where available; record the property, submitted sitemap, request date, and result.
5. Recheck exclusions/errors later. Submission and an indexing request do not guarantee indexing or rich-result display.

Sources: [ownership verification](https://support.google.com/webmasters/answer/9008080), [Sitemaps report](https://support.google.com/webmasters/answer/7451001).

## GA4 — event contract ready; implementation/activation pending

No analytics script or tracking request has been added. We still need the client-owned property/web stream, measurement ID, approved privacy wording, and consent approach. Implement the collection code after these decisions, then verify receipt in GA4 DebugView/Realtime and the configured key-event reports. Do not treat a local callback or browser network request as proof that GA4 received an event.

| Event            | Trigger                                                             | What it establishes                                         |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `generate_lead`  | One successful API-accepted form submission, once per submission ID | An accepted inquiry, not inbox receipt or a retained client |
| `click_to_call`  | User activates a `tel:` link                                        | Call intent, not a connected call                           |
| `get_directions` | User activates an office directions link                            | Directions intent, not an office visit                      |

Do not emit leads on field validation failure, missing delivery configuration, provider error, duplicate submission, or simply visiting/reloading `/thank-you`. Decide which events become GA4 key events with the client. Keep event parameters to fixed non-sensitive values; never send names, entered phone/email, inquiry text, selected legal matter, or sensitive URL query strings. Test consent rejection/acceptance and client-side navigation to prevent duplicate page views. Do not collect preview/test traffic in the production stream.

Sources: [GA4 recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events), [avoiding personal information](https://support.google.com/analytics/answer/6366371).

## Google Business Profile — pending owner participation

First ask whether a profile already exists and who owns it; avoid creating a duplicate. With the owner's authorization, claim/manage the existing profile or create an eligible one. Confirm real business name, category, address/service model, hours, phones, website, photos, and service descriptions. Begin the verification method actually offered by Google with the owner; do not promise a method or completion date. Record profile URL, verification start date, current status, and any owner action needed. Do not publish sample reviews or invented opening hours.

Google instructs representatives to work directly with the owner for verification. This cannot be honestly marked “in motion” until that process has actually started. Sources: [ownership guidelines](https://support.google.com/business/answer/13763036), [verification](https://support.google.com/business/answer/7107242).

## Final live acceptance — pending a real domain and phone

- [ ] Test with Wi-Fi off on a physical phone using mobile data; record date, device, OS/browser, and real URL.
- [ ] Load HTTPS successfully and confirm the intended canonical hostname and alternate-host redirect.
- [ ] Activate each call link and check the number offered by the dialer; do not claim a completed call without testing it.
- [ ] Submit an authorized fictional inquiry and confirm actual inbox receipt and optional acknowledgement. Recheck errors and phone fallback.
- [ ] Load the map, use directions, and confirm the address. Verify usable links if the embed is blocked.
- [ ] Confirm GA4 receipt under the approved consent settings without sending personal/case data.
- [ ] Record sitemap submission, indexing request, and Business Profile verification status separately.

## Rollback and completion

Before release, retain the prior known deployment/configuration and DNS records. If the release fails, restore the prior deployment and relevant settings through the chosen host; verify contact access and redirects again. Avoid speculative DNS changes. A noindex flag alone does not undo publication of unapproved material.

Phase 5 exit criteria remain unmet: the real-domain site is not live, the indexing request is not submitted, and Business Profile verification has not started. Track every client dependency in [CLIENT-REQUIREMENTS.md](CLIENT-REQUIREMENTS.md). Update that file at each phase checkpoint, including when no new client action is needed; record completed items only with evidence.

## Local verification — November 2, 2026

- `npm run check`: passed source tests, TypeScript, and lint. The subsequent JSX-token regression test also passed in `npm run launch:test` (three launch tests total).
- Default Turbopack production build: failed twice because its CSS worker could not bind a local port (`Operation not permitted`), including the elevated retry. This environment limitation remains recorded; the default command was not changed or claimed passing.
- `npm run build -- --webpack`: passed with 22 generated outputs. `npm run pages:check`: passed for the 16 catalog routes, metadata, structured data, and preview protections.
- `npm run launch:check`: correctly returned exit code 1, reporting nine findings across missing production configuration, sample/editorial source, and rendered Home/About placeholders. It scanned 17 HTML files, including framework error output. See `artifacts/launch/readiness.json`. Detection patterns are excluded from scanning themselves; JSX object literals are covered by a regression test.
- No live HTTPS, Google verification/submission, GA4 collection, Business Profile changes, actual inbox delivery, or mobile-data acceptance was performed. Those remain pending, not passed.

This is a preparation checkpoint, not Phase 5 completion. The client requirements file was updated with all launch dependencies.
