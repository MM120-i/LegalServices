import { handleModeration } from "../../../../lib/review-moderation.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  return handleModeration(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleModeration(request);
}
