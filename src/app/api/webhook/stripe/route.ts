import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getErrorMessage } from "@/lib/api-error";
import { getStripeServer, getStripeWebhookSecret } from "@/lib/stripe";
import {
  markInvoicePaid,
  markInvoicePaymentFailed,
  upsertSubscriptionFromStripe,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const fromParent =
    invoice.parent &&
    typeof invoice.parent !== "string" &&
    invoice.parent.subscription_details?.subscription;
  if (typeof fromParent === "string" && fromParent.length > 0) {
    return fromParent;
  }

  const legacy = (invoice as unknown as { subscription?: string | null }).subscription;
  if (typeof legacy === "string" && legacy.length > 0) {
    return legacy;
  }
  return null;
}

async function verifyEvent(request: Request): Promise<Stripe.Event> {
  const signature = (await headers()).get("stripe-signature");
  if (!signature) throw new Error("stripe-signature header is missing.");
  const payload = await request.text();
  const stripe = getStripeServer();
  return stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
}

export async function POST(request: Request) {
  let event: Stripe.Event;
  try {
    event = await verifyEvent(request);
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "署名検証に失敗しました。") },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const stripe = getStripeServer();
          const sub = await stripe.subscriptions.retrieve(String(session.subscription), {
            expand: ["customer", "latest_invoice"],
          });
          await upsertSubscriptionFromStripe(sub, {
            fallbackStoreId: session.metadata?.store_id,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripe(sub);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (subscriptionId) {
          await markInvoicePaid(
            subscriptionId,
            invoice.period_start ?? null,
            invoice.period_end ?? null,
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (subscriptionId) {
          await markInvoicePaymentFailed(subscriptionId);
        }
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "Webhook処理に失敗しました。") },
      { status: 500 },
    );
  }
}

