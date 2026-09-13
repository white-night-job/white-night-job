import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { clearAdminShopViewCookie } from "@/lib/admin-shop-view";
import { clearShopCookie } from "@/lib/shop-auth";

export const dynamic = "force-dynamic";

/**
 * End admin proxy shop-dashboard view: clear shop session + view marker.
 * Keeps the admin session intact.
 */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  await clearShopCookie();
  await clearAdminShopViewCookie();

  return NextResponse.json({
    ok: true,
    redirectTo: "/admin/jobs",
  });
}
