# Review moderation QA — November 26, 2026

Passed locally:

- Source checks: 17 content, 21 contact/review/moderation, 3 launch tests; TypeScript and ESLint.
- Production-mode local build, with delivery credentials disabled.
- Signed private links, no mutation on GET, expiry/renewal, consent enforcement, replay/concurrency protection, saved pending records and notification retries.
- Existing public review form browser regression at mobile/desktop widths, with email POSTs intercepted.
- Owner page at 360px, 390px and 1440px: no horizontal overflow; buttons at least 44px.
- Actual native Publish and Unpublish POSTs, with JavaScript disabled, update the server-rendered homepage without a build.
- New server process preserves the stored decision; private email, nonce and management link do not enter homepage HTML.
- Link and SEO checks across all 15 catalog pages; private management endpoint absent from sitemap.

The browser pass found a native-form Origin issue caused by the no-referrer policy. Fixed with a narrowly scoped same-origin browser/header check, while retaining signed capability authentication and cross-site rejection. Final browser rerun passed.

No real email, push or deployment was performed. All stored test records were temporary and removed. Screenshots contain fictional QA content only.

Pending after the user's setup deployment: Production environment variables, hosted Netlify Blobs runtime permissions and actual Zoho inbox receipt. Netlify storage/function usage applies. The existing unknown-URL raw-HTML footer limitation is recorded separately in the main README and was not part of these changes.
