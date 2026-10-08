"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import { MEMBER_PATHS } from "@/lib/member-access";

function openChatBot() {
  window.dispatchEvent(new CustomEvent("wn:open-chat"));
}

function LineIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="tc-art-svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** 職種診断：女性シルエット＋チェックリスト */
function JobDiagnosisIcon() {
  return (
    <LineIcon>
      <circle cx="15" cy="17" r="5.2" />
      <circle cx="10.9" cy="12.6" r="2.1" />
      <path d="M5.5 38c0-6.5 4.2-11 9.5-11s9.5 4.5 9.5 11" />
      <rect x="27" y="11" width="15" height="20" rx="1.6" />
      <path d="M30 16.6l1.3 1.3 2.4-2.6M36 16.6h3.2" />
      <path d="M30 22.4l1.3 1.3 2.4-2.6M36 22.4h3.2" />
      <path d="M30 27.4h9.2" opacity="0.5" />
    </LineIcon>
  );
}

/** AI相談：吹き出し＋AIを示す光 */
function AiChatIcon() {
  return (
    <LineIcon>
      <path d="M9 13h22a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4H19l-6 5v-5h-4a4 4 0 0 1 -4 -4V17a4 4 0 0 1 4 -4z" />
      <path d="M12 20h16M12 25h10" />
      <path
        d="M39 4.5c.5 3 2.5 5 5.5 5.5c-3 .5 -5 2.5 -5.5 5.5c-.5 -3 -2.5 -5 -5.5 -5.5c3 -.5 5 -2.5 5.5 -5.5z"
        fill="currentColor"
        stroke="none"
      />
    </LineIcon>
  );
}

/** 接客タイプ診断：女性シルエット＋会話＋グラス */
function SalesStyleIcon() {
  return (
    <LineIcon>
      <circle cx="15" cy="17.5" r="5.2" />
      <path d="M9.6 17.2c-.2 5 -1.4 8.6 -3.2 10.6M20.4 17.2c.2 5 1.4 8.6 3.2 10.6" />
      <path d="M5.5 39c0-6 4.2-10 9.5-10s9.5 4 9.5 10" />
      <path d="M31 10h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-5l-4 3.5V22h-1a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3z" />
      <path d="M32.5 16h7" />
      <path d="M33 30h7l-.6 4.2a2.9 2.9 0 0 1 -5.8 0z" />
      <path d="M36.5 37.2v3.8M34 41h5" />
    </LineIcon>
  );
}

function CardArrow() {
  return (
    <span className="tc-go" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 12h15M14 7l5 5-5 5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** 文節の区切りでだけ改行させる */
function Phrases({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 ? <wbr /> : null}
          {part}
        </span>
      ))}
    </>
  );
}

type CareCardProps = {
  variant: "job" | "ai" | "style";
  ribbon: string;
  title: string[];
  sub: string[];
  badges: string[];
  art: ReactNode;
  onClick: () => void;
};

function CareCard({ variant, ribbon, title, sub, badges, art, onClick }: CareCardProps) {
  return (
    <button type="button" onClick={onClick} className={`tc-card tc-card--${variant}`}>
      <span className="tc-art">{art}</span>
      <span className="tc-body">
        <span className="tc-ribbon">{ribbon}</span>
        <span className="tc-title font-serif">
          <Phrases parts={title} />
        </span>
        <span className="tc-sub">
          <Phrases parts={sub} />
        </span>
        <span className="tc-badges">
          {badges.map((badge) => (
            <span key={badge} className="tc-badge">
              {badge}
            </span>
          ))}
        </span>
      </span>
      <CardArrow />
    </button>
  );
}

/**
 * CTAs between hero search and the feature intro band.
 * Reuses existing diagnosis / AI consultation entry points.
 */
export function TopSearchFollowCtas() {
  const router = useRouter();
  const { isLoggedIn, ready } = useUserSession();
  const [gate, setGate] = useState<"ai" | "diagnosis" | "salesStyle" | null>(null);

  function handleDiagnosis() {
    if (!ready) return;
    if (isLoggedIn) {
      router.push(MEMBER_PATHS.diagnosis);
      return;
    }
    setGate("diagnosis");
  }

  function handleSalesStyleDiagnosis() {
    if (!ready) return;
    if (isLoggedIn) {
      router.push(MEMBER_PATHS.salesStyleDiagnosis);
      return;
    }
    setGate("salesStyle");
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
    <section className="tc-section" aria-labelledby="tc-heading">
      <div className="tc-head">
        <p className="tc-eyebrow font-serif">SUPPORT</p>
        <div className="tc-heading-row">
          <span className="tc-heading-line" aria-hidden />
          <h2 id="tc-heading" className="tc-heading font-serif">
            迷ったら、まずは無料で診断・相談
          </h2>
          <span className="tc-heading-line" aria-hidden />
        </div>
      </div>
      <div className="tc-grid">
        <CareCard
          variant="job"
          ribbon="おすすめ"
          title={["あなたに合う", "お仕事診断"]}
          sub={["未経験でも、", "自分に合う", "働き方がわかる"]}
          badges={["無料", "1分で診断"]}
          art={<JobDiagnosisIcon />}
          onClick={handleDiagnosis}
        />
        <CareCard
          variant="ai"
          ribbon="初めての方へ"
          title={["不安なことを", "AIに相談"]}
          sub={["夜職が初めてでも、", "気になることを", "すぐ聞ける"]}
          badges={["24時間対応", "匿名OK"]}
          art={<AiChatIcon />}
          onClick={handleAiChat}
        />
        <CareCard
          variant="style"
          ribbon="NEW"
          title={["あなたに合う", "接客タイプ診断"]}
          sub={["話し方や", "接客の強みが", "見つかる"]}
          badges={["無料", "相性チェック"]}
          art={<SalesStyleIcon />}
          onClick={handleSalesStyleDiagnosis}
        />
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
      <MemberGateModal
        open={gate === "salesStyle"}
        onClose={() => setGate(null)}
        title="営業スタイル診断はLINEログイン後に利用できます"
        description="診断結果を保存して、マイページでいつでも確認できます。"
        redirectPath={MEMBER_PATHS.salesStyleDiagnosis}
        action="diagnosis"
      />
    </section>
  );
}
