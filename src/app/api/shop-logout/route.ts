import { NextResponse } from "next/server";
import { clearShopCookie } from "@/lib/shop-auth";

export async function POST() {
  await clearShopCookie();
  return NextResponse.json({ ok: true });
}
