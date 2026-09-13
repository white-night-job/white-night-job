"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import { MEMBER_PATHS } from "@/lib/member-access";

function openChatBot() {
  window.dispatchEvent(new CustomEvent("wn:open-chat"));
}

function ChatBubbleIcon() {
  return (
    <svg
      className="top-search-cta-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        d="M5.5 16.2c-1.2-1.1-1.9-2.6-1.9-4.3C3.6 7.9 7.1 4.8 12 4.8s8.4 3.1 8.4 7.1-3.5 7.1-8.4 7.1c-.7 0-1.4-.1-2.1-.2L5.2 20.4l.3-4.2z"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Soft advisor / clipboard silhouette for diagnosis CTA (decorative). */
function DiagnosisDecor() {
  return (
    <span className="top-search-cta-decor" aria-hidden>
      <svg
        className="top-search-cta-decor-figure"
        viewBox="0 0 120 140"
        fill="currentColor"
      >
        {/* Head + glasses */}
        <ellipse cx="62" cy="28" rx="18" ry="20" opacity="0.9" />
        <ellipse
          cx="62"
          cy="28"
          rx="18"
          ry="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          opacity="0.35"
        />
        <path
          d="M48 27h10M66 27h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle
          cx="53"
          cy="27"
          r="4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.55"
        />
        <circle
          cx="71"
          cy="27"
          r="4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.55"
        />
        {/* Lab coat torso */}
        <path d="M38 52c6-8 14-12 24-12s18 4 24 12l8 18v48H30V70l8-18z" />
        <path
          d="M62 40v78M48 72h28"
          fill="none"
          stroke="#f7f1e8"
          strokeWidth="2"
          opacity="0.45"
        />
        {/* Clipboard */}
        <rect x="78" y="68" width="28" height="36" rx="3" opacity="0.85" />
        <rect
          x="84"
          y="64"
          width="16"
          height="7"
          rx="2"
          opacity="0.7"
        />
        <path
          d="M84 80h16M84 88h14M84 96h12"
          fill="none"
          stroke="#f7f1e8"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      <svg
        className="top-search-cta-decor-motif top-search-cta-decor-motif--check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
        <path
          d="M7.5 12.2l3 3 6-6.5"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className="top-search-cta-decor-motif top-search-cta-decor-motif--bulb"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M9.2 15.5h5.6M10 18h4M12 3.8a5.2 5.2 0 015.2 5.2c0 2.1-1.1 3.4-2.2 4.4-.7.7-1.2 1.4-1.2 2.4H10.2c0-1-.5-1.7-1.2-2.4-1.1-1-2.2-2.3-2.2-4.4A5.2 5.2 0 0112 3.8z"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Soft friendly robot + chat motifs for AI CTA (decorative). */
function ChatDecor() {
  return (
    <span className="top-search-cta-decor" aria-hidden>
      <svg
        className="top-search-cta-decor-figure"
        viewBox="0 0 120 140"
        fill="currentColor"
      >
        {/* Antenna */}
        <circle cx="60" cy="14" r="4" opacity="0.75" />
        <path
          d="M60 18v10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Head */}
        <rect x="34" y="28" width="52" height="40" rx="14" />
        <circle cx="48" cy="48" r="5" fill="#f7f1e8" opacity="0.7" />
        <circle cx="72" cy="48" r="5" fill="#f7f1e8" opacity="0.7" />
        <path
          d="M50 58c3 3.2 9 3.2 12 0"
          fill="none"
          stroke="#f7f1e8"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.65"
        />
        {/* Body */}
        <rect x="40" y="72" width="40" height="42" rx="12" opacity="0.9" />
        <rect
          x="50"
          y="82"
          width="20"
          height="14"
          rx="4"
          fill="#f7f1e8"
          opacity="0.45"
        />
        {/* Arms */}
        <rect x="22" y="78" width="14" height="28" rx="7" opacity="0.8" />
        <rect x="84" y="78" width="14" height="28" rx="7" opacity="0.8" />
      </svg>
      <svg
        className="top-search-cta-decor-motif top-search-cta-decor-motif--bubble"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M5 5.5A3.5 3.5 0 018.5 2h7A3.5 3.5 0 0119 5.5v6A3.5 3.5 0 0115.5 15H10l-4.2 3.2V15A3.5 3.5 0 015 11.5v-6z" />
      </svg>
      <svg
        className="top-search-cta-decor-motif top-search-cta-decor-motif--spark"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M12 3.5v3.2M12 17.3v3.2M3.5 12h3.2M17.3 12h3.2M6.4 6.4l2.2 2.2M15.4 15.4l2.2 2.2M17.6 6.4l-2.2 2.2M8.6 15.4l-2.2 2.2"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/**
 * CTAs between hero search and the feature intro band.
 * Reuses existing diagnosis / AI consultation entry points.
 */
export function TopSearchFollowCtas() {
  const router = useRouter();
  const { isLoggedIn, ready } = useUserSession();
  const [gate, setGate] = useState<"ai" | "diagnosis" | null>(null);

  function handleDiagnosis() {
    if (!ready) return;
    if (isLoggedIn) {
      router.push(MEMBER_PATHS.diagnosis);
      return;
    }
    setGate("diagnosis");
  }

  function handleAiChat() {
    if (!ready) return;
    if (isLoggedIn) {
      openChatBot();
      return;
    }
    setGate("ai");
  }

  return (
    <section
      className="top-search-cta-section"
      aria-label="診断とAI相談"
    >
      <div className="top-search-cta-grid">
        <button
          type="button"
          onClick={handleDiagnosis}
          className="top-search-cta top-search-cta--diagnosis"
        >
          <DiagnosisDecor />
          <span className="top-search-cta-content">
            <span className="top-search-cta-title">
              自分に合う職種診断をする
            </span>
            <span className="top-search-cta-badge">無料</span>
          </span>
        </button>

        <button
          type="button"
          onClick={handleAiChat}
          className="top-search-cta top-search-cta--chat"
        >
          <ChatDecor />
          <span className="top-search-cta-content">
            <span className="top-search-cta-main">
              <ChatBubbleIcon />
              <span className="top-search-cta-title">
                AIチャットで相談する
              </span>
            </span>
            <span className="top-search-cta-badge">24時間対応</span>
          </span>
        </button>
      </div>

      <MemberGateModal
        open={gate === "ai"}
        onClose={() => setGate(null)}
        title="AI相談はLINEログイン後に利用できます"
        description="LINEログインすると、相談履歴を保存しながらAIへ相談できます。"
        redirectPath={MEMBER_PATHS.consultation}
        action="consultation"
      />
      <MemberGateModal
        open={gate === "diagnosis"}
        onClose={() => setGate(null)}
        title="職種診断はLINEログイン後に利用できます"
        description="診断結果を保存して、あなたに合う職種や求人をいつでも確認できます。"
        redirectPath={MEMBER_PATHS.diagnosis}
        action="diagnosis"
      />
    </section>
  );
}
