import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getErrorMessage } from "@/lib/api-error";
import { getStripeServer, getStripeWebhookSecret } from "@/lib/stripe";
import {
  notifyStripeCanceled,
  notifyStripeInvoicePaid,
  notifyStripeNewContract,
  notifyStripePaymentFailed,
} from "@/lib/stripe-admin-notify";
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

async function safeNotify(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error("[stripe-webhook] notify failed", error);
  }
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
            expand: ["customer", "latest_invoice", "items.data.price"],
          });
          const storeId = resolveStoreIdFromCheckout(session, sub);
          if (storeId && sub.metadata?.store_id !== storeId) {
            await attachStoreIdToStripeObjects(stripe, sub, storeId);
            sub = await stripe.subscriptions.retrieve(sub.id, {
              expand: ["customer", "latest_invoice", "items.data.price"],
            });
          }
          const record = await upsertSubscriptionFromStripe(sub, {
            fallbackStoreId: storeId,
          });
          await safeNotify(() =>
            notifyStripeNewContract({
              record,
              stripeSubscription: sub,
              sourceEvent: "checkout.session.completed",
            }),
          );
        }
        break;
      }
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        try {
          const stripe = getStripeServer();
          const full = await stripe.subscriptions.retrieve(sub.id, {
            expand: ["customer", "latest_invoice", "items.data.price"],
          });
          const record = await upsertSubscriptionFromStripe(full);
          await safeNotify(() =>
            notifyStripeNewContract({
              record,
              stripeSubscription: full,
              sourceEvent: "customer.subscription.created",
            }),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("store_id is missing")) {
            console.warn("[stripe-webhook] skip subscription.created without store_id", {
              subscriptionId: sub.id,
            });
            break;
          }
          throw error;
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        try {
          await upsertSubscriptionFromStripe(sub);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("store_id is missing")) {
            console.warn("[stripe-webhook] skip subscription.updated without store_id", {
              subscriptionId: sub.id,
            });
            break;
          }
          throw error;
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        try {
          const record = await upsertSubscriptionFromStripe(sub);
          await safeNotify(() => notifyStripeCanceled({ record }));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("store_id is missing")) {
            console.warn("[stripe-webhook] skip subscription.deleted without store_id", {
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
          const record = await markInvoicePaid(
            subscriptionId,
            invoice.period_start ?? null,
            invoice.period_end ?? null,
          );
          if (record) {
            await safeNotify(() =>
              notifyStripeInvoicePaid({
                record,
                billingReason: invoice.billing_reason ?? null,
              }),
            );
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (subscriptionId) {
          const record = await markInvoicePaymentFailed(subscriptionId);
          if (record) {
            await safeNotify(() => notifyStripePaymentFailed({ record }));
          }
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
