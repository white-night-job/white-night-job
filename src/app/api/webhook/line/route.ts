import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function verifyLineSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_MESSAGING_CHANNEL_SECRET;
  if (!secret) return false;
  const digest = createHmac("sha256", secret).update(body).digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "LINE webhook endpoint ready" });
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-line-signature");
  const rawBody = await request.text();
  if (!signature || !verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  // 現時点では受信イベントを保存せず、200応答のみ返す。
  return NextResponse.json({ ok: true });
}
