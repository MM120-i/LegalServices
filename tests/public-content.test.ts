import assert from "node:assert/strict";
import { test } from "node:test";

import { pageDrafts } from "../src/content/generated.ts";
import { getPublicPageContent } from "../src/lib/public-content.ts";

for (const page of pageDrafts) {
  test(`public content excludes internal drafting instructions: ${page.route}`, () => {
    const content = getPublicPageContent(page);
    const text = JSON.stringify(content);

    assert.doesNotMatch(text, /\[(?:CONFIRM|PLACEHOLDER):|Editorial note:|Research:|\{\{[^}]+\}\}/);
    assert.equal(content.faqs.length, page.faqs.length);

    for (const faq of content.faqs) {
      assert.ok(faq.question.trim());
      assert.ok(faq.answer.trim());
    }
  });
}
