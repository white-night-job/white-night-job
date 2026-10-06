"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LineContact = {
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  isFollowing: boolean;
  lastEventType: string | null;
  lastEventAt: string | null;
};

type LineContactWithShops = LineContact & {
  linkedShops: { jobId: string; shopName: string }[];
};

type ShopLineLink = {
  available: boolean;
  linked: boolean;
  linkedAt: string | null;
  contact: LineContact | null;
};

const EVENT_LABELS: Record<string, string> = {
  follow: "友だち追加",
  unfollow: "友だち解除・ブロック",
  message: "メッセージ受信",
  postback: "メニュー操作",
};

function formatJstDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function maskUserId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 5)}…${id.slice(-4)}` : id;
}

function displayNameOf(contact: LineContact): string {
  return contact.displayName?.trim() || "（表示名未取得）";
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(data.message || fallback);
  return data;
}

function ContactSummary({ contact }: { contact: LineContact }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {contact.pictureUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- LINE CDN の外部画像
        <img
          src={contact.pictureUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-10 w-10 shrink-0 rounded-full border border-gold/30 object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-ivory text-xs text-muted">
          LINE
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-charcoal">
          {displayNameOf(contact)}
        </p>
        <p className="font-mono text-[11px] text-muted">
          {maskUserId(contact.lineUserId)}
        </p>
        <p className="text-[11px] text-muted">
          直近：{EVENT_LABELS[contact.lastEventType ?? ""] ?? "受信"}{" "}
          {formatJstDateTime(contact.lastEventAt)}
        </p>
      </div>
    </div>
  );
}

export function AdminShopLineNotifySettings({ jobId }: { jobId: string }) {
  const [link, setLink] = useState<ShopLineLink | null>(null);
  const [contacts, setContacts] = useState<LineContactWithShops[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [linkData, contactsData] = await Promise.all([
        readJson<ShopLineLink>(
          await fetch(`/api/admin/jobs/${jobId}/line-link`, {
            cache: "no-store",
            credentials: "include",
          }),
          "LINE通知設定の取得に失敗しました。",
        ),
        readJson<{ contacts: LineContactWithShops[] }>(
          await fetch("/api/admin/line-contacts", {
            cache: "no-store",
            credentials: "include",
          }),
          "LINEユーザー一覧の取得に失敗しました。",
        ),
      ]);
      setLink(linkData);
      setContacts(contactsData.contacts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    setSelectedId("");
    setNotice("");
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (contact) =>
        (contact.displayName ?? "").toLowerCase().includes(q) ||
        contact.lineUserId.toLowerCase().includes(q),
    );
  }, [contacts, query]);

  const selected = contacts.find((contact) => contact.lineUserId === selectedId);

  async function handleLink() {
    if (!selected || busy) return;
    const others = selected.linkedShops.filter((shop) => shop.jobId !== jobId);
    const confirmText = [
      `LINEユーザー「${displayNameOf(selected)}」（${maskUserId(selected.lineUserId)}）を`,
      "この店舗の応募通知先として紐付けますか？",
      others.length > 0
        ? `\n※このLINEユーザーは次の店舗にも紐付いています：${others.map((s) => s.shopName).join("、")}`
        : "",
    ].join("\n");
    if (!window.confirm(confirmText)) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await readJson<ShopLineLink>(
        await fetch(`/api/admin/jobs/${jobId}/line-link`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ lineUserId: selected.lineUserId }),
        }),
        "LINEユーザーの紐付けに失敗しました。",
      );
      setLink(next);
      setSelectedId("");
      setNotice("この店舗とLINEユーザーを紐付けました。");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "LINEユーザーの紐付けに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    if (busy) return;
    if (
      !window.confirm(
        "この店舗のLINE連携を解除しますか？\n解除すると、この店舗へ応募LINE通知が送られなくなります。",
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await readJson<ShopLineLink>(
        await fetch(`/api/admin/jobs/${jobId}/line-link`, {
          method: "DELETE",
          credentials: "include",
        }),
        "LINE連携の解除に失敗しました。",
      );
      setLink(next);
      setNotice("LINE連携を解除しました。");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "LINE連携の解除に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gold/30 bg-white p-4 shadow-gold sm:p-5">
      <div>
        <p className="text-sm font-semibold text-gold-dark">LINE通知設定</p>
        <p className="mt-1 text-xs text-muted">
          応募ボタンが押された際に、店舗サポート公式LINEからこの店舗へ通知を送ります。
          候補は店舗サポート公式LINEを友だち追加・メッセージ送信したユーザーです。
        </p>
      </div>

      {loading && !link ? (
        <div className="h-16 animate-pulse rounded-xl bg-gold/10" />
      ) : link && !link.available ? (
        <p className="rounded-xl border border-gold/20 bg-ivory px-3 py-2 text-sm text-muted">
          LINE通知用のテーブルが未作成です。SQL（supabase/add-line-contacts-and-shop-links.sql）の実行後に利用できます。
        </p>
      ) : link ? (
        <div className="space-y-4 border-t border-gold/15 pt-3">
          <div>
            <p className="text-xs text-muted">現在の状態：</p>
            {link.linked ? (
              <p className="mt-1 text-base font-semibold text-[#047a3b]">✓ LINE連携済み</p>
            ) : (
              <p className="mt-1 text-base font-semibold text-charcoal">未連携</p>
            )}
          </div>

          {link.linked ? (
            <div className="space-y-3">
              <p className="text-xs text-muted">LINEユーザー：</p>
              {link.contact ? (
                <div className="rounded-xl border border-gold/25 bg-ivory/50 p-3">
                  <ContactSummary contact={link.contact} />
                  {!link.contact.isFollowing ? (
                    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                      このLINEユーザーは店舗サポート公式LINEを友だち解除（またはブロック）しています。通知は届きません。
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="text-xs text-muted">
                紐付け日時：{formatJstDateTime(link.linkedAt)}
              </p>
              <button
                type="button"
                onClick={() => void handleUnlink()}
                disabled={busy}
                className="rounded-full border border-charcoal/20 bg-white px-5 py-2.5 text-sm font-medium text-muted hover:text-charcoal disabled:opacity-60"
              >
                {busy ? "処理中..." : "連携を解除"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">LINEユーザー：</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-gold-dark disabled:opacity-60"
                >
                  {loading ? "更新中..." : "一覧を更新"}
                </button>
              </div>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                }}
                placeholder="表示名で絞り込み"
                className="w-full rounded-xl border border-gold/30 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
              />
              {filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gold/25 px-3 py-4 text-center text-sm text-muted">
                  {contacts.length === 0
                    ? "まだLINEユーザーが登録されていません。店舗サポート公式LINEへの友だち追加・メッセージ受信後に表示されます。"
                    : "該当するLINEユーザーがいません。"}
                </p>
              ) : (
                <ul
                  role="radiogroup"
                  aria-label="LINEユーザーを選択してください"
                  className="max-h-80 space-y-2 overflow-y-auto pr-1"
                >
                  {filtered.map((contact) => {
                    const checked = contact.lineUserId === selectedId;
                    const disabled = !contact.isFollowing;
                    return (
                      <li key={contact.lineUserId}>
                        <label
                          className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                            checked
                              ? "border-gold bg-gold/10"
                              : "border-gold/20 bg-white"
                          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-gold/50"}`}
                        >
                          <input
                            type="radio"
                            name={`line-contact-${jobId}`}
                            value={contact.lineUserId}
                            checked={checked}
                            disabled={disabled}
                            onChange={() => setSelectedId(contact.lineUserId)}
                            className="shrink-0 accent-[#c9a962]"
                          />
                          <div className="min-w-0 flex-1">
                            <ContactSummary contact={contact} />
                            <div className="mt-1 flex flex-wrap gap-1">
                              {disabled ? (
                                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] text-muted">
                                  友だち解除・ブロック
                                </span>
                              ) : null}
                              {contact.linkedShops.map((shop) => (
                                <span
                                  key={shop.jobId}
                                  className="rounded-full border border-gold/30 bg-ivory px-2 py-0.5 text-[10px] text-gold-dark"
                                >
                                  紐付け済み：{shop.shopName}
                                </span>
                              ))}
                            </div>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                onClick={() => void handleLink()}
                disabled={!selected || busy}
                className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "処理中..." : "この店舗と紐付ける"}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {notice ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
