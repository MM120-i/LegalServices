# Phase 4 code lessons

These are excerpts from the implementation. They use the project’s spacing conventions: related declarations together, then a blank line before the next logical step. No test credentials are real.

## 1. A skip link needs a focusable destination

**Problem:** Scrolling to the main area is not sufficient if keyboard focus stays elsewhere.

**Change:** Make the existing main element programmatically focusable.

```tsx
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

**Why:** `-1` allows the browser to focus the destination without adding an extra stop to normal Tab navigation.

**Test:** Press Tab to reach “Skip to content,” then Enter. The active element must be `main-content`. The link check also asserts that the generated target has `tabindex="-1"`.

## 2. Closing a dropdown should restore a useful focus position

**Problem:** Escape left the desktop service flyout open.

**Change:** Move focus back to its trigger and explicitly dismiss the flyout.

```tsx
if (event.target instanceof Element && event.target.closest(".nav-dropdown")) {
  event.preventDefault();
  dropdownTrigger.current?.focus();
  setDropdownDismissed(true);
}
```

```css
.nav-dropdown[data-dismissed="true"] .dropdown-panel {
  display: none;
}
```

**Why:** The keyboard user can resume from a predictable link. The existing focus/hover rules resume when the user leaves or re-enters the dropdown.

**Test:** Tab into a service link, press Escape, and verify both that the panel is hidden and that focus returned to `/practice-areas`.

## 3. Check where a link goes, not just whether it exists

**Problem:** A link can look correct while pointing to an absent page or section.

**Change:** Parse the generated HTML and check the actual destination and fragment.

```js
const destination = byRoute.get(url.pathname);

assert.ok(destination, `${route}: unknown internal link ${href}`);

if (url.hash) {
  assert.ok(
    destination.getElementById(decodeURIComponent(url.hash.slice(1))),
    `${route}: missing anchor ${href}`,
  );
}
```

**Why:** This catches a button pointing to `/contact#consultation` when the contact page exists but its `consultation` section does not.

**Test:** `npm run qa:links`, with the QA preview running. Separate checks compare telephone labels, `tel:` values, and directions destinations with centralized business facts.

## 4. Treat equivalent URLs as equivalent

**Problem:** Next.js can normalize `https://qa.lexora.test/` into `https://qa.lexora.test` in canonical markup.

**Change:** Compare parsed URLs rather than raw strings.

```js
assert.equal(new URL(canonical).href, new URL(route, launchOrigin).href, route);
```

**Why:** The test should detect the wrong destination, not reject harmless formatting differences.

**Test:** The SEO suite runs against both a noindex preview and an isolated launch-mode build.

## 5. Mock the delivery boundary rather than inventing production success

**Problem:** We need repeatable form tests before a real inbox is available.

**Change:** Pass a fake delivery function to the existing server handler in tests only.

```ts
const response = await handleContact(request, {
  config,
  fetcher,
  limit: () => true,
});

assert.equal(response.status, 200);
assert.equal((await response.json()).ok, true);
```

**Why:** The real handler still performs validation and constructs the real message shape. Only the external network call is replaced. There is no production “pretend delivery succeeded” setting.

**Test:** Three named cases cover traffic, housing, and notary inquiries. Optional email controls whether an acknowledgement is created. Repeated attempts with the same submission ID retain the provider’s idempotency key.

The browser fixture is separate: it proxies the real UI and replaces only its contact response. It tests pending/error/success rendering, not actual provider delivery. The real browser-to-API configuration failure and server-to-provider mocks are verified separately.

## 6. Keep QA launch settings isolated

**Problem:** Lighthouse penalizes `noindex`, but a client preview must remain noindexed.

**Change:** Build the same application with separate output directories and a reserved test origin.

```js
NEXT_BUILD_DIR: `.next-qa-${mode}`,
SITE_PUBLISHED: mode === "launch" ? "true" : "false",
NEXT_PUBLIC_SITE_URL: mode === "launch" ? "https://qa.lexora.test" : "",
RESEND_API_KEY: "",
CONTACT_TO_EMAIL: "",
CONTACT_FROM_EMAIL: "",
```

**Why:** These are process-local test settings, not changes to `.env.local`, DNS, or a deployed website. Both QA servers bind only to loopback. Empty delivery values prevent accidental email.

**Test:** Preview pages must be noindexed with an empty sitemap. The isolated launch build must have the expected canonical URLs and sitemap, while the thank-you page stays noindexed.

## 7. Measure repeatedly and keep the evidence

**Problem:** A single performance score can vary with system load and cache state.

**Change:** Save every Lighthouse HTML/JSON report, then calculate the median of three runs.

```js
const median = scores.map((score) => score.performance).sort((a, b) => a - b)[
  Math.floor(scores.length / 2)
];
```

**Why:** The middle result is less sensitive to one outlier. All individual results remain visible, so the median does not hide a slower run. Scores are evidence under the recorded test conditions, not a guarantee of every visitor’s experience.

**Test:** `npm run qa:lighthouse` targets Performance ≥90 and Accessibility/launch-mode SEO 100, saves reports in a timestamped folder, and returns a failing exit code when its targets are missed.

## 8. Defer a third-party map until it is near the reader

**Problem:** Native `loading="lazy"` still loaded the Contact map and its Google scripts while the map was below the screen.

**Change:** Observe the map container and mount its iframe only when it is within 200px of the viewport.

```tsx
const observer = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      setVisible(true);
      observer.disconnect();
    }
  },
  { rootMargin: "200px" },
);
```

**Why:** The browser can finish the important page content and form before downloading the interactive map. Its container keeps the same height, so loading it does not shift the layout. The effect disconnects its observer on unmount; a `noscript` iframe preserves the original map for readers without JavaScript. Address and directions links are always rendered independently.

**Test:** On a fresh Contact navigation at mobile size, the active iframe should be absent. Tab to the map link and confirm that the iframe appears as the section approaches the viewport. Block the embed and confirm the independent address/directions remain usable. Rerun Lighthouse after the change; retain the previous reports for comparison.
