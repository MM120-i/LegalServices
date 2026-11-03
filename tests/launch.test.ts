import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canonicalRedirects,
  parsePublishedOrigin,
  placeholderFindings,
} from "../src/lib/launch.ts";

test("canonical redirects preserve paths and only match the alternate host", () => {
  for (const [origin, alternate] of [
    ["https://lexora.test", "www\\.lexora\\.test"],
    ["https://www.lexora.test", "lexora\\.test"],
  ]) {
    const [rule] = canonicalRedirects(origin, true);

    assert.equal(rule.destination, `${origin}/:path*`);
    assert.equal(rule.source, "/:path*");
    assert.deepEqual(rule.has, [{ type: "host", value: alternate }]);
    assert.equal(rule.permanent, true);
  }

  assert.deepEqual(canonicalRedirects("https://lexora.test", false), []);

  for (const origin of [
    undefined,
    "http://lexora.test",
    "https://user:secret@lexora.test",
    "https://lexora.test/path",
    "https://localhost",
  ]) {
    assert.equal(parsePublishedOrigin(origin), null);
    assert.deepEqual(canonicalRedirects(origin, true), []);
  }
});

test("launch placeholder scan detects real draft copy without rejecting form hints", () => {
  for (const value of [
    "www.xyz.ca",
    "info@xyz.ca",
    "Lorem ipsum",
    "[CONFIRM: hours]",
    "{{business.name}}",
    "SAMPLE — NOT A REAL CLIENT REVIEW",
    "Portrait placeholder",
  ]) {
    assert.ok(placeholderFindings(value).length > 0, value);
  }

  assert.deepEqual(placeholderFindings("Call to confirm hours. Briefly describe your matter."), []);
});

test("launch scan does not treat JSX object props as drafting tokens", () => {
  assert.deepEqual(placeholderFindings('style={{ display: "flex" }}'), []);
  assert.deepEqual(placeholderFindings("dangerouslySetInnerHTML={{ __html: serialized }}"), []);
});
