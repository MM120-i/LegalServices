# Client review feature — local QA, November 26, 2026

Nothing was pushed, deployed or sent to a real inbox during this work.

## Passed

- Production build and `npm run check`: content, existing contact behavior, shared validation, review server cases, TypeScript and lint.
- Six review server tests cover all five ratings, private/public permission choices, malformed input, origin/honeypot/byte limits, rate limits, unavailable configuration, provider rejection, native submission, idempotency and no automatic publication. All delivery is mocked.
- Browser review test at 360, 390, 768, 1440 and 2560px: no horizontal page overflow, minimum 44px touch labels/controls, Enter/Space disclosure, arrow-key native rating controls, no preselected rating or publication permission, validation, disabled sending state, retained text, focused failure message, retry idempotency and honest success message. Native-submission behavior is tested separately at the server.
- Rendered links and SEO checks across 15 content routes, plus existing 404 status/title checks. No Review/AggregateRating schema was added.
- The review link is present on all content-page footers and on the 404 page after browser hydration.
- The fictional testimonial quotes have been removed from the homepage and its generated content source.

## Existing failed check, outside review feature

`tests/footer.test.mjs` still fails its raw-HTML assertion for unknown URLs: the installed Next.js version returns an HTTP 404 error shell with the shared layout populated after client hydration. The browser confirms the review footer link appears, and HTTP 404/title are correct. No-JavaScript visitors to an unknown URL are affected. No routing/framework changes were retained while implementing reviews; track this independently. All 15 known content-page footer assertions pass before that assertion.

## Pending client / maintainer

- Confirm one real review notification reaches the Zoho inbox, and check the recorded publication choice. Automated mocks cannot establish delivery.
- Approve the form/privacy copy and office moderation, retention and withdrawal process.
- Supply genuine approved review text, rating and display name, with author permission retained privately. `src/content/reviews.ts` intentionally starts empty.
- The maintainer publishes approved records in batches. There is no owner dashboard or automatic publication in this version, as selected by Mahim.

## Not tested

Physical iOS/Android and desktop Safari. Screenshots and touch emulation use installed Chromium-based Edge. No live provider email, Netlify account mutation, push or deployment was performed.

## Evidence

- `results.json`: browser case results.
- `reviews-360.png`, `reviews-390.png`, `reviews-768.png`, `reviews-1440.png`, `reviews-2560.png`: section and disclosure at each width.
- `form-390.png`, `form-1440.png`: full form captures; rating 4 is selected only for these screenshots. Nothing was submitted.

Research, implementation details and the office/maintainer handoff are in the project's README under Client reviews. Client dependencies were consolidated in docs/CLIENT-REQUIREMENTS.md.
