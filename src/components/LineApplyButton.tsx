"use client";

import { useRef, useState } from "react";
import {
  recordJobApplication,
  type JobApplicationType,
} from "@/lib/job-applications";
import { luxuryBtnPrimary, luxuryBtnPrimaryOnDark } from "@/lib/luxury-styles";

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
    <span>とお伝えお願いします✨</span>
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
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-charcoal via-[#1c160c] to-[#302512] px-5 py-6 text-white shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,213,163,0.18),transparent_35%)]" />
        <div className="relative space-y-5 text-center">
          <p className="rounded-2xl border border-gold/25 bg-black/20 px-4 py-5 text-sm leading-8 text-white/90 sm:text-base">
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
              className={`flex-1 rounded-full px-4 py-3 text-sm ${luxuryBtnPrimaryOnDark}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const APPLY_CLICK_COOLDOWN_MS = 800;

function useApplyConfirm(
  jobId?: string,
  applicationType?: JobApplicationType,
) {
  const [action, setAction] = useState<ApplyAction | null>(null);
  const clickGuardRef = useRef(false);

  function openConfirm(nextAction: ApplyAction) {
    if (clickGuardRef.current) return;
    clickGuardRef.current = true;

    if (jobId && applicationType) {
      void recordJobApplication(jobId, applicationType);
    }

    setAction(nextAction);

    window.setTimeout(() => {
      clickGuardRef.current = false;
    }, APPLY_CLICK_COOLDOWN_MS);
  }

  return {
    modal: <ConfirmApplyModal action={action} onClose={() => setAction(null)} />,
    openConfirm,
  };
}

export function LineApplyButton({
  lineUrl,
  jobId,
  label = "LINEで相談・応募する",
  fullWidth = false,
  size = "md",
}: {
  lineUrl: string;
  jobId?: string;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { modal, openConfirm } = useApplyConfirm(jobId, "line");
  const sizeClass =
    size === "lg" ? "px-8 py-4 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base";

  return (
    <>
      <button
        type="button"
        onClick={() => openConfirm({ href: lineUrl, target: "_blank" })}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold ${luxuryBtnPrimary} ${sizeClass} ${fullWidth ? "w-full" : ""}`}
      >
        {label}
      </button>
      {modal}
    </>
  );
}

export function PhoneApplyButton({
  phone,
  jobId,
  label = "電話で相談・応募する",
  fullWidth = false,
  size = "md",
}: {
  phone: string;
  jobId?: string;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { modal, openConfirm } = useApplyConfirm(jobId, "phone");
  const sizeClass =
    size === "lg" ? "px-8 py-4 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base";
  const tel = phone.replace(/[^\d+]/g, "");

  return (
    <>
      <button
        type="button"
        onClick={() => openConfirm({ href: `tel:${tel}`, target: "_self" })}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 ${luxuryBtnPrimary} ${sizeClass} ${fullWidth ? "w-full" : ""}`}
      >
        {label}
      </button>
      {modal}
    </>
  );
}
