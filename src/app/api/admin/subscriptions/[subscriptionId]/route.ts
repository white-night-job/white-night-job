import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  getStripeServer,
  normalizeAdminPlanChangeInput,
} from "@/lib/stripe";
import {
  cancelPendingPlanChange,
  schedulePlanChangeAtPeriodEnd,
} from "@/lib/stripe-subscription-schedule";
import {
  getSubscriptionByStripeId,
  syncJobAccessFromSubscription,
  upsertSubscriptionFromStripe,
} from "@/lib/subscriptions";

type ActionBody = {
  action?:
    | "change_plan"
    | "cancel_pending_plan_change"
    | "pause"
    | "resume"
    | "cancel";
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
    const stripe = getStripeServer();
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
      // 次回更新日から適用（Subscription Schedule / 日割りなし）
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

    if (action === "pause") {
      const updated = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: { behavior: "void" },
      });
      const record = await upsertSubscriptionFromStripe(updated);
      await syncJobAccessFromSubscription(record.storeId, record.plan, "paused");
      return NextResponse.json({ subscription: { ...record, status: "paused" } });
    }

    if (action === "resume") {
      const updated = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: null,
      });
      const record = await upsertSubscriptionFromStripe(updated);
      return NextResponse.json({ subscription: record });
    }

    if (action === "cancel") {
      const canceled = await stripe.subscriptions.cancel(subscriptionId);
      const record = await upsertSubscriptionFromStripe(canceled);
      await syncJobAccessFromSubscription(record.storeId, record.plan, "canceled");
      return NextResponse.json({ subscription: record });
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
