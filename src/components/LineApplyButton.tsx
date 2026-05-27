"use client";

import { useState } from "react";

type ApplyAction = {
  href: string;
  target?: "_blank" | "_self";
};

const guideMessage = (
  <>
    <span>スムーズにご案内できるよう、</span>
    <br />
    <span className="font-semibold text-gold-light">
      『ホワイトナイト見ました！』
    </span>
    <br />
    <span>と必ずお伝えお願いします✨</span>
  </>
);

function ConfirmApplyModal({
  action,
  onClose,
}: {
  action: ApplyAction | null;
  onClose: () => void;
}) {
  if (!action) return null;

  function handleProceed() {
    if (!action) return;
    if (action.target === "_blank") {
      window.open(action.href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = action.href;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-charcoal via-[#1c160c] to-[#302512] text-white shadow-2xl">
        <div className="border-b border-gold/20 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light/80">
            Before Contact
          </p>
          <h2 className="mt-2 font-serif text-xl font-semibold text-gold-light">
            ご連絡前のお願い
          </h2>
        </div>

        <div className="space-y-5 px-5 py-6 text-center">
          <p className="text-sm leading-8 text-white/90 sm:text-base">
            {guideMessage}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-gold/30 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="flex-1 rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useApplyConfirm() {
  const [action, setAction] = useState<ApplyAction | null>(null);

  return {
    modal: <ConfirmApplyModal action={action} onClose={() => setAction(null)} />,
    openConfirm: (nextAction: ApplyAction) => setAction(nextAction),
  };
}

export function LineApplyButton({
  lineUrl,
  label = "LINEで相談・応募する",
  fullWidth = false,
  size = "md",
}: {
  lineUrl: string;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { modal, openConfirm } = useApplyConfirm();
  const sizeClass =
    size === "lg" ? "px-8 py-4 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base";

  return (
    <>
      <button
        type="button"
        onClick={() => openConfirm({ href: lineUrl, target: "_blank" })}
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#06C755] font-semibold text-white shadow-md hover:bg-[#05b34c] active:scale-[0.99] ${sizeClass} ${fullWidth ? "w-full" : ""}`}
      >
        {label}
      </button>
      {modal}
    </>
  );
}

export function PhoneApplyButton({
  phone,
  label = "電話で相談・応募する",
  fullWidth = false,
  size = "md",
}: {
  phone: string;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { modal, openConfirm } = useApplyConfirm();
  const sizeClass =
    size === "lg" ? "px-8 py-4 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base";
  const tel = phone.replace(/[^\d+]/g, "");

  return (
    <>
      <button
        type="button"
        onClick={() => openConfirm({ href: `tel:${tel}`, target: "_self" })}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gradient-to-r from-charcoal to-gold-dark font-semibold text-white shadow-md hover:from-gold-dark hover:to-charcoal active:scale-[0.99] ${sizeClass} ${fullWidth ? "w-full" : ""}`}
      >
        {label}
      </button>
      {modal}
    </>
  );
}
