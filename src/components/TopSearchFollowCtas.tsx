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
        className="top-search-cta-decor-figure top-search-cta-decor-figure--advisor"
        viewBox="0 0 100 130"
        fill="currentColor"
      >
        {/* Hair / head */}
        <ellipse cx="42" cy="26" rx="17" ry="19" />
        {/* Glasses */}
        <circle
          cx="35"
          cy="26"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <circle
          cx="49"
          cy="26"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <path
          d="M40.5 26h3M29.5 26h-3.5M54.5 26H58"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Neck */}
        <rect x="37" y="42" width="10" height="8" rx="2" />
        {/* Lab coat */}
        <path d="M22 52c5-7 12-10 20-10s15 3 20 10l7 14v48H15V66l7-14z" />
        <path
          d="M42 44v70"
          fill="none"
          stroke="#f6efe4"
          strokeWidth="2.5"
          opacity="0.55"
        />
        <path
          d="M30 74h24"
          fill="none"
          stroke="#f6efe4"
          strokeWidth="2.2"
          opacity="0.45"
        />
        {/* Clipboard in hand */}
        <rect x="62" y="62" width="26" height="34" rx="3.5" />
        <rect x="68" y="58" width="14" height="7" rx="2" />
        <path
          d="M68 74h14M68 82h12M68 90h10"
          fill="none"
          stroke="#f6efe4"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
      <svg
        className="top-search-cta-decor-motif top-search-cta-decor-motif--check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
        <path
          d="M7.5 12.2l3 3 6-6.5"
          strokeWidth="1.7"
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
          strokeWidth="1.5"
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
        className="top-search-cta-decor-figure top-search-cta-decor-figure--robot"
        viewBox="0 0 100 130"
        fill="currentColor"
      >
        {/* Antenna */}
        <circle cx="50" cy="10" r="5" />
        <path
          d="M50 15v12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Head */}
        <rect x="24" y="27" width="52" height="38" rx="13" />
        <circle cx="38" cy="45" r="5.5" fill="#f6efe4" />
        <circle cx="62" cy="45" r="5.5" fill="#f6efe4" />
        <path
          d="M40 56c3.2 3.4 9.8 3.4 13 0"
          fill="none"
          stroke="#f6efe4"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* Body */}
        <rect x="30" y="70" width="40" height="44" rx="12" />
        <rect x="40" y="80" width="20" height="14" rx="4" fill="#f6efe4" opacity="0.55" />
        {/* Arms */}
        <rect x="12" y="76" width="14" height="30" rx="7" />
        <rect x="74" y="76" width="14" height="30" rx="7" />
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
          strokeWidth="1.6"
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
