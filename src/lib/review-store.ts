import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import type { ReviewSubmission } from "./reviews.ts";
import type { PublishedReview } from "../content/reviews.ts";

export interface StoredReview extends ReviewSubmission {
  id: string;
  nonce: string;
  createdAt: number;
  updatedAt: number;
  status: "pending" | "published" | "rejected" | "unpublished";
  notifiedAt?: number;
  formVersion: "2026-11-26";
}

export interface ReviewEntry {
  review: StoredReview;
  etag: string;
}

export interface ReviewStore {
  name: string;
  get(id: string): Promise<ReviewEntry | null>;
  create(review: StoredReview): Promise<boolean>;
  update(review: StoredReview, etag: string): Promise<boolean>;
  all(): AsyncIterable<StoredReview>;
}

const validId = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;

export function reviewKey(id: string): string {
  if (!validId.test(id)) {
    throw new Error("Invalid review ID");
  }

  return `reviews/${id.toLowerCase()}.json`;
}

export function localReviewStore(directory: string): ReviewStore {
  const name = `local:${path.resolve(directory)}`;
  const filename = (id: string) => path.join(directory, reviewKey(id));

  const get = async (id: string): Promise<ReviewEntry | null> => {
    try {
      const data = await readFile(filename(id), "utf8");
      return { review: JSON.parse(data), etag: createHash("sha256").update(data).digest("hex") };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }

      throw error;
    }
  };

  const write = async (review: StoredReview, expected: string | null) => {
    const file = filename(review.id);
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    let lock;

    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        lock = await open(`${file}.lock`, "wx", 0o600);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }

    if (!lock) {
      throw new Error("Review is busy");
    }

    const temporary = `${file}.${randomUUID()}.tmp`;

    try {
      if ((await get(review.id))?.etag !== (expected ?? undefined)) {
        return false;
      }

      const handle = await open(temporary, "wx", 0o600);

      try {
        await handle.writeFile(JSON.stringify(review));
      } finally {
        await handle.close();
      }

      await rename(temporary, file);
      return true;
    } finally {
      await unlink(temporary).catch(() => {});
      await lock.close();
      await unlink(`${file}.lock`);
    }
  };

  return {
    name,
    get,
    create: (review) => write(review, null),
    update: write,
    async *all() {
      let files: string[];

      try {
        files = await readdir(path.join(directory, "reviews"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return;
        }

        throw error;
      }

      for (const file of files) {
        if (!file.endsWith(".json")) {
          continue;
        }

        const entry = await get(file.slice(0, -5));

        if (entry) {
          yield entry.review;
        }
      }
    },
  };
}

export function getReviewStore(): ReviewStore | null {
  const localDirectory = process.env.REVIEWS_LOCAL_DIRECTORY;

  if (
    localDirectory &&
    !process.env.NETLIFY &&
    !process.env.CONTEXT &&
    !process.env.NETLIFY_BLOBS_CONTEXT
  ) {
    return localReviewStore(localDirectory);
  }

  const configuredName = process.env.REVIEWS_STORE_NAME?.trim();

  if (!configuredName || !/^[a-z\d-]{1,80}$/.test(configuredName)) {
    return null;
  }

  const context = process.env.CONTEXT;
  const name =
    context && context !== "production"
      ? `${configuredName}-${process.env.DEPLOY_ID ?? context}`
      : configuredName;

  const store = getStore({ name, consistency: "strong" });

  return {
    name,
    async get(id) {
      const entry = await store.getWithMetadata(reviewKey(id), { type: "json" });

      if (!entry) {
        return null;
      }

      if (!entry.etag) {
        throw new Error("Missing storage version");
      }

      return { review: entry.data as StoredReview, etag: entry.etag };
    },

    async create(review) {
      return (await store.setJSON(reviewKey(review.id), review, { onlyIfNew: true })).modified;
    },

    async update(review, etag) {
      return (await store.setJSON(reviewKey(review.id), review, { onlyIfMatch: etag })).modified;
    },

    async *all() {
      for await (const page of store.list({ prefix: "reviews/", paginate: true })) {
        for (let offset = 0; offset < page.blobs.length; offset += 20) {
          const entries = await Promise.all(
            page.blobs
              .slice(offset, offset + 20)
              .map(
                async ({ key }) => store.get(key, { type: "json" }) as Promise<StoredReview | null>,
              ),
          );

          for (const entry of entries) {
            if (entry) {
              yield entry;
            }
          }
        }
      }
    },
  };
}

export async function getPublishedReviews(store: ReviewStore): Promise<PublishedReview[]> {
  const reviews: { value: PublishedReview; createdAt: number }[] = [];

  for await (const review of store.all()) {
    if (review.status !== "published" || review.permissionToPublish !== true) {
      continue;
    }

    reviews.push({
      createdAt: review.createdAt,
      value: {
        id: review.id,
        displayName: review.displayName,
        rating: review.rating,
        text: review.text,
        permissionToPublish: true,
      },
    });
  }

  return reviews
    .sort((a, b) => b.createdAt - a.createdAt || a.value.id.localeCompare(b.value.id))
    .map(({ value }) => value);
}
