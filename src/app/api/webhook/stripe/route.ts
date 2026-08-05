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

/**
 * 運営発行の Payment Link / Checkout から store_id を解決する。
 * 優先順位:
 * 1. session.metadata.store_id
 * 2. session.client_reference_id（Payment Link の ?client_reference_id=jobs.id）
 * 3. subscription.metadata.store_id
 */
function resolveStoreIdFromCheckout(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription,
): string | undefined {
  const fromSessionMeta = session.metadata?.store_id?.trim();
  if (fromSessionMeta) return fromSessionMeta;

  const fromClientRef = session.client_reference_id?.trim();
  if (fromClientRef) return fromClientRef;

  const fromSubMeta = subscription.metadata?.store_id?.trim();
  if (fromSubMeta) return fromSubMeta;

  return undefined;
}

async function attachStoreIdToStripeObjects(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  storeId: string,
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer &&
          !("deleted" in subscription.customer && subscription.customer.deleted)
        ? subscription.customer.id
        : null;

  if (customerId) {
    await stripe.customers.update(customerId, {
      metadata: {
        store_id: storeId,
        source: "white-night-job",
      },
    });
  }

  await stripe.subscriptions.update(subscription.id, {
    metadata: {
      ...subscription.metadata,
      store_id: storeId,
    },
  });
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
          let sub = await stripe.subscriptions.retrieve(String(session.subscription), {
            expand: ["customer", "latest_invoice"],
          });
          const storeId = resolveStoreIdFromCheckout(session, sub);
          if (storeId && sub.metadata?.store_id !== storeId) {
            await attachStoreIdToStripeObjects(stripe, sub, storeId);
            sub = await stripe.subscriptions.retrieve(sub.id, {
              expand: ["customer", "latest_invoice"],
            });
          }
          await upsertSubscriptionFromStripe(sub, {
            fallbackStoreId: storeId,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        try {
          await upsertSubscriptionFromStripe(sub);
        } catch (error) {
          // Payment Link 直後は store_id 未付与のまま subscription.created が先に来る場合がある。
          // checkout.session.completed 側で紐付けするため、ここでは再試行可能な一時失敗として握りつぶさない。
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("store_id is missing")) {
            console.warn("[stripe-webhook] skip subscription event without store_id", {
              type: event.type,
              subscriptionId: sub.id,
            });
            break;
          }
          throw error;
        }
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
