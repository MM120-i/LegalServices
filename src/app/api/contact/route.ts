import { handleContact } from "../../../lib/contact-server.ts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleContact(request);
}
