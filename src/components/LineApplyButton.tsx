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

const APPLY_CLICK_COOLDOWN_MS = 2000;

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

function applySizeClass(size: "sm" | "md" | "lg"): string {
  if (size === "lg") {
    return "apply-cta-btn apply-cta-btn--lg px-4 py-4 text-base sm:px-8 sm:text-lg";
  }
  if (size === "sm") {
    return "apply-cta-btn apply-cta-btn--sm px-4 py-2 text-sm";
  }
  return "apply-cta-btn apply-cta-btn--md px-4 py-3 text-base sm:px-6";
}

function ChatConsultIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        d="M5.2 16.4c-1.15-1.05-1.85-2.5-1.85-4.15C3.35 8.1 7.15 5 12 5s8.65 3.1 8.65 7.25S16.85 19.5 12 19.5c-.85 0-1.65-.1-2.4-.3L4.6 21.2l.6-4.8z"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 11.2h7.6M8.2 14h5.2"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneConsultIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        d="M8.1 3.8c.45-.45 1.2-.5 1.7-.12l2.05 1.55c.45.35.6 1 .35 1.5l-.85 1.55c-.2.35-.15.8.1 1.1l2.7 2.7c.3.3.75.35 1.1.1l1.55-.85c.5-.25 1.15-.1 1.5.35l1.55 2.05c.38.5.33 1.25-.12 1.7l-1.15 1.15c-.55.55-1.3.8-2.05.7-1.85-.25-3.95-1.45-5.95-3.45s-3.2-4.1-3.45-5.95c-.1-.75.15-1.5.7-2.05L8.1 3.8z"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
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

  return (
    <>
      <button
        type="button"
        onClick={() => openConfirm({ href: lineUrl, target: "_blank" })}
        className={`apply-cta-btn--line ${applySizeClass(size)} ${fullWidth ? "w-full" : ""}`}
      >
        <ChatConsultIcon className="apply-cta-icon" />
        <span>{label}</span>
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
  const tel = phone.replace(/[^\d+]/g, "");

  return (
    <>
      <button
        type="button"
        onClick={() => openConfirm({ href: `tel:${tel}`, target: "_self" })}
        className={`apply-cta-btn--phone border border-gold/40 ${luxuryBtnPrimary} ${applySizeClass(size)} ${fullWidth ? "w-full" : ""}`}
      >
        <PhoneConsultIcon className="apply-cta-icon" />
        <span>{label}</span>
      </button>
      {modal}
    </>
  );
}
