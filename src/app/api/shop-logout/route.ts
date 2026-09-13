import { NextResponse } from "next/server";
import { clearAdminShopViewCookie } from "@/lib/admin-shop-view";
import { clearShopCookie } from "@/lib/shop-auth";

export async function POST() {
  await clearShopCookie();
  await clearAdminShopViewCookie();
  return NextResponse.json({ ok: true });
}
