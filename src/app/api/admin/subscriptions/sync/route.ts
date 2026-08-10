import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { syncAllSubscriptionsFromStripe } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 管理画面「Stripeから契約を同期」
 * Stripe API の全 Subscription を取得し、subscriptions へ upsert（stripe_subscription_id 一意）。
 */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllSubscriptionsFromStripe();
    return NextResponse.json({
      message: `Stripeから ${result.synced} 件の契約を同期しました（未紐付け ${result.unlinked} 件）。`,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Stripe契約の同期に失敗しました。",
        ),
      },
      { status: 500 },
    );
  }
}
