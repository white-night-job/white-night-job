import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { recordLineContactEvent } from "@/lib/shop-line-link";
import {
  describeStoreLineChannelSecret,
  verifyStoreLineSignature,
} from "@/lib/store-line-messaging";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type LineWebhookEvent = {
  type?: string;
  timestamp?: number;
  source?: { type?: string; userId?: string };
};

/** 女の子向け公式LINEの署名（従来どおり受信のみで処理はしない）。 */
function verifyGirlsLineSignature(body: string, signature: string): boolean {
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
  const diagnostics = {
    ...describeStoreLineChannelSecret(),
    hasGirlsSecret: Boolean(process.env.LINE_MESSAGING_CHANNEL_SECRET),
    hasSignatureHeader: Boolean(signature),
    bodyLength: rawBody.length,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  };

  if (!signature) {
    console.warn("[webhook/line] verify route=no_signature -> 401", diagnostics);
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  if (!verifyStoreLineSignature(rawBody, signature)) {
    if (verifyGirlsLineSignature(rawBody, signature)) {
      console.info("[webhook/line] verify route=girls -> 200 (no-op)", diagnostics);
      return NextResponse.json({ ok: true });
    }
    console.warn("[webhook/line] verify route=mismatch -> 401", diagnostics);
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  console.info("[webhook/line] verify route=store -> 200", diagnostics);

  try {
    const payload = JSON.parse(rawBody) as { events?: LineWebhookEvent[] };
    const supabase = createSupabaseAdmin();
    for (const event of payload.events ?? []) {
      const lineUserId = event.source?.userId?.trim();
      if (event.source?.type !== "user" || !lineUserId || !event.type) continue;
      try {
        await recordLineContactEvent(supabase, {
          lineUserId,
          eventType: event.type,
          occurredAt: event.timestamp ? new Date(event.timestamp) : new Date(),
        });
      } catch (error) {
        console.error("[webhook/line] contact record failed", {
          type: event.type,
          error: error instanceof Error ? error.message : error,
        });
      }
    }
  } catch (error) {
    console.error("[webhook/line] invalid payload", error);
  }

  return NextResponse.json({ ok: true });
}
