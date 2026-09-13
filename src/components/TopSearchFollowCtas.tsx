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
          <span className="top-search-cta-title">
            自分に合う職種診断をする
          </span>
          <span className="top-search-cta-badge">無料</span>
        </button>

        <button
          type="button"
          onClick={handleAiChat}
          className="top-search-cta top-search-cta--chat"
        >
          <span className="top-search-cta-main">
            <ChatBubbleIcon />
            <span className="top-search-cta-title">
              AIチャットで相談する
            </span>
          </span>
          <span className="top-search-cta-badge">24時間対応</span>
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
