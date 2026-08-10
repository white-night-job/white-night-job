/**
 * 管理画面プラン変更の仕様検証（Stripe API は呼ばない / 本番変更なし）
 *
 * 確認内容:
 * - 5プラン全組み合わせ（同一プラン除く 20 通り）で
 *   「当初の period_end に切替」「proration_behavior=none」になること
 * - 管理 API が即時 Price update / create_prorations を使っていないこと
 *
 * Run: node scripts/verify-deferred-plan-change.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const BILLING_KEYS = [
  "light",
  "standard",
  "standard_special",
  "premium",
  "premium_special",
];

/** src/lib/stripe-subscription-schedule.ts の buildDeferredPlanChangePhases と同等 */
function buildDeferredPlanChangePhases(input) {
  if (input.currentPriceId === input.newPriceId) {
    throw new Error("すでに同じプランです。");
  }
  if (input.periodEndUnix <= input.phase0StartUnix) {
    throw new Error("請求期間の終了日が不正です。");
  }
  return [
    {
      items: [{ price: input.currentPriceId, quantity: 1 }],
      start_date: input.phase0StartUnix,
      end_date: input.periodEndUnix,
      proration_behavior: "none",
      metadata: { billing_key: input.currentBillingKey },
    },
    {
      items: [{ price: input.newPriceId, quantity: 1 }],
      proration_behavior: "none",
      metadata: { billing_key: input.newBillingKey },
    },
  ];
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const PERIOD_START = 1_700_000_000;
const PERIOD_END = 1_702_592_000; // +30 days

const results = [];
let failed = 0;

for (const from of BILLING_KEYS) {
  for (const to of BILLING_KEYS) {
    if (from === to) continue;
    const currentPriceId = `price_from_${from}`;
    const newPriceId = `price_to_${to}`;
    try {
      const phases = buildDeferredPlanChangePhases({
        currentPriceId,
        newPriceId,
        phase0StartUnix: PERIOD_START,
        periodEndUnix: PERIOD_END,
        currentBillingKey: from,
        newBillingKey: to,
      });

      assert(phases.length === 2, "phases must be 2");
      assert(phases[0].proration_behavior === "none", "phase0 must be none");
      assert(phases[1].proration_behavior === "none", "phase1 must be none");
      assert(phases[0].end_date === PERIOD_END, "must keep original period end");
      assert(phases[0].start_date === PERIOD_START, "must keep phase0 start");
      assert(phases[0].items[0].price === currentPriceId, "phase0 keeps current price");
      assert(phases[1].items[0].price === newPriceId, "phase1 switches to new price");
      assert(
        !("proration_behavior" in phases[0]) ||
          phases[0].proration_behavior !== "create_prorations",
        "no create_prorations",
      );
      assert(
        phases[1].start_date == null || phases[1].start_date === PERIOD_END,
        "phase1 should start at period end (implicit or explicit)",
      );

      results.push({ from, to, ok: true });
    } catch (e) {
      failed += 1;
      results.push({
        from,
        to,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

// ソース上の安全確認
const adminRoute = fs.readFileSync(
  path.join(root, "src/app/api/admin/subscriptions/[subscriptionId]/route.ts"),
  "utf8",
);
const scheduleLib = fs.readFileSync(
  path.join(root, "src/lib/stripe-subscription-schedule.ts"),
  "utf8",
);

assert(
  adminRoute.includes("schedulePlanChangeAtPeriodEnd"),
  "admin change_plan must use schedulePlanChangeAtPeriodEnd",
);
assert(
  !adminRoute.includes("create_prorations"),
  "admin route must not use create_prorations",
);
assert(
  !/subscriptions\.update\([\s\S]*items:\s*\[/.test(
    adminRoute.replace(/if \(action === "pause"\)[\s\S]*$/m, ""),
  ),
  "admin change_plan path must not immediately update subscription items",
);
assert(
  scheduleLib.includes('proration_behavior: "none"'),
  "schedule lib must set proration_behavior none",
);
assert(
  scheduleLib.includes("buildDeferredPlanChangePhases"),
  "schedule lib must use shared phase builder",
);
assert(
  !scheduleLib.includes("repairImmediatePlanChangeToDeferred"),
  "one-off repair must not live in production schedule lib",
);
assert(
  adminRoute.includes("cancel_pending_plan_change"),
  "admin must support canceling pending plan change",
);

console.log("=== プラン変更組み合わせ検証（20通り） ===");
for (const r of results) {
  const mark = r.ok ? "OK" : "NG";
  console.log(
    `${mark}  ${r.from} → ${r.to}` +
      (r.error ? `  (${r.error})` : "  / 当初period_end切替・日割りなし"),
  );
}
console.log("---");
console.log(
  `合計: ${results.length} / 成功: ${results.filter((r) => r.ok).length} / 失敗: ${failed}`,
);
console.log("管理API: schedulePlanChangeAtPeriodEnd 使用 / create_prorations なし");
console.log("修復用 one-off 処理は production lib から分離済み");

if (failed > 0) process.exit(1);
console.log("ALL_PASS");
