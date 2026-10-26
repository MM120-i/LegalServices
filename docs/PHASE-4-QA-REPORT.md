# Phase 4 — local QA report

Checked October 26, 2026. Deliverable: **tested local candidate prepared for client review**. Phase 4 remains open. No deployment, publication, client communication, real email, or written sign-off occurred.

## Status ledger

| Area                                             | Status                           | Evidence / limit                                                                                                                                                                        |
| ------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source tests, TypeScript, ESLint                 | Passed                           | `npm run check`; 21 named test cases, including three distinct mocked inquiries                                                                                                         |
| Production build and rendered pages              | Passed                           | Build succeeds; 16 outputs including custom 404; unique metadata, one H1 per page, 23 JSON-LD blocks                                                                                    |
| Internal links and anchors                       | Passed                           | HTTP checks across 15 content routes, actual missing-route 404, all internal targets and fragments present                                                                              |
| Telephone links                                  | Passed                           | Both numbers present on every content route, displayed digits match centralized `tel:` values; ownership/currentness awaits client                                                      |
| Directions and external links                    | Passed                           | Both unique Google Maps URLs returned HTTP 200; directions destination matches the configured address                                                                                   |
| Real email / `mailto:`                           | Pending client                   | No real address is configured; placeholder remains unlinked                                                                                                                             |
| Copy and credentials                             | Passed / pending client          | No “Accedent,” unresolved drafting tokens, or editorial instructions in rendered output; credential list matches configured titles verbatim. Biography and scope truth require approval |
| Server form behavior                             | Passed                           | Validation, acknowledgement privacy, optional email, provider failures, unavailable configuration, native POST redirects, rate limiting, and retry idempotency covered by mocks         |
| Browser form behavior                            | Passed                           | Required-field error summary, pending/disabled state, retained inputs, phone fallback, success redirect; duplicate click produced one request                                           |
| Real inbox receipt                               | Pending client                   | Three distinct accepted mocks are not three delivered emails; recipient/provider configuration and human receipt confirmation required                                                  |
| Responsive geometry                              | Passed                           | 64 route/viewport combinations: 16 routes × 360, 390, 768, 1440px; no overflow or short visible controls; footer clears sticky bar                                                      |
| Keyboard interactions                            | Passed                           | Skip-link focus, visible focus, desktop flyout navigation/Escape/focus return, mobile menu/Escape/focus return, native FAQ Enter activation; form error focus verified                  |
| Map failure fallback                             | Passed                           | Test fixture blocked frames; address and directions link remained outside the blocked map and usable                                                                                    |
| Preview indexing protection                      | Passed                           | Preview meta noindex, crawl disallow, no launch sitemap entries/canonicals                                                                                                              |
| Isolated launch SEO                              | Passed                           | Reserved `https://qa.lexora.test` canonical/sitemap/robots behavior verified locally; thank-you remains noindexed and excluded                                                          |
| JSON-LD structure                                | Passed                           | All pages checked for required fields, visible FAQ parity, breadcrumbs, and no fictional rating markup                                                                                  |
| Schema.org validator                             | Passed                           | Home: LegalService + FAQ, zero errors/warnings. Small Claims: LegalService + BreadcrumbList + FAQ, zero errors/warnings                                                                 |
| Google Rich Results code test                    | Passed with optional suggestions | Two valid business/organization items; optional image/priceRange missing. No fabricated values added; FAQ eligibility was not reported                                                  |
| Lighthouse mobile                                | See measurements below           | All individual reports retained; measurements use local production builds and simulated mobile throttling                                                                               |
| Desktop Safari                                   | Not tested                       | Native automation attempt timed out; no Safari compatibility claim                                                                                                                      |
| Physical iPhone / Android                        | Not tested                       | Phone-sized Chromium checks do not establish real-device compatibility                                                                                                                  |
| Client facts, assets, policies, written approval | Pending client                   | Consolidated in `CLIENT-REVIEW.md`                                                                                                                                                      |

No confirmed broken link, failing source test, or unresolved functional defect was found in the completed checks. Untested environments and pending approval remain release conditions, not passes. Automated accessibility results and focused keyboard checks do not constitute a complete WCAG audit.

## Lighthouse measurements

The runner uses installed Microsoft Edge, a temporary browser profile, production-mode Next.js, Lighthouse mobile simulation with its default network and CPU throttling, and three audits per page. The launch test is local-only: the public preview still remains noindexed. An intentionally noindexed preview fails the crawlability audit by design; this is not fixed by making the preview indexable.

| Page         | Individual performance scores | Median performance | Accessibility | SEO | Target status |
| ------------ | ----------------------------- | ------------------ | ------------- | --- | ------------- |
| Home         | 63 / 99 / 96                  | 96                 | 100           | 100 | Passed        |
| Contact      | 96 / 98 / 98                  | 98                 | 100           | 100 | Passed        |
| Small Claims | 99 / 91 / 98                  | 98                 | 100           | 100 | Passed        |

Final series: `2026-10-26T22:23:05.815Z`. All nine reports have no flagged logo-name, contrast, touch-target, or link-name failures. Reports: `artifacts/qa/raw/lighthouse-launch/2026-10-26T22-21-32-883Z`.

