"use client";

import { useEffect, useMemo, useState } from "react";
import {
  STRIPE_BILLING_DEFINITIONS,
  STRIPE_BILLING_KEYS,
  type StripeBillingKey,
} from "@/lib/stripe-billing";

type AdminSubscription = {
  id: string;
  storeId: string;
  shopName: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  plan: "light" | "standard" | "premium";
  billingKey: StripeBillingKey | null;
  billingLabel: string | null;
  status: string;
  paymentStatus: string | null;
  paymentFailedCount: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscriptions", { cache: "no-store" });
      const data = (await res.json()) as {
        subscriptions?: AdminSubscription[];
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "契約一覧の取得に失敗しました。");
      setRows(data.subscriptions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "契約一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [rows],
  );

  async function performAction(
    subscriptionId: string,
    action: "change_plan" | "pause" | "resume" | "cancel",
    plan?: StripeBillingKey,
  ) {
    setActionLoadingId(subscriptionId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, plan }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message ?? "操作に失敗しました。");
      }
      setActionMessage("契約操作を反映しました。");
      await load();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "操作に失敗しました。");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div>
      <header className="admin-page-header">
        <h1>Stripe契約管理</h1>
        <p>契約状態・次回請求日・Stripe IDを確認し、管理者操作を実行します。</p>
      </header>

      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {actionMessage ? (
        <p className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {actionMessage}
        </p>
      ) : null}

      <div className="rounded-xl border border-gold/20 bg-white p-4">
        {loading ? (
          <p className="admin-muted">読み込み中...</p>
        ) : sorted.length === 0 ? (
          <p className="admin-muted">契約データはまだありません。</p>
        ) : (
          <div className="space-y-4">
            {sorted.map((item) => (
              <article key={item.id} className="rounded-xl border border-gold/25 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-charcoal">
                    {item.shopName ?? "店舗名未設定"}（
                    {item.billingLabel ?? item.plan}）
                  </h2>
                  <span className="rounded-full border border-gold/30 bg-ivory px-2 py-1 text-xs text-gold-dark">
                    {item.status}
                  </span>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted">契約日</dt>
                    <dd>{formatDate(item.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">次回請求日</dt>
                    <dd>{formatDate(item.currentPeriodEnd)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Stripe Customer ID</dt>
                    <dd className="break-all">{item.stripeCustomerId ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Subscription ID</dt>
                    <dd className="break-all">{item.stripeSubscriptionId ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Price ID</dt>
                    <dd className="break-all">{item.stripePriceId ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">決済状態 / 失敗回数</dt>
                    <dd>
                      {item.paymentStatus ?? "—"} / {item.paymentFailedCount}
                    </dd>
                  </div>
                </dl>

                {item.stripeSubscriptionId ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {STRIPE_BILLING_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          void performAction(
                            item.stripeSubscriptionId!,
                            "change_plan",
                            key,
                          )
                        }
                        disabled={
                          actionLoadingId === item.stripeSubscriptionId ||
                          item.billingKey === key
                        }
                        className="rounded-full border border-gold/35 px-3 py-1.5 text-xs text-gold-dark disabled:opacity-50"
                      >
                        {STRIPE_BILLING_DEFINITIONS[key].label}へ変更
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => void performAction(item.stripeSubscriptionId!, "pause")}
                      disabled={actionLoadingId === item.stripeSubscriptionId}
                      className="rounded-full border border-charcoal/25 px-3 py-1.5 text-xs text-charcoal"
                    >
                      契約停止
                    </button>
                    <button
                      type="button"
                      onClick={() => void performAction(item.stripeSubscriptionId!, "resume")}
                      disabled={actionLoadingId === item.stripeSubscriptionId}
                      className="rounded-full border border-green-500/35 px-3 py-1.5 text-xs text-green-700"
                    >
                      契約再開
                    </button>
                    <button
                      type="button"
                      onClick={() => void performAction(item.stripeSubscriptionId!, "cancel")}
                      disabled={actionLoadingId === item.stripeSubscriptionId}
                      className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-700"
                    >
                      解約
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
