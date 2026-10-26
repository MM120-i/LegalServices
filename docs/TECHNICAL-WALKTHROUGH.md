# How the website works

This is a Next.js App Router application written in TypeScript, with Tailwind CSS available for utility classes and a shared CSS design system. It is a website with one small server endpoint, not a client portal or database application.

## 1. The browser gets a prepared page

Most page content is generated during `npm run build`. A visitor receives useful HTML immediately, rather than waiting for JavaScript to fetch and assemble the text. This keeps the site fast and makes its content available to search engines and assistive technology.

`src/app/page.tsx` is the custom homepage. `src/app/[...slug]/page.tsx` handles the other known URLs. Its `generateStaticParams()` function tells Next.js which pages to prepare. Unknown URLs return the custom 404.

```tsx
export function generateStaticParams() {
  return pageDrafts
    .filter((page) => page.route.startsWith("/") && page.route !== "/")
    .map((page) => ({ slug: page.route.slice(1).split("/") }));
}
```

For example, the traffic-ticket URL becomes a pair of path segments: `['practice-areas', 'traffic-tickets-provincial-offences']`. One reusable layout handles the service pages, while About, Contact, and policy pages have layouts suited to their content.

## 2. Content is separate from layout

The Phase 1 Markdown and metadata CSV remain editable review sources. `npm run content:sync` converts them into typed records in `src/content/generated.ts`. TypeScript describes the expected shape of a page so missing fields and incorrect data types are caught during development.

Business contact information is centralized in `src/config/site.ts`. Generated copy refers to facts through tokens such as `{{phone.primary}}`; `resolveCopy()` replaces them with the configured value. The application does not invent an email address or office hours when one is missing.

The interior renderer filters out editorial notes and unconfirmed drafting instructions. It uses a small Markdown renderer that builds React elements, rather than injecting arbitrary HTML into the page. Reviews are explicit fictional samples, and the portrait is a visibly labelled placeholder. A client review is still needed before publication.

Short promotional copy for the homepage and service-card summaries lives with those presentation components and in `src/content/services.ts`. Editing a long service-page draft does not automatically rewrite every short marketing summary.

## 3. Shared components keep the design consistent

`SiteHeader`, `SiteFooter`, `PracticeGrid`, `LocationSection`, and `CTABand` are reusable pieces. A change to the shared contact section can update several pages together. CSS variables define the forest-green, ivory, and sage palette; media queries switch the layout into stacked columns on smaller screens.

The site uses system fonts, so reading the page does not depend on a font download. The Toronto photograph is local and uses Next.js image optimization with an explicit aspect container and responsive sizes. The map loads lazily and the address remains usable even if the map fails.

The header menu and form are Client Components because they respond to browser actions. Most page content stays in Server Components, which means the browser does not need all the content-processing code. FAQs use native `<details>` elements and work without JavaScript. A mobile navigation fallback and native form POST are also included.

## 4. The form has a browser side and a server side

The browser validates for convenience, then posts to `/api/contact`. The API validates again because browser-side checks can be bypassed. The request path is:

```text
Contact form → POST /api/contact → validation → spam/abuse checks
             → Resend delivery API → accepted response → thank-you page
```

The server sends an office notification and, if the visitor provided an email, a short acknowledgement without repeating the case description. Credentials are read on the server from `.env.local`; they are not put in browser JavaScript.

The handler bounds message/body sizes, checks request origin, uses a honeypot, and limits repeated attempts. Its current limiter is in memory. A public multi-instance deployment needs host-level or shared rate protection; it should not rely on a single process’s counters.

A success response means the email service accepted the request. It does not prove that an inbox received or read it. Failures keep the form values and show the real phone numbers. Retries with the same browser submission ID use a provider idempotency key to reduce duplicate email sends.

No delivery credentials are supplied yet. The preview clearly says so, and a submitted request receives an unavailable response instead of fake success. Provider tests use mocked responses; real inbox delivery remains to be verified.

## 5. SEO is built in, but indexing is off

Each page has its own title and description. JSON-LD supplies business information and FAQs; FAQ answers come from the same sanitized content shown on the page. Sample reviews never become rating markup. The sitemap excludes the thank-you page.

Publication requires both `SITE_PUBLISHED=true` and a valid `NEXT_PUBLIC_SITE_URL`. Until then, the preview uses noindex metadata, robots blocks crawling, and the sitemap is empty. Do not enable publication while dummy reviews, unapproved service claims, or unfinished policies remain.

## 6. What the checks establish

`npm run check` runs content checks, contact-handler tests, TypeScript, and ESLint. `npm run build` verifies that Next.js can generate the site and compile the API. `npm run pages:check` inspects generated page HTML for missing content, duplicate metadata, drafting-text leaks, invalid structured data, and preview indexing errors.

Browser checks exercise responsive navigation, real form validation, missing-configuration failure handling, and service-page rendering. They do not replace a complete accessibility audit, client scope approval, real-device testing, or real email-delivery tests.
