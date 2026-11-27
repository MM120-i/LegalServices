import type { ReviewStore, ReviewEntry } from "../../src/lib/review-store.ts";

export function memoryReviewStore(name = "test-reviews"): ReviewStore {
  const entries = new Map<string, ReviewEntry>();
  let version = 0;

  return {
    name,
    async get(id) {
      return structuredClone(entries.get(id) ?? null);
    },
    async create(review) {
      if (entries.has(review.id)) {
        return false;
      }

      entries.set(review.id, { review: structuredClone(review), etag: String(++version) });
      return true;
    },
    async update(review, etag) {
      if (entries.get(review.id)?.etag !== etag) {
        return false;
      }

      entries.set(review.id, { review: structuredClone(review), etag: String(++version) });
      return true;
    },
    async *all() {
      for (const entry of entries.values()) {
        yield structuredClone(entry.review);
      }
    },
  };
}

export const moderation = {
  secret: "test-only-review-secret-at-least-32-characters",
  origin: "https://example.test",
};
