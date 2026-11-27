# Abead Legal Services Professional Corporation

Responsive paralegal-practice website built with Next.js App Router, TypeScript, and Tailwind CSS. Phases 1–3 are implemented locally. Phase 4 local QA and client-review preparation are implemented; client approval is pending. This is a private development preview, not a launched business website.

## Run

Use Node.js 22.18+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production-mode local preview:

```sh
npm run build
npm start
```

## What is included

- Custom ivory/forest-green homepage, shared header/footer, accessible mobile navigation, sticky phone/directions/contact actions.
- About, practice-area overview, six service pages, Notary, Contact, policy pages, thank-you, and custom 404.
- Labelled portrait placeholder and genuine-review submission/moderation workflow; no fictional public testimonials or rating markup.
- Shared content templates, native FAQs, local optimized image, lazy map, phone/directions links.
- Consultation form and server API with validation, errors, native no-JS fallback, and Resend delivery adapter.
- Page metadata, business/FAQ/breadcrumb JSON-LD, OG image, favicon, preview robots and sitemap rules.

## Content and configuration

Business facts: `src/config/site.ts`. Missing facts remain null. Design palette, typography, responsive rules: `src/app/globals.css`. Service cards: `src/content/services.ts`.

Edit long-form content in `content/phase-1/` and metadata in its CSV, then run:

```sh
npm run content:sync
```

Do not edit `src/content/generated.ts` directly. Editorial instructions and unresolved brackets are filtered out of visitor-facing long-form content. Short homepage and card copy is maintained in its presentation components. Check all copy changes with the client before publication.

## Email configuration

The consultation form uses Resend to send office notifications to `info@abeadlegalservices.ca`. When a visitor supplies an email, the office can reply directly and the visitor receives an acknowledgement.

1. Verify `notify.abeadlegalservices.ca` as a sending domain in Resend using the DNS records it provides. Keep the mailbox provider's existing DNS records for `abeadlegalservices.ca` in place.
2. In Netlify's environment variables, set `CONTACT_TO_EMAIL=info@abeadlegalservices.ca`, `CONTACT_FROM_EMAIL=website@notify.abeadlegalservices.ca`, and `RESEND_API_KEY` to a Resend sending key scoped to the verified subdomain. Use the intended deploy context and include Builds and Functions if Netlify offers scope selection. Store the key privately.
3. Redeploy so the Contact page and its API pick up the configuration. Submit the three sample inquiries in the client checklist and confirm receipt and Reply behavior.

For local setup, copy `.env.example` to `.env.local`. Keep the API key blank for ordinary preview work. Never prefix the key with `NEXT_PUBLIC_`.

Without these values the form shows an explicit preview notice and rejects delivery with a phone fallback. No emails are sent by the automated tests. A provider acceptance response is not a delivery receipt; test the real inbox before launch.

The baseline rate limiter is per process. Configure host-level or distributed rate protection before a public deployment with multiple instances. No case-file database or upload feature exists.

## Verification

Automated test cases live in `tests/` and use Node’s built-in test runner:

- `content.test.ts`: content routes, metadata, links, FAQs, and placeholder labels.
- `contact.test.ts`: validation, mocked delivery, native form fallback, and failure paths.
- `pages.test.mjs`: generated HTML, metadata, structured data, and preview indexing.

`scripts/` contains operational utilities. Assertions and test scenarios remain in `tests/`, including the local browser fixture in `tests/fixtures/`.

```sh
npm test
npm run check
npm run build
npm run pages:check
```

`npm test` runs the content and contact tests. `npm run check` adds TypeScript and ESLint. Built-page tests require a completed build and run separately with `npm run pages:check`.

Formatting: `npm run format` covers source, scripts, tests, and documentation. Generated content is excluded from formatting so the sync check stays deterministic. Preserve intentional blank lines between logical steps and follow the conventions in `AGENTS.md`.

## Phase 4 QA

```sh
npm run qa:checks
npm run qa:lighthouse
```

`qa:checks` runs the source tests, TypeScript, and ESLint, then builds and checks separate preview and launch-mode candidates. Both servers bind to loopback and explicitly disable email delivery. The launch test uses the reserved origin `https://qa.lexora.test`; it does not change your environment files, publish anything, or resolve that domain. Output goes into `.next-qa-preview` and `.next-qa-launch`.

