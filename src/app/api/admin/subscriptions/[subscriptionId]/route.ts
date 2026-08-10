import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { normalizeAdminPlanChangeInput } from "@/lib/stripe";
import {
  cancelPendingPlanChange,
  revokeCancelAtPeriodEnd,
  scheduleCancelAtPeriodEnd,
  schedulePlanChangeAtPeriodEnd,
} from "@/lib/stripe-subscription-schedule";
import { upsertSubscriptionFromStripe, getSubscriptionByStripeId } from "@/lib/subscriptions";

type ActionBody = {
  action?:
    | "change_plan"
    | "cancel_pending_plan_change"
    | "cancel"
    | "cancel_pending_cancellation";
  /** StripeBillingKey（5種）または JobPlan（通常3種） */
  plan?: string;
};

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ subscriptionId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { subscriptionId } = await context.params;
  if (!subscriptionId) {
    return NextResponse.json({ message: "subscriptionId is required." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as ActionBody;
    const action = body.action;
    if (!action) {
      return NextResponse.json({ message: "action is required." }, { status: 400 });
    }

    if (action === "change_plan") {
      const billingKey = normalizeAdminPlanChangeInput(body.plan);
      if (!billingKey) {
        return NextResponse.json({ message: "plan is invalid." }, { status: 400 });
      }
      const { subscription: updated } = await schedulePlanChangeAtPeriodEnd({
        subscriptionId,
        billingKey,
      });
      const record = await upsertSubscriptionFromStripe(updated);
      return NextResponse.json({
        subscription: record,
        message: "プラン変更を次回更新日に予約しました。",
      });
    }

    if (action === "cancel_pending_plan_change") {
      const updated = await cancelPendingPlanChange(subscriptionId);
      const record = await upsertSubscriptionFromStripe(updated);
      return NextResponse.json({
        subscription: record,
        message: "プラン変更予約を取り消しました。",
      });
    }

    if (action === "cancel") {
      // 即時 cancel ではなく、期間終了（当初の次回更新日）で解約予約
      const { subscription: updated } = await scheduleCancelAtPeriodEnd(
        subscriptionId,
      );
      const record = await upsertSubscriptionFromStripe(updated);
      return NextResponse.json({
        subscription: record,
        message: "解約を次回更新日に予約しました。それまでは現在のプランが継続します。",
      });
    }

    if (action === "cancel_pending_cancellation") {
      const updated = await revokeCancelAtPeriodEnd(subscriptionId);
      const record = await upsertSubscriptionFromStripe(updated);
      return NextResponse.json({
        subscription: record,
        message: "解約予約を取り消しました。契約を継続します。",
      });
    }

    return NextResponse.json({ message: "unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "契約操作に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ subscriptionId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { subscriptionId } = await context.params;
    const record = await getSubscriptionByStripeId(subscriptionId);
    if (!record) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ subscription: record });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "契約情報の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