The Home first-run performance score of 63 is retained and remains a cold-start limitation to investigate again on the eventual deployment. Median targets passed; this does not mean every run reached 90. Remaining suggestions include framework JavaScript coverage, render-blocking CSS, a small potential image-compression saving, and variable main-thread work. The map deferral removed the initial third-party download from Contact; the final Contact trace confirms it no longer requests Google Maps before scrolling. No score thresholds or throttling settings were relaxed.

Raw HTML/JSON reports are retained under `artifacts/qa/raw/` locally and ignored by Git because of their size. The JSON summary identifies the final timestamped report directory. Keep these files with the reviewed candidate. Earlier audits and diagnostic reruns are also retained; they must not be confused with the final series.

Scores vary with host load, cache state, and browser startup. A previous complete series had Home performance 64/96/98 (median 96), Contact 93/99/99 (median 99), and Small Claims 99/98/99 (median 99), with Accessibility/SEO 100 throughout. An interrupted diagnostic rerun recorded 26 and 69 on Home under a slower host benchmark before the logo-name fix. A later complete series after that fix measured medians 87/72/99 for Home/Contact/Small Claims, all with Accessibility/SEO 100; its Contact network trace fetched substantial Google Maps scripts before the map was visible. That finding led to the viewport-based map deferral. These earlier numbers are disclosed rather than removed. Category score 100 did not suppress a separate logo label/name warning; the final runner explicitly gates that warning, contrast, link names, and touch targets.

## Changes justified by findings

- Darkened muted text, portrait labels, and service numbers to resolve contrast findings.
- Increased standalone contact, navigation, and footer targets to at least 44px where needed.
- Made the skip-link destination focusable without adding a normal Tab stop.
- Made desktop Escape dismiss the service flyout and restore trigger focus.
- Replaced the decorative letter markup with an SVG and let visible wordmark text provide the link name.
- Kept homepage image eager/high-priority; extracted pure public-content helpers so the homepage does not import interior-page React/form dependencies.
- Deferred the map iframe until its container is within 200px of the viewport; retained the no-JavaScript iframe and independent address/directions links. Native lazy loading had still fetched the Google scripts on Contact below the screen.
- Isolated QA output/configuration so preview indexing rules and real email settings cannot be accidentally changed by the checks.

The 64-case responsive matrix predates the map deferral; the final Contact spot check confirmed the same 330px map height, no overflow, and successful viewport-triggered loading. Shared header keyboard checks predate the final logo text simplification; the final Lighthouse name audit and HTTP assertions cover that change.

The contact API request/response contract and delivery implementation were preserved. No production fake-success flag was introduced. Operational runners live in `scripts/`; assertions and test scenarios live in `tests/`. Only the test fixture substitutes browser contact responses.

## Evidence

Relative paths below are within this repository:

- `artifacts/qa/local-checks-summary.json`: preview and isolated launch checks.
- `artifacts/qa/external-links-preview.json` and `external-links-launch.json`: external reachability.
- `artifacts/qa/responsive-matrix.json`: 64 route/viewport checks.
- `artifacts/qa/keyboard-desktop.json` and `keyboard-mobile.json`: focus and dismissal results.
- `artifacts/qa/form-failure.json`, `form-failure.jpg`, `form-success.jpg`, `form-duplicate-click.json`: browser fixture evidence.
- `artifacts/qa/deferred-map.json` and `deferred-map.jpg`: final map deferral/geometry spot check at 390px.
- `artifacts/qa/map-fallback.json` and `map-fallback.jpg`: blocked embedded map fallback.
- `artifacts/qa/google-rich-results.jpg`, `google-rich-results.txt`, and `google-rich-results-details.txt`: Google code-input result and optional suggestions.
- `artifacts/qa/schema-home.jpg`, `schema-home.txt`, `schema-service.txt`: Schema.org code-input results.
- `artifacts/qa/structured-data-home.html` and `structured-data-service.html`: local validator specimens with generated JSON-LD and matching FAQ copy.
- `artifacts/qa/lighthouse-launch-summary.json`: three-run scores and report locations.

The external code-input tools checked specimens from Home and Small Claims, not a publicly deployed URL. Automated JSON-LD assertions cover all content pages. General schema validity and Google rich-result eligibility are distinct; neither guarantees that Google will display an enhancement. Reference: [Google structured-data testing guidance](https://developers.google.com/search/docs/appearance/structured-data), [Lighthouse crawlability audit](https://developer.chrome.com/docs/lighthouse/seo/is-crawlable).

## Reproduce

```sh
npm run check
npm run build
npm run pages:check
npm run qa:checks
npm run qa:lighthouse
```

`npm run qa` combines the last two commands. The QA checks build both modes and own/stop their loopback servers. Lighthouse uses the launch QA build; Edge must be installed or `CHROME_PATH` supplied. Do not run another server on 3100/3101 during the combined QA command. Browser checks and external code-input validation are recorded manual automation sessions, not claimed as part of the Node test command.

## One client handoff

Use `CLIENT-REVIEW.md` to collect the real email/domain, confirmation of phones/address, approved service scope and credentials, biography/headshot, consultation terms, hours, actual fees if shown, genuine reviews or their removal, privacy/accessibility/disclaimer approval, three inbox-receipt confirmations, and written candidate approval. Labelled placeholders remain until approved replacements exist.

Before closing Phase 4, also resolve the Safari/physical-device coverage gap and rerun affected checks after approved content, assets, real domain, or delivery configuration changes. The current candidate is prepared for that review; it is not signed off for production.