`qa:lighthouse` requires the launch QA build from `qa:checks` and installed Microsoft Edge at its standard macOS path. Set `CHROME_PATH` to another installed Chromium executable if needed. It runs three mobile audits each for Home, Contact, and Small Claims, retaining individual HTML/JSON reports and median scores. It fails when median Performance is below 90, Accessibility is below 100, or launch SEO is below 100. It also fails on confirmed logo-name, contrast, touch-target, or link-name audit failures even if the category score is 100. Stop other intensive tasks during measurement.

`npm run qa` runs both commands in order. Summaries and browser/validator evidence are in `artifacts/qa/`; large raw Lighthouse reports remain local under the ignored `artifacts/qa/raw/` directory, grouped by run timestamp. Preserve or export these reports with the candidate being reviewed.

For a quick link/SEO recheck against an already running QA server, use `npm run qa:links`. It defaults to preview at `http://127.0.0.1:3100`; supply `QA_MODE=launch QA_BASE_URL=http://127.0.0.1:3101` for the launch candidate. External reachability checks are included in `qa:checks` and distinguish blocked requests from confirmed bad links.

Browser fixture: run the preview QA server on port 3100, then `node tests/fixtures/form-browser-server.mjs`. Visit port 3102. `QA_FORM_RESULT=success` tests the redirect; the default is a delayed error. `QA_BLOCK_MAP=true` blocks embedded maps to inspect the fallback. This fixture replaces only the local contact response; it cannot prove actual email delivery and is never part of the production application.

Read [the Phase 4 QA report](docs/PHASE-4-QA-REPORT.md), [client review checklist](docs/CLIENT-REVIEW.md), and [code lessons](docs/PHASE-4-CODE-LESSONS.md). Safari, physical devices, inbox delivery, approved business facts, and written sign-off must be resolved before closing Phase 4.

## Publication remains a separate step

`netlify.toml` sets `SITE_PUBLISHED=true` and the canonical origin `https://abeadlegalservices.ca` for production. Deploy Previews and branch deploys use their own environment settings to keep pages noindexed. Netlify also adds a noindex response header to Deploy Previews.

`src/app/robots.ts` always allows crawling and advertises the sitemap. Preview indexing protection uses page metadata and hosting settings. `src/app/sitemap.ts` generates production URLs at build time from the same content catalog used to generate pages, excluding the thank-you page and 404. The thank-you page stays noindexed in production.

Read [the technical walkthrough](docs/TECHNICAL-WALKTHROUGH.md) for a plain-language explanation of the code. Image source and licence are recorded in `public/ASSETS.md`.

## Phase 5 launch preparation

Read [the launch execution record](docs/PHASE-5-LAUNCH.md) and the updated [client requirements](docs/CLIENT-REQUIREMENTS.md). The site has not been launched. Phase 4 acceptance remains pending.

`npm run launch:check` scans the existing build and shipping source, writes `artifacts/launch/readiness.json`, and returns exit code 1 while launch blockers remain. Run a build first; optionally use `LAUNCH_BUILD_DIR` for an isolated build. This command reads `.env.local` without printing credentials. It does not publish, send email, prove client approval, or replace the documented live checks. The current preview is expected to fail because it retains labelled sample material and missing real configuration.

The canonical redirect is conditional on a valid HTTPS `NEXT_PUBLIC_SITE_URL` and `SITE_PUBLISHED=true`. Hosting must handle HTTPS/certificates for both www and non-www. `GOOGLE_SITE_VERIFICATION` optionally adds a public Search Console verification token; Domain properties use DNS verification. GA4 activation requires the client-owned Web stream measurement ID and finalized privacy information.

At each phase checkpoint, update `docs/CLIENT-REQUIREMENTS.md` with all remaining client dependencies; do not mark a phase complete merely because its preparation is finished.

## Remove hosting advertising

Netlify injects its public badge through `/.netlify/scripts/hud?variant=public` at its edge servers. The application layout and repository configuration contain no badge injection.

In the Netlify dashboard, open the project, then **Project configuration → General → Powered by Netlify badge**. Turn the badge **off** and **Save**. The setting applies on the next request without a redeploy. If the toggle is locked, Netlify documents that the Personal or Pro plan enables it. Confirm the available option in the dashboard before making a billing change.

