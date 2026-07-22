import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { cleanupExpiredTempImages } from "@/lib/temp-images";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("[cron/cleanup-temp-images] CRON_SECRET is not set");
    return false;
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === secret) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

async function handle(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredTempImages();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "一時画像の削除に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
