/**
 * 【一度限りの救急修復】通常のプラン変更処理ではありません。
 *
 * 対象: sub_1U2w1zRvFonBejoWijyH1BiZ のみ
 * 目的: 即時プラン変更＋日割りを取り消し、
 *       今期=特別価格 / 次回更新から通常価格 に戻す
 *
 * 管理画面のプラン変更は使いません。再実行しないでください（修復済み）。
 *
 * どうしても再実行する場合のみ:
 *   CONFIRM_STRIPE_REPAIR=sub_1U2w1zRvFonBejoWijyH1BiZ node scripts/one-off/repair-sub_1U2w1z-immediate-plan-change.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const TARGET_SUBSCRIPTION_ID = "sub_1U2w1zRvFonBejoWijyH1BiZ";

if (process.env.CONFIRM_STRIPE_REPAIR !== TARGET_SUBSCRIPTION_ID) {
  console.error(
    [
      "ABORT: これは one-off 修復スクリプトです。通常のプラン変更には使えません。",
      `再実行する場合のみ CONFIRM_STRIPE_REPAIR=${TARGET_SUBSCRIPTION_ID} を付けてください。`,
      "管理画面のプラン変更は schedulePlanChangeAtPeriodEnd（次回更新日切替）を使います。",
    ].join("\n"),
  );
  process.exit(1);
}

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

const SPECIAL = env.STRIPE_PRICE_ID_STANDARD_SPECIAL;
const STANDARD = env.STRIPE_PRICE_ID_STANDARD;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sub = await stripe.subscriptions.retrieve(TARGET_SUBSCRIPTION_ID, {
  expand: ["items.data.price"],
});
assert(sub.id === TARGET_SUBSCRIPTION_ID, "subscription id mismatch");
assert(sub.status === "active", `unexpected status: ${sub.status}`);

const customerId =
  typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
assert(customerId, "customer missing");
const itemId = sub.items.data[0]?.id;
assert(itemId, "item missing");
const periodEnd = sub.items.data[0]?.current_period_end;
assert(periodEnd, "period end missing");

console.log("TARGET", {
  id: sub.id,
  customerId,
  currentPrice: sub.items.data[0]?.price?.id,
  currentAmount: sub.items.data[0]?.price?.unit_amount,
  periodEnd: new Date(periodEnd * 1000).toISOString(),
});

const pendingItems = await stripe.invoiceItems.list({
  customer: customerId,
  pending: true,
  limit: 100,
});
const prorationItems = pendingItems.data.filter((item) => {
  const desc = (item.description ?? "").toLowerCase();
  return (
    desc.includes("未使用") ||
    desc.includes("残り時間") ||
    desc.includes("unused") ||
    desc.includes("remaining") ||
    Boolean(item.proration)
  );
});
console.log(
  "deleting_invoice_items",
  prorationItems.map((i) => ({ id: i.id, amount: i.amount, d: i.description })),
);
for (const item of prorationItems) {
  await stripe.invoiceItems.del(item.id);
}

if (sub.schedule) {
  const scheduleId =
    typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
  try {
    await stripe.subscriptionSchedules.release(scheduleId);
    console.log("released_schedule", scheduleId);
  } catch (e) {
    console.log("release_skip", e instanceof Error ? e.message : e);
  }
}

const reverted = await stripe.subscriptions.update(TARGET_SUBSCRIPTION_ID, {
  items: [{ id: itemId, price: SPECIAL }],
  proration_behavior: "none",
  metadata: {
    ...sub.metadata,
    billing_key: "standard_special",
    pending_billing_key: "standard",
    pending_price_id: STANDARD,
    pending_change_at: String(periodEnd),
  },
});
console.log("reverted_price", reverted.items.data[0]?.price?.id);

const createdSchedule = await stripe.subscriptionSchedules.create({
  from_subscription: TARGET_SUBSCRIPTION_ID,
});
const updatedSchedule = await stripe.subscriptionSchedules.update(
  createdSchedule.id,
  {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: SPECIAL, quantity: 1 }],
        start_date: createdSchedule.phases[0].start_date,
        end_date: periodEnd,
        proration_behavior: "none",
        metadata: { billing_key: "standard_special" },
      },
      {
        items: [{ price: STANDARD, quantity: 1 }],
        proration_behavior: "none",
        metadata: { billing_key: "standard" },
      },
    ],
  },
);
console.log("schedule", {
  id: updatedSchedule.id,
  status: updatedSchedule.status,
  phases: updatedSchedule.phases.map((p) => ({
    start: new Date(p.start_date * 1000).toISOString(),
    end: p.end_date ? new Date(p.end_date * 1000).toISOString() : null,
    price:
      typeof p.items[0]?.price === "string"
        ? p.items[0].price
        : p.items[0]?.price?.id,
  })),
});

const finalSub = await stripe.subscriptions.retrieve(TARGET_SUBSCRIPTION_ID, {
  expand: ["items.data.price"],
});
const preview = await stripe.invoices.createPreview({
  customer: customerId,
  subscription: TARGET_SUBSCRIPTION_ID,
});

console.log("RESULT", {
  subscriptionId: finalSub.id,
  currentPrice: finalSub.items.data[0]?.price?.id,
  currentAmount: finalSub.items.data[0]?.price?.unit_amount,
  schedule: finalSub.schedule,
  upcomingTotal: preview.total,
  upcomingLines: preview.lines.data.map((l) => ({
    amount: l.amount,
    description: l.description,
    proration: l.proration,
  })),
});

if (finalSub.items.data[0]?.price?.id !== SPECIAL) {
  throw new Error("current price is not standard_special");
}
if (preview.total !== 33000) {
  throw new Error(
    `upcoming total expected 33000, got ${preview.total}. Inspect Stripe Dashboard before charging.`,
  );
}
console.log("OK: repaired successfully. upcoming=33000, current=special");