After saving, check the public deployment in a fresh browser session. Confirm the badge and its “build your own site” prompt are absent on Home and Employment & Human Rights, and scroll through the closing CTA to check the full address. A visitor's “Hide this badge” action affects that visitor's browser only.

Reference: https://docs.netlify.com/manage/projects/powered-by-netlify-badge/

## Hero photograph

The locally stored Toronto waterfront photograph is by Mathew Schwartz, sourced from https://unsplash.com/photos/panoramic-photography-of-city-nwtJyl-2iMI under the Unsplash License (https://unsplash.com/license). The original was downloaded for this project on October 23, 2026. It is served as `public/images/toronto-skyline.webp` with explicit dimensions and responsive sizes.


### GA4 and Search Console setup

GA4 was absent before this audit. It remains **not yet activated** because no real client-owned measurement ID was supplied. There is no evidence available here to confirm the private Search Console property or sitemap submission.

1. In the client’s GA4 property, create a Web data stream for `https://abeadlegalservices.ca`. Copy its `G-...` measurement ID.
2. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in the intended Netlify deploy context, then rebuild. Leave it blank on ordinary previews. Use the real ID on an approved preview only when verifying actual receipt.
3. Turn **Enhanced Measurement off** for that stream. The app sends one explicit page_view on initial load and each pathname change. Automatic history pageviews would double-count; no scroll, form, outbound-click or advertising measurement is requested. Google Signals and ad personalization are disabled in code. Page locations exclude query strings and fragments, and referrer is blank so contact form values are not sent.
4. Verify each route and client-side navigation in GA4 Realtime/DebugView, including browser Back. Actual event receipt remains pending access to the real stream. Finalize the privacy policy and retention/consent settings before activation.
5. In Search Console, add the Domain property `abeadlegalservices.ca`. Copy Google’s exact TXT verification value to the authoritative DNS host at `@`; retain existing email records. Click Verify, then submit `https://abeadlegalservices.ca/sitemap.xml`. Alternatively, for a URL-prefix property set `GOOGLE_SITE_VERIFICATION` to the token value and rebuild. Record verification and sitemap receipt in the client handoff.

