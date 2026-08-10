"use client";

import { useEffect, useState } from "react";
import type { StripeBillingKey } from "@/lib/stripe-billing";
import { formatStripeCheckoutLinkMonthlyPrice, appendStoreIdToCheckoutUrl } from "@/lib/stripe-checkout-links";

type CheckoutLink = {
  billingKey: StripeBillingKey;
  label: string;
  plan: "light" | "standard" | "premium";
  checkoutUrl: string;
  updatedAt: string | null;
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

export default function AdminStripeCheckoutLinksPage() {
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<StripeBillingKey | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [savingKey, setSavingKey] = useState<StripeBillingKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<StripeBillingKey | null>(null);
  const [storeIdForLink, setStoreIdForLink] = useState("");
  const [copiedLinkedKey, setCopiedLinkedKey] = useState<StripeBillingKey | null>(
    null,
  );

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

  useEffect(() => {
    void load();
  }, []);

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
    const storeId = storeIdForLink.trim();
    if (!storeId) {
      setError("店舗 ID（jobs.id）を入力してから、紐付け付きリンクをコピーしてください。");
      return;
    }
    try {
      const url = appendStoreIdToCheckoutUrl(link.checkoutUrl, storeId);
      await navigator.clipboard.writeText(url);
      setCopiedLinkedKey(link.billingKey);
      setMessage(
        `${link.label}の店舗紐付けリンクをコピーしました（client_reference_id=${storeId}）。`,
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
          運営が店舗へ個別送信する Stripe Checkout / Payment Link を登録します。
          店舗画面には契約ボタンは出ません。コピーしたリンクを LINE・メール等で送ってください。
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
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-charcoal">
            店舗 ID（jobs.id）— 紐付け付きリンク用
          </span>
          <input
            type="text"
            value={storeIdForLink}
            onChange={(e) => setStoreIdForLink(e.target.value)}
            placeholder="例: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full rounded-lg border border-gold/30 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </label>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          入力した店舗 ID を{" "}
          <code className="rounded bg-zinc-100 px-1">client_reference_id</code>{" "}
          として付与した URL をコピーできます。Webhook が Checkout Session /
          Subscription の metadata に{" "}
          <code className="rounded bg-zinc-100 px-1">store_id</code>{" "}
          を書き込み、契約を店舗へ紐付けます。
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
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-charcoal">{link.label}</h2>
                      <p className="mt-1.5 text-base font-semibold tracking-wide text-gold-dark sm:text-lg">
                        {monthlyPrice}
                      </p>
                      <p className="mt-1.5 text-xs text-muted">
                        最終更新: {formatUpdatedAt(link.updatedAt)}
                      </p>
                    </div>
                    {!isEditing ? (
                      <div className="flex flex-wrap gap-2">
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
                          onClick={() => void copyLinkedUrl(link)}
                          disabled={!link.checkoutUrl}
                          className="rounded-full border border-charcoal/25 px-3 py-1.5 text-xs font-medium text-charcoal disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {copiedLinkedKey === link.billingKey
                            ? "紐付けURLコピー済み"
                            : "店舗紐付けURLをコピー"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(link)}
                          className="rounded-full border border-charcoal/25 px-3 py-1.5 text-xs font-medium text-charcoal"
                        >
                          編集
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
                    <p className="mt-3 break-all rounded-lg border border-gold/15 bg-ivory/50 px-3 py-2 text-sm text-charcoal">
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
        店舗紐付けの優先順位（Webhook・自動）:{" "}
        <code className="rounded bg-zinc-100 px-1">checkout.session.metadata.store_id</code>
        {" → "}
        <code className="rounded bg-zinc-100 px-1">client_reference_id</code>
        {" / "}
        <code className="rounded bg-zinc-100 px-1">subscription.metadata.store_id</code>
        。メール一致だけでは自動確定しません。未紐付けの契約は Stripe契約管理から手動で紐付けできます。
      </p>
    </div>
  );
}
