"use client";

type LineLoginRequiredModalProps = {
  open: boolean;
  onClose: () => void;
  redirectPath: string;
};

export function LineLoginRequiredModal({
  open,
  onClose,
  redirectPath,
}: LineLoginRequiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gold/30 bg-white p-5 shadow-2xl">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          LINEログインが必要です
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          お気に入り登録にはLINEログインが必要です。
        </p>
        <div className="mt-5 space-y-2">
          <a
            href={`/api/line/login?redirect=${encodeURIComponent(redirectPath)}`}
            className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#06c755] px-4 text-sm font-semibold text-white"
          >
            LINEでログイン
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-center rounded-full border border-gold/35 bg-white px-4 text-sm font-medium text-gold-dark"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
