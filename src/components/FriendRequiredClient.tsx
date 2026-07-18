"use client";

import { useState } from "react";
import Link from "next/link";
import { LineIcon } from "@/components/LineIcon";

type FriendRequiredClientProps = {
  addFriendUrl: string;
  accountId: string;
};

export function FriendRequiredClient({
  addFriendUrl,
  accountId,
}: FriendRequiredClientProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/line/friendship-confirm", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as {
        ok?: boolean;
        isFriend?: boolean;
        redirectPath?: string;
        message?: string;
        expired?: boolean;
      };

      if (data.ok && data.redirectPath) {
        window.location.assign(data.redirectPath);
        return;
      }

      if (data.expired) {
        setMessage(data.message || "再度ログインしてください。");
        return;
      }

      setMessage(
        data.message ||
          "まだ友だち追加が確認できません。公式アカウントを追加してから、もう一度お試しください。",
      );
    } catch {
      setMessage("確認に失敗しました。通信環境をご確認のうえ、再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-12">
      <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-gold sm:p-8">
        <p className="text-xs font-medium tracking-wide text-gold-dark">
          LINE公式アカウント
        </p>
        <h1 className="mt-2 font-serif text-xl font-semibold leading-snug text-charcoal sm:text-2xl">
          友だち追加が必要です
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          AI相談や求人情報を受け取るため、LINE公式アカウントを友だち追加してください。
        </p>
        <p className="mt-2 text-xs text-muted">公式アカウント：{accountId}</p>

        <div className="mt-8 space-y-3">
          <a
            href={addFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
          >
            <LineIcon className="h-5 w-5 shrink-0" />
            友だち追加する
          </a>

          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="flex min-h-12 w-full items-center justify-center rounded-full border border-gold/40 bg-ivory px-5 text-sm font-semibold text-gold-dark transition hover:bg-white disabled:opacity-60"
          >
            {busy ? "確認中..." : "追加しました"}
          </button>
        </div>

        {message ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-muted">
            友だち追加が終わったら「追加しました」を押してください。サーバーでフォロー状態を確認します。
          </p>
        )}

        <div className="mt-8 border-t border-gold/15 pt-4 text-center">
          <Link
            href="/api/line/login?redirect=%2F"
            className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
          >
            はじめからログインし直す
          </Link>
        </div>
      </div>
    </div>
  );
}
