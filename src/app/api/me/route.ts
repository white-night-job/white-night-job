import { meJsonResponse } from "@/lib/user-session-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return meJsonResponse(request);
}
