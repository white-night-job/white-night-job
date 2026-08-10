"use client";

import { useEffect, useRef, useState } from "react";
import type { StripeBillingKey } from "@/lib/stripe-billing";
import {
  appendStoreIdToCheckoutUrl,
  formatStripeCheckoutLinkMonthlyPrice,
} from "@/lib/stripe-checkout-links";

type CheckoutLink = {
  billingKey: StripeBillingKey;
  label: string;
  plan: "light" | "standard" | "premium";
  checkoutUrl: string;
  updatedAt: string | null;
};

type StoreOption = {
  id: string;
  shopName: string;
  district: string | null;
};

function formatUpdatedAt(value: string | null): string {
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

function shortStoreId(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 8)}…`;
}

export default function AdminStripeCheckoutLinksPage() {
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<StripeBillingKey | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [savingKey, setSavingKey] = useState<StripeBillingKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<StripeBillingKey | null>(null);
  const [copiedLinkedKey, setCopiedLinkedKey] = useState<StripeBillingKey | null>(
    null,
  );

  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const storePickerRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stripe-checkout-links", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as {
        links?: CheckoutLink[];
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "取得に失敗しました。");
      setLinks(data.links ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function loadStores(query = "") {
    setStoresLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(
        `/api/admin/subscriptions/stores?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );
      const data = (await res.json()) as {
        stores?: Array<{
          id: string;
          shopName: string;
          district: string | null;
        }>;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "店舗一覧の取得に失敗しました。");
      setStores(
        (data.stores ?? []).map((s) => ({
          id: s.id,
          shopName: s.shopName,
          district: s.district,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "店舗一覧の取得に失敗しました。",
      );
    } finally {
      setStoresLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void loadStores();
  }, []);

  useEffect(() => {
    if (!storeMenuOpen) return;
    const timer = window.setTimeout(() => {
      void loadStores(storeSearch);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [storeSearch, storeMenuOpen]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!storePickerRef.current) return;
      if (!storePickerRef.current.contains(event.target as Node)) {
        setStoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const filteredStores = stores;

  function startEdit(link: CheckoutLink) {
    setEditingKey(link.billingKey);
    setDraftUrl(link.checkoutUrl);
    setMessage(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setDraftUrl("");
  }

  async function saveEdit(billingKey: StripeBillingKey) {
    setSavingKey(billingKey);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/stripe-checkout-links", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey, checkoutUrl: draftUrl }),
      });
      const data = (await res.json()) as {
        link?: CheckoutLink;
        message?: string;
      };
      if (!res.ok || !data.link) {
        throw new Error(data.message ?? "保存に失敗しました。");
      }
      setLinks((current) =>
        current.map((item) => (item.billingKey === billingKey ? data.link! : item)),
      );
      setEditingKey(null);
      setDraftUrl("");
      setMessage("決済リンクを保存しました。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSavingKey(null);
    }
  }

  async function copyUrl(link: CheckoutLink) {
    if (!link.checkoutUrl) {
      setError("先に決済リンクを登録してください。");
      return;
    }
    try {
      await navigator.clipboard.writeText(link.checkoutUrl);
      setCopiedKey(link.billingKey);
      setMessage(`${link.label}のリンクをコピーしました。`);
      setError(null);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === link.billingKey ? null : current));
      }, 2000);
    } catch {
      setError("コピーに失敗しました。手動で選択してコピーしてください。");
    }
  }

  async function copyLinkedUrl(link: CheckoutLink) {
    if (!link.checkoutUrl) {
      setError("先に決済リンクを登録してください。");
      return;
    }
    if (!selectedStore) {
      setError("紐付け先店舗を選択してください");
      setMessage(null);
      return;
    }
    try {
      const url = appendStoreIdToCheckoutUrl(link.checkoutUrl, selectedStore.id);
      await navigator.clipboard.writeText(url);
      setCopiedLinkedKey(link.billingKey);
      setMessage(
        `${link.label}の店舗紐付けリンクをコピーしました（${selectedStore.shopName} / client_reference_id=${selectedStore.id}）。`,
      );
      setError(null);
      window.setTimeout(() => {
        setCopiedLinkedKey((current) =>
          current === link.billingKey ? null : current,
        );
      }, 2000);
    } catch {
      setError("コピーに失敗しました。手動で選択してコピーしてください。");
    }
  }

  return (
    <div>
      <header className="admin-page-header">
        <h1>Stripe決済リンク管理</h1>
        <p>
          紐付け先店舗を選んでから「店舗紐付けURLをコピー」し、LINE・メール等で店舗へ送ってください。
          店舗が決済すると Webhook が選択した店舗へ契約を自動紐付けします。
        </p>
      </header>

      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      ) : null}

      <div className="mb-4 rounded-xl border border-gold/20 bg-white p-4">
        <div ref={storePickerRef} className="relative">
          <span className="mb-1.5 block text-sm font-medium text-charcoal">
            紐付け先店舗
          </span>
          <button
            type="button"
            onClick={() => setStoreMenuOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-lg border border-gold/30 bg-ivory px-3 py-2.5 text-left outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          >
            <span className="min-w-0">
              {selectedStore ? (
                <>
                  <span className="block truncate font-semibold text-charcoal">
                    {selectedStore.shopName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {selectedStore.district ?? "エリア未設定"} · ID{" "}
                    {shortStoreId(selectedStore.id)}
                  </span>
                </>
              ) : (
                <span className="text-muted">
                  {storesLoading ? "店舗を読み込み中…" : "店舗を選択してください"}
                </span>
              )}
            </span>
            <span className="ml-2 shrink-0 text-muted" aria-hidden>
              ▼
            </span>
          </button>

          {storeMenuOpen ? (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gold/25 bg-white shadow-lg">
              <div className="border-b border-gold/15 p-2">
                <input
                  type="search"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="店舗名で検索"
                  autoFocus
                  className="w-full rounded-lg border border-gold/30 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="max-h-64 overflow-auto p-1">
                {filteredStores.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted">該当する店舗がありません。</p>
                ) : (
                  filteredStores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => {
                        setSelectedStore(store);
                        setStoreMenuOpen(false);
                        setStoreSearch("");
                        setError(null);
                      }}
                      className={`flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-ivory ${
                        selectedStore?.id === store.id ? "bg-gold/10" : ""
                      }`}
                    >
                      <span className="font-semibold text-charcoal">
                        {store.shopName}
                      </span>
                      <span className="text-xs text-muted">
                        {store.district ?? "エリア未設定"} · ID{" "}
                        {shortStoreId(store.id)}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {selectedStore ? (
                <div className="border-t border-gold/15 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStore(null);
                      setStoreMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted hover:bg-ivory"
                  >
                    選択をクリア
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          選択した店舗の{" "}
          <code className="rounded bg-zinc-100 px-1">jobs.id</code> が{" "}
          <code className="rounded bg-zinc-100 px-1">client_reference_id</code>{" "}
          として URL に付与されます。通常の「コピー」は店舗未指定の URL のままです。
        </p>
      </div>

      <div className="rounded-xl border border-gold/20 bg-white p-4">
        {loading ? (
          <p className="admin-muted">読み込み中...</p>
        ) : (
          <div className="space-y-4">
            {links.map((link) => {
              const isEditing = editingKey === link.billingKey;
              const monthlyPrice = formatStripeCheckoutLinkMonthlyPrice(
                link.billingKey,
              );
              return (
                <article
                  key={link.billingKey}
                  className="rounded-xl border border-gold/25 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="w-full min-w-0 sm:min-w-[16rem] sm:flex-1 sm:basis-0">
                      <h2 className="whitespace-normal break-keep font-semibold text-charcoal [overflow-wrap:normal] [word-break:normal]">
                        {link.label}
                      </h2>
                      <p className="mt-1.5 whitespace-normal break-keep text-base font-semibold tracking-wide text-gold-dark [overflow-wrap:normal] [word-break:normal] sm:text-lg">
                        {monthlyPrice}
                      </p>
                      <p className="mt-1.5 whitespace-normal break-keep text-xs text-muted [overflow-wrap:normal] [word-break:normal]">
                        最終更新: {formatUpdatedAt(link.updatedAt)}
                      </p>
                    </div>
                    {!isEditing ? (
                      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:max-w-md sm:shrink-0 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => void copyUrl(link)}
                          disabled={!link.checkoutUrl}
                          className="rounded-full border border-gold/35 px-3 py-1.5 text-xs font-medium text-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {copiedKey === link.billingKey ? "コピー済み" : "コピー"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(link)}
                          className="rounded-full border border-charcoal/25 px-3 py-1.5 text-xs font-medium text-charcoal"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyLinkedUrl(link)}
                          disabled={!link.checkoutUrl}
                          className="rounded-full border border-charcoal/25 px-3 py-1.5 text-xs font-medium text-charcoal disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {copiedLinkedKey === link.billingKey
                            ? "紐付けURLコピー済み"
                            : "店舗紐付けURLをコピー"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="mt-4 space-y-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-muted">
                          Stripe Checkout リンク
                        </span>
                        <input
                          type="url"
                          value={draftUrl}
                          onChange={(e) => setDraftUrl(e.target.value)}
                          placeholder="https://buy.stripe.com/..."
                          className="w-full rounded-lg border border-gold/30 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void saveEdit(link.billingKey)}
                          disabled={savingKey === link.billingKey}
                          className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {savingKey === link.billingKey ? "保存中…" : "保存"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={savingKey === link.billingKey}
                          className="rounded-full border border-charcoal/25 px-4 py-1.5 text-xs font-medium text-charcoal"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 w-full max-w-full overflow-x-auto break-all rounded-lg border border-gold/15 bg-ivory/50 px-3 py-2 text-sm text-charcoal">
                      {link.checkoutUrl || (
                        <span className="text-muted">未登録（編集から URL を追加）</span>
                      )}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        運用: 紐付け先店舗を選択 →「店舗紐付けURLをコピー」→ 店舗へ送信 → 決済 →
        Webhook が{" "}
        <code className="rounded bg-zinc-100 px-1">client_reference_id</code>（=
        jobs.id）で店舗へ自動紐付け。未紐付けの場合は Stripe契約管理から手動紐付けできます。
      </p>
    </div>
  );
}
