import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import { buildAbsoluteUrl, getStripeServer } from "@/lib/stripe";
import { getStoreSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST() {
  const storeId = await getAuthenticatedShopJobId();
  if (!storeId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }
  try {
    const subscription = await getStoreSubscription(storeId);
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { message: "Stripe顧客情報が見つかりません。" },
        { status: 404 },
      );
    }

    const stripe = getStripeServer();
    // Customer Portal must be limited to payment-method updates in Stripe Dashboard
    // (or via STRIPE_BILLING_PORTAL_CONFIGURATION_ID). Shops cannot cancel/change plans.
    const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: buildAbsoluteUrl("/shop-dashboard?billing=portal"),
      ...(configuration ? { configuration } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "支払い方法変更画面を開けませんでした。") },
      { status: 500 },
    );
  }
}

