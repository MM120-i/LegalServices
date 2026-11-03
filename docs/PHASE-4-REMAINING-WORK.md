# Phase 4 — work we can advance independently

Updated November 2, 2026. Keep work within Phase 4. Do not contact the client, send real inquiries, publish the website, or replace unknown facts with invented claims.

## Prepared

- [x] Separate client-only information and approval checklist: [CLIENT-REQUIREMENTS.md](CLIENT-REQUIREMENTS.md).
- [x] Page-by-page approval and inbox acceptance record: [CLIENT-REVIEW.md](CLIENT-REVIEW.md).
- [x] Reproducible automated QA commands, isolated preview/launch builds, mocked delivery tests, and timestamped Lighthouse reports.
- [x] Recorded technical evidence and known limitations: [PHASE-4-QA-REPORT.md](PHASE-4-QA-REPORT.md).
- [x] Plain-language implementation lessons: [PHASE-4-CODE-LESSONS.md](PHASE-4-CODE-LESSONS.md).

These are existing/prepared deliverables, not a claim that all checks were rerun today.

## Next independent checks

1. **Retry desktop Safari verification.** The prior automation attempt timed out. Check navigation, keyboard focus, forms with mocked delivery, FAQ controls, sticky actions, and deferred map loading. Record browser/version and evidence; leave unverified items unverified if automation remains unavailable.
2. **Complete physical-device coverage when a device is available.** Check iPhone Safari and Android Chrome separately from simulated widths. This is our QA responsibility; it does not require the client to approve technical behavior. Hardware availability remains a dependency.
3. **Investigate the slower cold Home load.** The retained final series scored 63/99/96, median 96. Inspect existing traces before changing code. Make only changes supported by findings, then rerun affected audits under comparable conditions and retain all results. Recheck on the eventual deployment when separately authorized.
4. **Refresh browser coverage after the final QA fixes.** The full responsive matrix predates map deferral and the final logo change; subsequent spot checks and Lighthouse passed. Refresh the relevant browser matrix for the current candidate, including no-JavaScript navigation/form fallback and deferred map behavior.
5. **Keep the review candidate reproducible.** After meaningful code changes, run the appropriate source/build/HTTP checks, preserve screenshots/reports, and update the QA report with the exact changes and remaining gaps. Do not rerun expensive checks solely because time has passed.

## Once client information arrives

- Apply approved facts in `src/config/site.ts` and approved long-form copy in `content/phase-1/`; regenerate content where applicable.
- Replace approved assets; replace or remove fictional testimonials and portrait placeholders before publication.
- Configure real email delivery privately, then coordinate the three inbox-confirmation tests only when authorized.
- Rerun checks affected by content, assets, domain, or delivery configuration changes.
- Record approval against the actual reviewed candidate, not an earlier revision.

## Completion boundary

Client requirements are tracked in [CLIENT-REQUIREMENTS.md](CLIENT-REQUIREMENTS.md). Technical QA gaps belong to this file and the QA report. Phase 4 stays open until both are resolved and written sign-off is recorded. No later phase is authorized by this checklist.
