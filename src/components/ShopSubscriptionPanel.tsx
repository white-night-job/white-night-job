"use client";

import { useEffect, useMemo, useState } from "react";
import {
  JOB_PLANS,
  JOB_PLAN_DEFINITIONS,
  parseJobPlan,
  type JobPlan,
} from "@/lib/job-plan";
import type { SubscriptionRecord } from "@/types/subscription";

type SubscriptionResponse = {
  subscription: (SubscriptionRecord & {
    billingKey?: string | null;
    billingLabel?: string | null;
  }) | null;
  defaultPaymentMethodSummary: string | null;
  message?: string;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "有効";
    case "trialing":
      return "トライアル";
    case "past_due":
      return "支払い遅延";
    case "unpaid":
      return "未払い";
    case "canceled":
      return "解約済み";
    case "paused":
      return "停止中";
    case "incomplete":
    case "incomplete_expired":
      return "手続き中";
    default:
      return "未契約";
  }
}

export function ShopSubscriptionPanel() {
  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState<JobPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [state, setState] = useState<SubscriptionResponse>({
    subscription: null,
    defaultPaymentMethodSummary: null,
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop-dashboard/subscription", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as SubscriptionResponse;
      if (!res.ok) throw new Error(data.message ?? "契約情報の取得に失敗しました。");
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "契約情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const currentPlan = useMemo(
    () => parseJobPlan(state.subscription?.plan),
    [state.subscription?.plan],
  );
  const isActive =
    state.subscription?.status === "active" ||
    state.subscription?.status === "trialing";

  async function handleCheckout(plan: JobPlan) {
    if (isActive) {
      setError("有効な契約があります。プラン変更は運営へご依頼ください。");
      return;
    }
    setSubmittingPlan(plan);
    setError(null);
    try {
      const res = await fetch("/api/shop-dashboard/subscription/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.message ?? "決済画面を開けませんでした。");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "決済開始に失敗しました。");
      setSubmittingPlan(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop-dashboard/subscription/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.message ?? "ポータルを開けませんでした。");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "ポータルを開けませんでした。");
      setPortalLoading(false);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
      <h2 className="font-serif text-lg font-semibold text-charcoal">決済・契約情報</h2>
      <p className="mt-1 text-xs text-muted">
        契約後は毎月自動課金されます。プラン変更・停止・解約は運営管理画面で行います。
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 rounded-xl border border-gold/15 bg-ivory/45 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">現在契約中プラン</dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal">
            {loading
              ? "読み込み中…"
              : state.subscription
                ? state.subscription.billingLabel ??
                  JOB_PLAN_DEFINITIONS[currentPlan].label
                : "未契約"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">決済状況</dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal">
            {loading ? "読み込み中…" : statusLabel(state.subscription?.status)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">契約開始日</dt>
          <dd className="mt-1 text-sm text-charcoal">
            {loading
              ? "読み込み中…"
              : formatDate(state.subscription?.currentPeriodStart ?? null)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">次回請求日</dt>
          <dd className="mt-1 text-sm text-charcoal">
            {loading
              ? "読み込み中…"
              : formatDate(state.subscription?.currentPeriodEnd ?? null)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="text-xs text-muted">
          支払い方法: {loading ? "読み込み中…" : state.defaultPaymentMethodSummary ?? "未登録"}
        </p>
        <button
          type="button"
          onClick={() => void handlePortal()}
          disabled={loading || !state.subscription || portalLoading}
          className="mt-2 rounded-full border border-gold/30 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60"
        >
          {portalLoading ? "遷移中…" : "支払い方法を変更"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {JOB_PLANS.map((plan) => {
          const label = JOB_PLAN_DEFINITIONS[plan].label;
          const activePlan = isActive && currentPlan === plan;
          return (
            <article key={plan} className="rounded-xl border border-gold/20 bg-white p-3">
              <p className="text-sm font-semibold text-charcoal">{label}</p>
              <p className="mt-1 text-xs text-muted">金額はStripe Checkout上で表示されます。</p>
              <button
                type="button"
                onClick={() => void handleCheckout(plan)}
                disabled={loading || isActive || Boolean(submittingPlan)}
                className="mt-3 w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingPlan === plan
                  ? "処理中…"
                  : activePlan
                    ? "契約中"
                    : isActive
                      ? "契約中（変更不可）"
                      : "契約する"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

