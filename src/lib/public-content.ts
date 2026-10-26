import { resolveCopy } from "../content/index.ts";
import type { DraftFaq, DraftSection, PageDraft } from "../content/types.ts";

const operationalLabel =
  /^(?:CTA:|Related:|Link:|Buttons:|Editorial|Research:|Asset:|Portrait:|Office photograph:|Eyebrow:|H[1-6]:|Field labels|Directions link label:|Google listing link label:|Effective date:)/;

/** Editorial instructions are intentionally never sent to the page renderer. */
export function cleanText(value: string): string {
  return resolveCopy(value)
    .replace(/`?\[(?:CONFIRM|PLACEHOLDER):[^\]]*\]`?/g, "")
    .replace(/\s+([.,])/g, "$1")
    .trim();
}

export function publicBlocks(section: DraftSection): string[] {
  return section.blocks
    .filter((block) => block.kind === "copy" && !operationalLabel.test(block.markdown))
    .map((block) => cleanText(block.markdown))
    .filter(
      (text) =>
        text.length > 2 && !/^(Email|Hours|Consultations|Access|Privacy contact):/.test(text),
    );
}

export function getPublicPageContent(page: PageDraft) {
  const faqs: DraftFaq[] = page.faqs.map((faq) => ({
    question: cleanText(faq.question),
    answer:
      cleanText(faq.answer) ||
      "Please call the office to confirm the arrangements for your matter.",
  }));

  const questions = new Set(faqs.map((faq) => faq.question));
  const first = page.sections.find((section) => publicBlocks(section).length > 0);
  const intro = first ? publicBlocks(first) : [];

  const sections = page.sections
    .filter((section) => section !== first && !questions.has(cleanText(section.heading)))
    .filter(
      (section) =>
        !/^(?:Questions|Frequently asked|Discuss |Ask about|Not sure where)/i.test(section.heading),
    )
    .map((section) => ({
      heading: cleanText(section.heading).replace(
        /^Proposed approach$/,
        "What working together can look like",
      ),
      blocks: publicBlocks(section),
    }))
    .filter((section) => section.blocks.length > 0);

  return { intro, sections, faqs };
}
