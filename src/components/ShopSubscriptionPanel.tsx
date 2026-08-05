"use client";

import { useEffect, useMemo, useState } from "react";
import { JOB_PLAN_DEFINITIONS, parseJobPlan } from "@/lib/job-plan";
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
      return "有効（active）";
    case "trialing":
      return "トライアル（trialing）";
    case "past_due":
      return "支払い遅延（past_due）";
    case "unpaid":
      return "未払い（unpaid）";
    case "canceled":
      return "解約済み（canceled）";
    case "paused":
      return "停止中（paused）";
    case "incomplete":
    case "incomplete_expired":
      return "手続き中";
    default:
      return "—";
  }
}

/** 契約済み店舗のみ表示。契約導線なし（閲覧＋支払い方法変更のみ）。 */
export function ShopSubscriptionPanel() {
  const [loading, setLoading] = useState(true);
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

  const subscription = state.subscription;
  const hasContract = Boolean(subscription?.stripeSubscriptionId);
  const currentPlan = useMemo(
    () => parseJobPlan(subscription?.plan),
    [subscription?.plan],
  );

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

  if (loading) {
    return (
      <section className="mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
        <h2 className="font-serif text-lg font-semibold text-charcoal">決済・契約情報</h2>
        <p className="mt-3 text-sm text-muted">読み込み中…</p>
      </section>
    );
  }

  if (!hasContract) {
    return null;
  }

  return (
    <section className="mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
      <h2 className="font-serif text-lg font-semibold text-charcoal">決済・契約情報</h2>
      <p className="mt-1 text-xs text-muted">
        プラン変更・解約は店舗側では行えません。変更が必要な場合は運営までご連絡ください。
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 rounded-xl border border-gold/15 bg-ivory/45 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">現在の契約プラン</dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal">
            {subscription?.billingLabel ?? JOB_PLAN_DEFINITIONS[currentPlan].label}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">契約状態</dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal">
            {statusLabel(subscription?.status)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">次回請求日</dt>
          <dd className="mt-1 text-sm text-charcoal">
            {formatDate(subscription?.currentPeriodEnd ?? null)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">支払い方法</dt>
          <dd className="mt-1 text-sm text-charcoal">
            {state.defaultPaymentMethodSummary ?? "未登録"}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => void handlePortal()}
        disabled={portalLoading || !subscription?.stripeCustomerId}
        className="mt-4 rounded-full border border-gold/30 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60"
      >
        {portalLoading ? "遷移中…" : "支払い方法を変更"}
      </button>
    </section>
  );
}
