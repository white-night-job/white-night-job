import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  getStripeServer,
  resolveBillingKeySafe,
  resolveBillingLabel,
} from "@/lib/stripe";
import { getStoreSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  const storeId = await getAuthenticatedShopJobId();
  if (!storeId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const subscription = await getStoreSubscription(storeId);
    let defaultPaymentMethodSummary: string | null = null;

    if (subscription?.stripeCustomerId) {
      const stripe = getStripeServer();
      const customer = await stripe.customers.retrieve(subscription.stripeCustomerId, {
        expand: ["invoice_settings.default_payment_method"],
      });
      if (!customer.deleted) {
        const pm = customer.invoice_settings.default_payment_method;
        if (pm && typeof pm !== "string" && pm.type === "card") {
          defaultPaymentMethodSummary = `${pm.card?.brand ?? "card"} ••••${pm.card?.last4 ?? ""}`;
        }
      }
    }

    return NextResponse.json({
      subscription: subscription
        ? {
            ...subscription,
            billingKey: resolveBillingKeySafe(subscription.stripePriceId),
            billingLabel: resolveBillingLabel(subscription.stripePriceId),
          }
        : null,
      defaultPaymentMethodSummary,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "契約情報の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
