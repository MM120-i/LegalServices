import { handleReview } from "../../../lib/review-server.ts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleReview(request);
}
