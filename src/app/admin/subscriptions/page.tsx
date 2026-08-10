"use client";

import { useEffect, useMemo, useState } from "react";
import {
  STRIPE_BILLING_DEFINITIONS,
  STRIPE_BILLING_KEYS,
  type StripeBillingKey,
} from "@/lib/stripe-billing";
import { subscriptionStatusLabelJa } from "@/types/subscription";

type AdminSubscription = {
  id: string;
  storeId: string | null;
  shopName: string | null;
  customerEmail: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  plan: "light" | "standard" | "premium";
  billingKey: StripeBillingKey | null;
  billingLabel: string | null;
  pendingStripePriceId: string | null;
  pendingChangeAt: string | null;
  pendingBillingKey: StripeBillingKey | null;
  pendingBillingLabel: string | null;
  hasPendingPlanChange: boolean;
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusBadgeClass(status: string, opts?: { cancelAtPeriodEnd?: boolean }): string {
  if (opts?.cancelAtPeriodEnd && status !== "canceled") {
    return "border-red-400/40 bg-red-50 text-red-800";
  }
  switch (status) {
    case "active":
    case "trialing":
      return "border-green-500/40 bg-green-50 text-green-800";
    case "past_due":
      return "border-amber-500/40 bg-amber-50 text-amber-900";
    case "unpaid":
    case "canceled":
      return "border-red-400/40 bg-red-50 text-red-800";
    case "paused":
      return "border-zinc-400/40 bg-zinc-100 text-zinc-700";
    default:
      return "border-gold/30 bg-ivory text-gold-dark";
  }
}

type StoreOption = {
  id: string;
  shopName: string;
  district: string | null;
  listingStatus: string | null;
  linkedStripeSubscriptionId: string | null;
};

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [linkTarget, setLinkTarget] = useState<AdminSubscription | null>(null);
  const [storeQuery, setStoreQuery] = useState("");
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
  const [linkStep, setLinkStep] = useState<"pick" | "confirm">("pick");
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

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

  async function syncFromStripe() {
    setSyncing(true);
    setActionMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscriptions/sync", {
        method: "POST",
      });
      const data = (await res.json()) as {
        message?: string;
        errors?: string[];
      };
      if (!res.ok) {
        throw new Error(data.message ?? "Stripe同期に失敗しました。");
      }
      const extra =
        data.errors && data.errors.length > 0
          ? `（一部失敗: ${data.errors.length}件）`
          : "";
      setActionMessage(`${data.message ?? "同期が完了しました。"}${extra}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stripe同期に失敗しました。");
    } finally {
      setSyncing(false);
    }
  }

  async function performAction(
    subscriptionId: string,
    action:
      | "change_plan"
      | "cancel_pending_plan_change"
      | "cancel"
      | "cancel_pending_cancellation",
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
      setActionMessage(data.message ?? "契約操作を反映しました。");
      await load();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "操作に失敗しました。");
    } finally {
      setActionLoadingId(null);
    }
  }

  function openLinkModal(item: AdminSubscription) {
    setLinkTarget(item);
    setStoreQuery("");
    setStores([]);
    setSelectedStore(null);
    setLinkStep("pick");
    setLinkError(null);
  }

  function closeLinkModal() {
    if (linkSubmitting) return;
    setLinkTarget(null);
    setSelectedStore(null);
    setLinkStep("pick");
    setLinkError(null);
  }

  async function searchStores(query: string) {
    setStoresLoading(true);
    setLinkError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(
        `/api/admin/subscriptions/stores?${params.toString()}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as {
        stores?: StoreOption[];
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "店舗一覧の取得に失敗しました。");
      setStores(data.stores ?? []);
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "店舗一覧の取得に失敗しました。",
      );
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }

  useEffect(() => {
    if (!linkTarget) return;
    const timer = window.setTimeout(() => {
      void searchStores(storeQuery);
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search on query/modal open
  }, [linkTarget, storeQuery]);

  async function submitLink(confirmReplaceExisting: boolean) {
    if (!linkTarget?.stripeSubscriptionId || !selectedStore) return;
    setLinkSubmitting(true);
    setLinkError(null);
    try {
      let confirmReplace = confirmReplaceExisting;
      for (;;) {
        const res = await fetch(
          `/api/admin/subscriptions/${linkTarget.stripeSubscriptionId}/link`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeId: selectedStore.id,
              confirmReplaceExisting: confirmReplace,
            }),
          },
        );
        const data = (await res.json()) as {
          message?: string;
          requiresConfirmReplace?: boolean;
          existingSubscriptionId?: string | null;
        };
        if (res.status === 409 && data.requiresConfirmReplace && !confirmReplace) {
          const ok = window.confirm(
            [
              `「${selectedStore.shopName}」にはすでに別契約が紐付いています。`,
              data.existingSubscriptionId
                ? `既存: ${data.existingSubscriptionId}`
                : null,
              "既存の紐付けを外し、この契約へ付け替えますか？",
              "（Stripeの料金・次回更新日・予約内容は変更されません）",
            ]
              .filter(Boolean)
              .join("\n"),
          );
          if (!ok) return;
          confirmReplace = true;
          continue;
        }
        if (!res.ok) {
          throw new Error(data.message ?? "紐付けに失敗しました。");
        }
        setActionMessage(data.message ?? "店舗に紐付けました。");
        setLinkTarget(null);
        setSelectedStore(null);
        await load();
        return;
      }
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "紐付けに失敗しました。");
    } finally {
      setLinkSubmitting(false);
    }
  }

  return (
    <div>
      <header className="admin-page-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1>Stripe契約管理</h1>
            <p>
              プラン変更・解約はいずれも即時ではなく、当初の次回更新日に反映されます。
              日割り請求はありません。未紐付け契約は「店舗を紐付け」から手動で店舗へ接続できます。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void syncFromStripe()}
            disabled={syncing || loading}
            className="shrink-0 rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {syncing ? "同期中…" : "Stripeから契約を同期"}
          </button>
        </div>
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
          <p className="admin-muted">
            契約データはまだありません。「Stripeから契約を同期」で既存契約を取り込めます。
          </p>
        ) : (
          <div className="space-y-4">
            {sorted.map((item) => {
              const unlinked = !item.storeId;
              const hasPendingPlan = Boolean(
                item.hasPendingPlanChange || item.pendingStripePriceId,
              );
              const hasPendingCancel =
                Boolean(item.cancelAtPeriodEnd) && item.status !== "canceled";
              const canOperate =
                item.status !== "canceled" && Boolean(item.stripeSubscriptionId);
              const statusLabel = hasPendingCancel
                ? "解約予約中"
                : hasPendingPlan
                  ? "プラン変更予約中"
                  : subscriptionStatusLabelJa(item.status);

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-gold/25 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-charcoal">
                        {unlinked
                          ? "店舗未紐付け"
                          : (item.shopName ?? "店舗名未設定")}
                        （{item.billingLabel ?? item.plan}）
                      </h2>
                      {unlinked ? (
                        <span className="rounded-full border border-red-400/50 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          店舗未紐付け
                        </span>
                      ) : null}
                      {hasPendingPlan ? (
                        <span className="rounded-full border border-amber-500/50 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                          プラン変更予約中
                        </span>
                      ) : null}
                      {hasPendingCancel ? (
                        <span className="rounded-full border border-red-400/50 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          解約予約中
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClass(item.status, { cancelAtPeriodEnd: hasPendingCancel })}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted">現在のプラン</dt>
                      <dd>{item.billingLabel ?? item.plan}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">契約状態</dt>
                      <dd>{subscriptionStatusLabelJa(item.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">次回更新日</dt>
                      <dd>{formatDate(item.currentPeriodEnd)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">変更予定プラン</dt>
                      <dd>
                        {hasPendingPlan
                          ? (item.pendingBillingLabel ??
                            item.pendingStripePriceId ??
                            "—")
                          : "なし"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">プラン変更の適用日</dt>
                      <dd>
                        {hasPendingPlan
                          ? formatDate(item.pendingChangeAt)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">解約予定日</dt>
                      <dd>
                        {hasPendingCancel
                          ? formatDate(item.currentPeriodEnd)
                          : "なし"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">顧客メール</dt>
                      <dd className="break-all">{item.customerEmail ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">契約開始日時</dt>
                      <dd>{formatDateTime(item.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Stripe Customer ID</dt>
                      <dd className="break-all">
                        {item.stripeCustomerId ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">
                        Stripe Subscription ID
                      </dt>
                      <dd className="break-all">
                        {item.stripeSubscriptionId ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  {unlinked && item.stripeSubscriptionId ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => openLinkModal(item)}
                        className="rounded-full border border-charcoal/30 bg-ivory px-3 py-1.5 text-xs font-medium text-charcoal"
                      >
                        店舗を紐付け
                      </button>
                    </div>
                  ) : null}

                  {canOperate ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {STRIPE_BILLING_KEYS.map((key) => {
                        const isCurrent =
                          item.billingKey === key && !hasPendingPlan;
                        const isPendingTarget = item.pendingBillingKey === key;
                        return (
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
                            className={`rounded-full border px-3 py-1.5 text-xs disabled:opacity-50 ${
                              isPendingTarget
                                ? "border-amber-500/50 bg-amber-50 text-amber-900"
                                : "border-gold/35 text-gold-dark"
                            }`}
                            title={
                              item.billingKey === key
                                ? "現在のプランです（期間中は維持）"
                                : "次回更新日から適用（日割りなし）"
                            }
                          >
                            {isPendingTarget
                              ? `${STRIPE_BILLING_DEFINITIONS[key].label}（予約中）`
                              : isCurrent
                                ? `${STRIPE_BILLING_DEFINITIONS[key].label}（現在）`
                                : `${STRIPE_BILLING_DEFINITIONS[key].label}へ変更`}
                          </button>
                        );
                      })}
                      {hasPendingPlan ? (
                        <button
                          type="button"
                          onClick={() =>
                            void performAction(
                              item.stripeSubscriptionId!,
                              "cancel_pending_plan_change",
                            )
                          }
                          disabled={
                            actionLoadingId === item.stripeSubscriptionId
                          }
                          className="rounded-full border border-amber-600/40 px-3 py-1.5 text-xs text-amber-900"
                        >
                          プラン変更予約を取消
                        </button>
                      ) : null}
                      {hasPendingCancel ? (
                        <button
                          type="button"
                          onClick={() =>
                            void performAction(
                              item.stripeSubscriptionId!,
                              "cancel_pending_cancellation",
                            )
                          }
                          disabled={
                            actionLoadingId === item.stripeSubscriptionId
                          }
                          className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-800"
                        >
                          解約予約を取消
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            void performAction(
                              item.stripeSubscriptionId!,
                              "cancel",
                            )
                          }
                          disabled={
                            actionLoadingId === item.stripeSubscriptionId
                          }
                          className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-700"
                        >
                          解約（次回更新日）
                        </button>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {linkTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="link-store-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-gold/30 bg-white p-5 shadow-lg">
            <h2
              id="link-store-title"
              className="text-lg font-semibold text-charcoal"
            >
              店舗を紐付け
            </h2>
            <p className="mt-1 text-sm text-muted">
              契約{" "}
              <span className="break-all font-mono text-xs">
                {linkTarget.stripeSubscriptionId}
              </span>{" "}
              を店舗へ紐付けます。Stripe
              の料金・次回更新日・予約内容は変更されません。
            </p>

            {linkStep === "pick" ? (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">
                    店舗名で検索
                  </span>
                  <input
                    type="search"
                    value={storeQuery}
                    onChange={(e) => setStoreQuery(e.target.value)}
                    placeholder="例: すすきの"
                    className="w-full rounded-lg border border-gold/30 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </label>
                <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-gold/15 p-2">
                  {storesLoading ? (
                    <p className="p-2 text-sm text-muted">検索中…</p>
                  ) : stores.length === 0 ? (
                    <p className="p-2 text-sm text-muted">該当する店舗がありません。</p>
                  ) : (
                    stores.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => setSelectedStore(store)}
                        className={`flex w-full flex-col rounded-lg border px-3 py-2 text-left text-sm ${
                          selectedStore?.id === store.id
                            ? "border-gold bg-gold/10"
                            : "border-transparent hover:bg-ivory"
                        }`}
                      >
                        <span className="font-medium text-charcoal">
                          {store.shopName}
                        </span>
                        <span className="text-xs text-muted">
                          {store.district ?? "エリア未設定"}
                          {store.linkedStripeSubscriptionId
                            ? " · 別契約が紐付き済み"
                            : ""}
                        </span>
                        {store.linkedStripeSubscriptionId ? (
                          <span className="mt-1 text-xs text-amber-800">
                            注意: 既存 {store.linkedStripeSubscriptionId}
                          </span>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
                {linkError ? (
                  <p className="text-sm text-red-700">{linkError}</p>
                ) : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeLinkModal}
                    disabled={linkSubmitting}
                    className="rounded-full border border-charcoal/25 px-4 py-1.5 text-xs text-charcoal"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    disabled={!selectedStore || linkSubmitting}
                    onClick={() => setLinkStep("confirm")}
                    className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    次へ（確認）
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  この契約を「{selectedStore?.shopName}」に紐付けますか？
                </p>
                {selectedStore?.linkedStripeSubscriptionId ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    警告: この店舗にはすでに別契約（
                    {selectedStore.linkedStripeSubscriptionId}
                    ）が紐付いています。確定時に既存紐付けを外して付け替えます。
                  </p>
                ) : null}
                {linkError ? (
                  <p className="text-sm text-red-700">{linkError}</p>
                ) : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkStep("pick")}
                    disabled={linkSubmitting}
                    className="rounded-full border border-charcoal/25 px-4 py-1.5 text-xs text-charcoal"
                  >
                    戻る
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void submitLink(
                        Boolean(selectedStore?.linkedStripeSubscriptionId),
                      )
                    }
                    disabled={linkSubmitting || !selectedStore}
                    className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {linkSubmitting ? "紐付け中…" : "紐付けを確定"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
