import { services } from "./services.ts";
import { contentTokens, site } from "../config/site.ts";
import { pageDrafts, sharedCopyDraft } from "./generated.ts";
import type { ContentRoute, PageDraft } from "./types.ts";

export { pageDrafts, sharedCopyDraft };

export type {
  ContentRoute,
  DraftBlock,
  DraftFaq,
  DraftSection,
  PageDraft,
  SharedCopyDraft,
} from "./types.ts";

export function getPageDraft(route: ContentRoute): PageDraft | undefined {
  return pageDrafts.find((page) => page.route === route);
}

/** Resolve supplied facts; unresolved tokens are errors rather than invented defaults. */
export function resolveCopy(copy: string): string {
  return copy.replace(/\{\{([^{}]+)\}\}/g, (_match, key: string) => {
    if (!Object.hasOwn(contentTokens, key))
      throw new Error(`Unknown content token: ${key}`);

    return contentTokens[key as keyof typeof contentTokens];
  });
}

export function getPageHeading(page: PageDraft): string {
  if (page.route === "/about") {
    return `About ${site.business.principal}`;
  }

  if (page.route === "/contact") {
    return `Speak With ${site.business.name}`;
  }

  return services.find((service) => service.href === page.route)?.title ?? resolveCopy(page.h1);
}
