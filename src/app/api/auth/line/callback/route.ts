import { handleLineCallback } from "@/lib/line-callback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleLineCallback(request);
}
