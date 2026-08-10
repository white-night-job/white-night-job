import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { linkSubscriptionToStore } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

type LinkBody = {
  storeId?: string;
  confirmReplaceExisting?: boolean;
};

/**
 * 未紐付け契約を店舗へ手動紐付け。
 * Stripe の料金・期間・予約は変更しない。
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ subscriptionId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { subscriptionId } = await context.params;
  if (!subscriptionId) {
    return NextResponse.json(
      { message: "subscriptionId is required." },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as LinkBody;
    const storeId = body.storeId?.trim();
    if (!storeId) {
      return NextResponse.json({ message: "storeId is required." }, { status: 400 });
    }

    const result = await linkSubscriptionToStore({
      stripeSubscriptionId: subscriptionId,
      storeId,
      confirmReplaceExisting: Boolean(body.confirmReplaceExisting),
    });

    return NextResponse.json({
      subscription: result.subscription,
      shopName: result.shopName,
      replacedPreviousSubscriptionId: result.replacedPreviousSubscriptionId,
      message: `「${result.shopName}」に紐付けました。`,
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "";
    const existingSubscriptionId =
      error && typeof error === "object" && "existingSubscriptionId" in error
        ? String(
            (error as { existingSubscriptionId?: string }).existingSubscriptionId ??
              "",
          )
        : null;

    if (code === "STORE_ALREADY_LINKED") {
      return NextResponse.json(
        {
          message: getErrorMessage(error, "店舗に別契約が紐付いています。"),
          code,
          existingSubscriptionId,
          requiresConfirmReplace: true,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: getErrorMessage(error, "店舗の紐付けに失敗しました。") },
      { status: 500 },
    );
  }
}
