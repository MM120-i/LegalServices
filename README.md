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
- Labelled portrait placeholder and fictional preview testimonials; no fake review ratings or success claims.
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

The canonical redirect is conditional on a valid HTTPS `NEXT_PUBLIC_SITE_URL` and `SITE_PUBLISHED=true`. Hosting must handle HTTPS/certificates for both www and non-www. `GOOGLE_SITE_VERIFICATION` optionally adds a public Search Console verification token; Domain properties use DNS verification. GA4 activation remains pending client-owned account details and privacy/consent decisions.

At each phase checkpoint, update `docs/CLIENT-REQUIREMENTS.md` with all remaining client dependencies; do not mark a phase complete merely because its preparation is finished.
