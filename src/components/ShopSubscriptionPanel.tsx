"use client";

import { useEffect, useState } from "react";
import { JOB_PLAN_DEFINITIONS, parseJobPlan, type JobPlan } from "@/lib/job-plan";

type PaymentMethodInfo = {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
} | null;

type SubscriptionSummary = {
  plan: JobPlan;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type SubscriptionResponse = {
  subscription: SubscriptionSummary | null;
  paymentMethod: PaymentMethodInfo;
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

function statusLabelJa(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "有効";
    case "trialing":
      return "トライアル中";
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

function statusToneClass(status: string | null | undefined): string {
  switch (status) {
    case "active":
    case "trialing":
      return "border-green-200 bg-green-50 text-green-800";
    case "past_due":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "unpaid":
    case "canceled":
      return "border-red-200 bg-red-50 text-red-800";
    case "paused":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    default:
      return "border-gold/25 bg-ivory text-muted";
  }
}

function formatPaymentMethod(pm: PaymentMethodInfo): string {
  if (!pm?.last4) return "未登録";
  const brand = pm.brand ?? "カード";
  const exp =
    pm.expMonth && pm.expYear
      ? `（有効期限 ${String(pm.expMonth).padStart(2, "0")}/${String(pm.expYear).slice(-2)}）`
      : "";
  return `${brand} •••• ${pm.last4}${exp}`;
}

/**
 * 店舗ダッシュボードの決済・契約情報。
 * 閲覧と支払い方法変更のみ。契約・プラン変更・解約の導線は持たない。
 */
export function ShopSubscriptionPanel() {
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodInfo>(null);
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
      setSubscription(data.subscription);
      setPaymentMethod(data.paymentMethod);
    } catch (err) {
      setError(err instanceof Error ? err.message : "契約情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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

  const planLabel = subscription
    ? JOB_PLAN_DEFINITIONS[parseJobPlan(subscription.plan)].label
    : "—";
  const canOpenPortal = Boolean(subscription?.stripeCustomerId);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-gold">
      <div className="border-b border-gold/15 px-5 py-4 sm:px-6">
        <h2 className="font-serif text-lg font-semibold text-charcoal">決済・契約情報</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          契約内容の確認と支払い方法の変更ができます。プラン変更・解約は運営までご連絡ください。
        </p>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="h-20 animate-pulse rounded-xl border border-gold/15 bg-ivory/60"
              />
            ))}
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gold/20 bg-ivory/50 p-4">
              <dt className="text-xs font-medium text-muted">現在の契約プラン</dt>
              <dd className="mt-2 text-base font-semibold text-charcoal">{planLabel}</dd>
            </div>
            <div className="rounded-xl border border-gold/20 bg-ivory/50 p-4">
              <dt className="text-xs font-medium text-muted">契約状態</dt>
              <dd className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold ${statusToneClass(subscription?.status)}`}
                >
                  {statusLabelJa(subscription?.status)}
                </span>
              </dd>
            </div>
            <div className="rounded-xl border border-gold/20 bg-ivory/50 p-4">
              <dt className="text-xs font-medium text-muted">次回請求日</dt>
              <dd className="mt-2 text-base font-semibold text-charcoal">
                {formatDate(subscription?.currentPeriodEnd)}
              </dd>
            </div>
            <div className="rounded-xl border border-gold/20 bg-ivory/50 p-4">
              <dt className="text-xs font-medium text-muted">登録済みの支払い方法</dt>
              <dd className="mt-2 text-base font-semibold text-charcoal">
                {formatPaymentMethod(paymentMethod)}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={() => void handlePortal()}
            disabled={loading || portalLoading || !canOpenPortal}
            className="rounded-full border border-gold/35 bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {portalLoading ? "遷移中…" : "支払い方法を変更する"}
          </button>
          {!loading && !canOpenPortal ? (
            <p className="mt-2 text-xs text-muted">
              契約開始後に支払い方法の変更が利用できます。
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
