import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  buildAbsoluteUrl,
  getStripeServer,
  jobPlanToRegularBillingKey,
  billingKeyToStripePriceId,
  normalizePlanInput,
} from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getStoreSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const storeId = await getAuthenticatedShopJobId();
  if (!storeId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { plan?: string };
    const requestedPlan = normalizePlanInput(body.plan);
    if (!requestedPlan) {
      return NextResponse.json({ message: "プランが不正です。" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("id, shop_name, plan")
      .eq("id", storeId)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!jobRow) {
      return NextResponse.json({ message: "店舗情報が見つかりません。" }, { status: 404 });
    }

    const existing = await getStoreSubscription(storeId);
    if (existing?.status === "active" || existing?.status === "trialing") {
      return NextResponse.json(
        {
          message:
            "有効な契約があります。プラン変更は運営管理画面から行います。",
        },
        { status: 409 },
      );
    }

    const stripe = getStripeServer();
    let customerId = existing?.stripeCustomerId ?? null;
    if (!customerId) {
      const created = await stripe.customers.create({
        name: jobRow.shop_name ?? `store-${storeId}`,
        metadata: {
          store_id: storeId,
          source: "white-night-job",
        },
      });
      customerId = created.id;
    } else {
      await stripe.customers.update(customerId, {
        metadata: {
          store_id: storeId,
          source: "white-night-job",
        },
      });
    }

    const billingKey = jobPlanToRegularBillingKey(requestedPlan);
    const priceId = billingKeyToStripePriceId(billingKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: buildAbsoluteUrl("/shop-dashboard?billing=success"),
      cancel_url: buildAbsoluteUrl("/shop-dashboard?billing=cancel"),
      metadata: {
        store_id: storeId,
        requested_plan: requestedPlan,
        billing_key: billingKey,
      },
      subscription_data: {
        metadata: {
          store_id: storeId,
          requested_plan: requestedPlan,
          billing_key: billingKey,
        },
      },
      allow_promotion_codes: false,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "決済画面の作成に失敗しました。") },
      { status: 500 },
    );
  }
}

