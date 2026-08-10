/**
 * One-off: list subscriptions + upcoming invoice totals (read-only).
 * 通常のプラン変更処理ではありません。
 * Run: node scripts/one-off/inspect-stripe-subs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "..", ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-07-29.dahlia",
});

const special = env.STRIPE_PRICE_ID_STANDARD_SPECIAL;
const standard = env.STRIPE_PRICE_ID_STANDARD;
console.log("prices", { special, standard });

const subs = await stripe.subscriptions.list({
  status: "all",
  limit: 100,
  expand: ["data.items.data.price"],
});

for (const s of subs.data) {
  const price = s.items.data[0]?.price;
  const periodEnd = s.items.data[0]?.current_period_end;
  const customerId =
    typeof s.customer === "string" ? s.customer : s.customer?.id;
  console.log("---");
  console.log({
    id: s.id,
    status: s.status,
    amount: price?.unit_amount,
    priceId: price?.id,
    periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    schedule: s.schedule,
    metadata: s.metadata,
  });

  try {
    const upcoming = await stripe.invoices.createPreview({
      customer: customerId,
      subscription: s.id,
    });
    console.log("upcoming_total", upcoming.total);
    console.log(
      "upcoming_lines",
      upcoming.lines.data.map((l) => ({
        amount: l.amount,
        description: l.description,
        proration: l.proration,
        price:
          l.pricing?.price_details?.price ??
          (typeof l.price === "string" ? l.price : l.price?.id),
      })),
    );
  } catch (e) {
    console.log("upcoming_err", e instanceof Error ? e.message : e);
  }

  for (const status of ["draft", "open"]) {
    const list = await stripe.invoices.list({
      customer: customerId,
      status,
      limit: 5,
    });
    for (const inv of list.data) {
      console.log(status, inv.id, inv.total, {
        lines: inv.lines.data.map((l) => ({
          amount: l.amount,
          description: l.description,
          proration: l.proration,
        })),
      });
    }
  }

  const items = await stripe.invoiceItems.list({
    customer: customerId,
    pending: true,
    limit: 20,
  });
  if (items.data.length) {
    console.log(
      "pending_invoice_items",
      items.data.map((i) => ({
        id: i.id,
        amount: i.amount,
        description: i.description,
        invoice: i.invoice,
        price: typeof i.price === "string" ? i.price : i.price?.id,
      })),
    );
  }
}