References: [GA4 pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views), [Search Console ownership verification](https://support.google.com/webmasters/answer/9008080).

Run `npm run qa:mobile` after building `.next-qa-launch` with `NEXT_BUILD_DIR=.next-qa-launch SITE_PUBLISHED=true NEXT_PUBLIC_SITE_URL=https://qa.lexora.test npm run build -- --webpack`. The test uses installed Microsoft Edge with touch-enabled mobile emulation at 360px and 390px, covers all routes including 404, and saves results/screenshots in `artifacts/qa/mobile/`. These checks do not substitute for physical iPhone/Android or Safari testing.


### Contact configuration troubleshooting

The Contact page reads delivery readiness at request time with Next's `connection()` so a build without secrets cannot freeze the disabled notice into the published page. All three settings must be available to the Production Functions runtime. Keep the Netlify settings described above and redeploy after updates.

If submission still returns “Online delivery is not configured”, inspect the Netlify server function logs for `Contact delivery configuration unavailable`. Its `missingOrInvalid` list contains only the names of missing or invalid settings; no credentials, addresses or form contents are logged. Correct those settings and redeploy. A cached-page warning alone does not establish whether a Resend request was made.

Regression: build `.next-qa-launch` without email settings, then run `node --test tests/contact-runtime.test.mjs`. It starts the same build with delivery disabled and with fictional runtime settings and confirms the warning changes without exposing the test key. It sends no email.


### Form validation

`src/lib/contact.ts` is shared by the browser and contact API. Names must be 2–100 characters and use letters/marks and common name punctuation; a surname is not required. Canadian/US phone numbers require 10 digits (optional leading 1); international numbers require + and a country code. Email is optional, but a supplied address must have valid supported syntax. Service selection and consent are required; the optional description is limited to 2,000 characters. These are format checks, not proof of identity, a working phone line, or an existing inbox.

Field errors appear on blur and update when corrected. Invalid submissions are blocked before delivery; server validation also protects native submissions and direct API requests. `npm run contact:check` includes the validation cases in `tests/contact-validation.test.ts`. After building `.next-qa-launch`, run `node --test tests/contact-form-browser.test.mjs` for browser feedback, pending state and retained-input checks. Delivery is intercepted in that browser test; no email is sent.


## Client reviews

The homepage review section follows the process section and precedes FAQs. `/#reviews` is the shareable link; the compact footer includes “Leave a review”. The native “Write a review” disclosure keeps the form collapsed until requested. No extra hosting service, paid widget, account or database is required.

Visitors provide a display name/initials, private email, rating (1–5), review text and confirmation of first-hand experience. Publication permission is a **separate optional checkbox, unchecked by default**. Without it, the submission is private feedback only. Every rating follows the same workflow; there is no low-rating gate or Google redirection.

`POST /api/reviews` validates the request, checks origin, limits request bytes, rejects the honeypot, applies the existing baseline per-process rate limit and emails one plain-text notification to `CONTACT_TO_EMAIL` through Resend. It uses the existing `RESEND_API_KEY` and `CONTACT_FROM_EMAIL`. There is no automatic acknowledgement email. The visitor sees a clear receipt that says the review has not been published. No-JavaScript forms receive a simple confirmation page. Provider failures keep the JavaScript form filled; retries reuse an idempotency key. Delivery acceptance does not prove inbox receipt.

### Office and maintainer workflow

1. The office receives “Website review — pending office approval” in Zoho. That email is the moderation record; it includes the review, rating, display name, private reply address, submission reference and publication choice. Submissions are not saved to the repository, browser storage, server filesystem or a public database.
2. Check genuine first-hand experience and privacy. Apply the same criteria to positive and negative comments. Do not publish private case information, spam or material without permission. Do not materially change the author's words without agreement. Never describe submissions as independently verified merely because they contain an email address.
3. If permission was not granted, treat it as private feedback; ask separately before any publication. If permission was granted, retain that email and the office's written approval in office records. The reviewer can contact the office to change or withdraw permission. A withdrawal must be passed to the maintainer for prompt removal, rather than waiting for a routine batch.
4. Send the maintainer the approved **exact text, rating and display name**. Keep private email addresses and permission evidence out of public source files.
5. The maintainer adds a `PublishedReview` record to `src/content/reviews.ts` with a stable unique `id`, `displayName`, `rating`, `text` and `permissionToPublish: true`. Review the local preview and publish approved changes together in a batch. **No owner dashboard or automatic publishing is included in this version.** Nothing appears until a maintainer updates that catalog and the site is deployed.

The public catalog starts empty. The site shows an honest invitation until actual reviews are approved; sample quotes have been removed from Home and its content source. Reviews are rendered as escaped React text. No Google logo, fabricated star average, client count, `Review` or `AggregateRating` business markup is added. On-site reviews do not automatically become Google Business Profile reviews.

The anti-abuse limit is per server process, as with the existing consultation form. For sustained abuse, add host-level or durable rate protection; this implementation does not introduce new tracking or collect IPs in the review email. Review messages are processed by Resend and stored in the office inbox; the client must finalize retention/privacy handling.

### Research and design rationale

- [Stonegate Legal Services](https://stonegatelegalservices.ca/) puts client quotations in the homepage's content flow, separately from its contact form. We use the established homepage review placement, not a new review-heavy landing page.
- [Shakenovsky & Associates](https://www.rslawyers.com.au/review-request/) offers an on-site testimonial form sent by email for possible later publication. This is the model selected for this implementation.
- [Legal Defenders](https://legaldefenderspc.com/submit-a-law-firm-review-testimonial.html) separates a rating/comments submission from permission to display it. We also separate publication permission and warn against confidential details. The page was available via indexed content during research; direct retrieval was unavailable.
- [Google's review snippet guidance](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) excludes self-serving LocalBusiness/Organization reviews from business review rich results. We retain the existing policy of no self-review rating schema; this feature makes no Google star-ranking promise.

Research checked November 26, 2026. No competitor quotations, ratings, clients or design assets were copied.

Tests: `npm run contact:check` now includes `tests/reviews.test.ts` with mocked delivery. After building `.next-qa-launch`, `node --test tests/reviews-browser.test.mjs` checks the disclosure, form, success/failure, keyboard and mobile behavior with all email POSTs intercepted. No real review or client email is sent by these checks.


Review QA note: the existing raw-HTML footer check for unknown URLs currently fails because Next returns a 404 error shell before hydration (the title/status are correct). Review-page link and SEO checks on the known routes pass. Framework routing experiments were removed from this change; no routing behavior was changed for the review feature. Track this separately from review delivery and publication.
