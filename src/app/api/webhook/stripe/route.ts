import type Stripe from "stripe";
import {
  markInvoicePaid,
  markInvoicePaymentFailed,
  upsertSubscriptionFromStripe,
} from "@/lib/subscriptions";
import {
  notifyStripeCanceled,
  notifyStripeInvoicePaid,
  notifyStripeNewContract,
  notifyStripePaymentFailed,
} from "@/lib/stripe-admin-notify";
import { hasRecentAdminNotificationByKey } from "@/lib/admin-notifications";
import { getStripeServer, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

function getSubscriptionIdFromInvoice(
  invoice: Stripe.Invoice,
): string | null {
  const parent = invoice.parent;
  if (
    parent?.type === "subscription_details" &&
    parent.subscription_details?.subscription
  ) {
    const sub = parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  return null;
}

function linePeriodStart(invoice: Stripe.Invoice): number | null {
  return invoice.lines?.data?.[0]?.period?.start ?? null;
}

function linePeriodEnd(invoice: Stripe.Invoice): number | null {
  return invoice.lines?.data?.[0]?.period?.end ?? null;
}

/**
 * Checkout Session から店舗 ID を解決。
 * 確実な識別子のみ（メール一致では自動確定しない）。
 * 優先: metadata.store_id → client_reference_id
 */
async function resolveStoreIdFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const fromMetadata =
    typeof session.metadata?.store_id === "string"
      ? session.metadata.store_id.trim()
      : "";
  if (fromMetadata) return fromMetadata;

  const fromClientRef =
    typeof session.client_reference_id === "string"
      ? session.client_reference_id.trim()
      : "";
  if (fromClientRef) return fromClientRef;

  return null;
}

async function attachStoreMetadataToStripeObjects(params: {
  storeId: string;
  subscriptionId: string;
  customerId: string | null;
}) {
  const stripe = getStripeServer();
  await stripe.subscriptions.update(params.subscriptionId, {
    metadata: { store_id: params.storeId },
  });
  if (params.customerId) {
    await stripe.customers.update(params.customerId, {
      metadata: { store_id: params.storeId },
    });
  }
}

async function retrieveSubscriptionExpanded(subscriptionId: string) {
  const stripe = getStripeServer();
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price", "latest_invoice", "customer"],
  });
}

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const webhookSecret = getStripeWebhookSecret();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subscriptionId) break;

        const storeId = await resolveStoreIdFromCheckoutSession(session);
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        if (storeId) {
          await attachStoreMetadataToStripeObjects({
            storeId,
            subscriptionId,
            customerId,
          });
        }

        const subscription = await retrieveSubscriptionExpanded(subscriptionId);
        const record = await upsertSubscriptionFromStripe(subscription, {
          fallbackStoreId: storeId,
        });
        await notifyStripeNewContract({
          record,
          stripeSubscription: subscription,
          sourceEvent: "checkout.session.completed",
        }).catch((error) => {
          console.error("[stripe webhook] admin notify checkout failed", error);
        });
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const full = await retrieveSubscriptionExpanded(subscription.id);
        const record = await upsertSubscriptionFromStripe(full, {
          preserveFailureCount: true,
        });
        await notifyStripeNewContract({
          record,
          stripeSubscription: full,
          sourceEvent: "customer.subscription.created",
        }).catch((error) => {
          console.error("[stripe webhook] admin notify created failed", error);
        });
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const full = await retrieveSubscriptionExpanded(subscription.id);
        await upsertSubscriptionFromStripe(full, { preserveFailureCount: true });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const full = await retrieveSubscriptionExpanded(subscription.id);
        const record = await upsertSubscriptionFromStripe(full);
        await notifyStripeCanceled({ record }).catch((error) => {
          console.error("[stripe webhook] admin notify cancel failed", error);
        });
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;
        let record = await markInvoicePaid(
          subscriptionId,
          linePeriodStart(invoice),
          linePeriodEnd(invoice),
        );
        if (!record) {
          const full = await retrieveSubscriptionExpanded(subscriptionId);
          record = await upsertSubscriptionFromStripe(full);
        }
        if (record) {
          await notifyStripeInvoicePaid({
            record,
            billingReason: invoice.billing_reason,
            amountPaid: invoice.amount_paid,
          }).catch((error) => {
            console.error("[stripe webhook] admin notify invoice.paid", error);
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;

        // 同一 Invoice の再送では失敗回数加算・通知をスキップ
        const invoiceId = invoice.id;
        if (invoiceId) {
          const already = await hasRecentAdminNotificationByKey({
            type: "stripe_payment_failed",
            contains: invoiceId,
            withinMinutes: 24 * 60,
          });
          if (already) {
            // 契約状態だけ Stripe 最新に寄せる（失敗回数は増やさない）
            const full = await retrieveSubscriptionExpanded(subscriptionId);
            await upsertSubscriptionFromStripe(full, {
              preserveFailureCount: true,
            });
            break;
          }
        }

        let record = await markInvoicePaymentFailed(subscriptionId, {
          attemptCount: invoice.attempt_count,
          invoiceId,
        });
        if (!record) {
          const full = await retrieveSubscriptionExpanded(subscriptionId);
          await upsertSubscriptionFromStripe(full);
          record = await markInvoicePaymentFailed(subscriptionId, {
            attemptCount: invoice.attempt_count,
            invoiceId,
          });
        }
        if (record) {
          await notifyStripePaymentFailed({ record, invoice }).catch((error) => {
            console.error("[stripe webhook] admin notify payment_failed", error);
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe webhook]", event.type, error);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
