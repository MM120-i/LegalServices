# Lexora Legal Services

Responsive paralegal-practice website built with Next.js App Router, TypeScript, and Tailwind CSS. Phases 1–3 are implemented locally; this is a private development preview, not a launched business website.

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

Copy `.env.example` to `.env.local`, then supply the Resend API key, verified sender email, and real recipient address. Supply these values before building the production preview so the Contact page can show the configured state. These secrets stay on the server; never prefix them with `NEXT_PUBLIC_`.

Without these values the form shows an explicit preview notice and rejects delivery with a phone fallback. No emails are sent by the automated tests. A provider acceptance response is not a delivery receipt; test the real inbox before launch.

The baseline rate limiter is per process. Configure host-level or distributed rate protection before a public deployment with multiple instances. No case-file database or upload feature exists.

## Verification

Automated test cases live in `tests/` and use Node’s built-in test runner:

- `content.test.ts`: content routes, metadata, links, FAQs, and placeholder labels.
- `contact.test.ts`: validation, mocked delivery, native form fallback, and failure paths.
- `pages.test.mjs`: generated HTML, metadata, structured data, and preview indexing.

`scripts/` contains the content synchronization utility rather than test cases.

```sh
npm test
npm run check
npm run build
npm run pages:check
```

`npm test` runs the content and contact tests. `npm run check` adds TypeScript and ESLint. Built-page tests require a completed build and run separately with `npm run pages:check`.

Formatting: `npm run format` covers source, scripts, tests, and documentation. Generated content is excluded from formatting so the sync check stays deterministic. Preserve intentional blank lines between logical steps and follow the conventions in `AGENTS.md`.

## Publication remains a separate step

The preview stays noindex by default. `SITE_PUBLISHED=true` plus a valid HTTPS `NEXT_PUBLIC_SITE_URL` controls production canonical URLs, crawl rules, and sitemap output. Leave these disabled until the real domain, contact details, policies, service scope, and reviews are approved. Deployment, DNS, Google Business Profile, analytics, and launch approval have not been performed.

Read [the technical walkthrough](docs/TECHNICAL-WALKTHROUGH.md) for a plain-language explanation of the code. Image source and licence are recorded in `public/ASSETS.md`.
