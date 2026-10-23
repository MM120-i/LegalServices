# Lexora Legal Services

Next.js App Router + TypeScript + Tailwind CSS. Current scope: project initialization and Phase 1 content only.

## Run locally

Use Node.js 22.18+ and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The root page is a plain project-status screen, not the proposed website homepage. All pages are currently marked `noindex, nofollow`. No form, analytics, maps, external fonts, or other integrations are connected.

## Work with the Phase 1 content

1. Edit the review drafts in `content/phase-1/` (start with its `README.md`).
2. Edit page titles and descriptions in `content/phase-1/06-metadata.csv`.
3. Run `npm run content:sync` to regenerate `src/content/generated.ts`.
4. Run `npm run check` and `npm run build`.

Do not edit the generated TypeScript directly. The sync check detects changes that have not been regenerated. Page drafts expose route, H1, sections, typed blocks, FAQs, metadata, source path, and draft status. Shared copy includes form acknowledgement email text, navigation/footer text, and the common CTA.

`src/content/index.ts` exports `getPageDraft` and `resolveCopy`. Business facts in generated copy use `{{…}}` tokens resolved from `src/config/site.ts`; change business details there for the application. The Markdown review files retain the originally supplied wording for editorial review. Changes to those factual literals in the Markdown should be coordinated with the token mapping in `scripts/sync-content.mjs`.

Editorial notes and placeholder blocks remain explicit. Some copy blocks also contain inline `[CONFIRM: …]` markers. These are draft records for later page implementation, not content that should be rendered wholesale as approved public copy. The future UI should draw from the approved content and retain visible sample labels in any private preview.

## Business facts and missing information

`src/config/site.ts` contains the supplied name, principal, credentials, phones, and address. They are not independently verified. Unknown facts remain `null`; no contact email, domain, office hours, consultation model, or languages have been invented.

See `content/phase-1/07-review-and-placeholders.md` for the review checklist and `08-sources.md` for legal-reference notes. The three sample testimonials are explicitly fictional private-preview content. Asset placeholders describe missing imagery; no portrait is represented as the real principal.

## Checks

```sh
npm run content:check
npm run typecheck
npm run lint
npm run build
```

The content check verifies all 16 planned route records, unique metadata and character budgets, internal route references, business-token resolution, service FAQs, preserved review notes, and labels on dummy testimonials. These are content records; only `/` is implemented as an app page at this stage.

The root page is statically prerendered by Next.js. Run `npm run build` followed by `npm start` to serve a local production build. No hosting, DNS, accounts, or deployment has been configured.

## Scope boundary

Included: project tooling, minimal server-rendered app shell, centralized facts, typed content catalog, FAQs and metadata, content checks.

Pending authorization: visual design/tokens/fonts, actual website page layouts and navigation, imagery, all service-page routes, working intake form, maps, analytics, schema generation, sitemap, production metadata, deployment, and launch review.
