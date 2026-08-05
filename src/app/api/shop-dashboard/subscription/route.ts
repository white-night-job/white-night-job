import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import { getStripeServer } from "@/lib/stripe";
import { getStoreSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

type PaymentMethodInfo = {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
} | null;

function formatCardBrand(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const map: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    jcb: "JCB",
    diners: "Diners Club",
    discover: "Discover",
    unionpay: "UnionPay",
  };
  return map[brand.toLowerCase()] ?? brand;
}

export async function GET() {
  const storeId = await getAuthenticatedShopJobId();
  if (!storeId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const subscription = await getStoreSubscription(storeId);
    let paymentMethod: PaymentMethodInfo = null;

    if (subscription?.stripeCustomerId) {
      const stripe = getStripeServer();
      const customer = await stripe.customers.retrieve(subscription.stripeCustomerId, {
        expand: ["invoice_settings.default_payment_method"],
      });
      if (!customer.deleted) {
        const pm = customer.invoice_settings.default_payment_method;
        if (pm && typeof pm !== "string" && pm.type === "card" && pm.card) {
          paymentMethod = {
            brand: formatCardBrand(pm.card.brand),
            last4: pm.card.last4 ?? null,
            expMonth: pm.card.exp_month ?? null,
            expYear: pm.card.exp_year ?? null,
          };
        }
      }
    }

    return NextResponse.json({
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            stripeCustomerId: subscription.stripeCustomerId,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
          }
        : null,
      paymentMethod,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "契約情報の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
