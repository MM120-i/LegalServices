export type ContentRoute = "/" | `/${string}` | "404";

/** Internal draft blocks. These are not a publication-ready rendering model. */
export interface DraftBlock {
  kind: "copy" | "editorial" | "placeholder";
  markdown: string;
}

export interface DraftSection {
  heading: string;
  depth: number;
  blocks: DraftBlock[];
}

export interface DraftFaq {
  question: string;
  answer: string;
}

export interface PageDraft {
  route: ContentRoute;
  status: "draft";
  source: string;
  h1: string;
  sections: DraftSection[];
  faqs: DraftFaq[];
  metadata: {
    title: string;
    description: string;
    productionIndexing: "index" | "noindex";
  };
}

export interface SharedCopyDraft {
  status: "draft";
  source: string;
  sections: DraftSection[];
}
