import type { ReviewRating } from "../lib/reviews.ts";

export interface PublishedReview {
  id: string;
  displayName: string;
  rating: ReviewRating;
  text: string;
  permissionToPublish: true;
}

// Public projection only. Runtime reviews are stored privately in Netlify Blobs.
// This empty legacy export is retained for content checks; it is not a publication source.
export const publishedReviews: readonly PublishedReview[] = [];
