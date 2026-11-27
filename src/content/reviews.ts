import type { ReviewRating } from "../lib/reviews.ts";

export interface PublishedReview {
  id: string;
  displayName: string;
  rating: ReviewRating;
  text: string;
  permissionToPublish: true;
}

// Public content only: add genuine reviews after office approval and written permission.
// Keep private emails and permission evidence in the office's records, never in this file.
export const publishedReviews: readonly PublishedReview[] = [];
