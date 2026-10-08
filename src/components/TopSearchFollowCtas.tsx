"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
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

type Petal = {
  x: number;
  y: number;
  size: number;
  rotate: number;
  opacity: number;
  tone: 0 | 1 | 2;
  blur?: boolean;
  /** ゆっくり漂わせる（秒） */
  drift?: number;
  /** スマホでは非表示 */
  desktopOnly?: boolean;
};

const PETAL_TONES = ["#f2c4cf", "#e8b3c0", "#f8e3e8"] as const;

/** 位置は % 指定。カード周囲に偏らせて自然に散らす */
const PETALS: Petal[] = [
  { x: 3, y: 4, size: 14, rotate: -28, opacity: 0.4, tone: 0, drift: 12 },
  { x: 9, y: 13, size: 8, rotate: 42, opacity: 0.3, tone: 2 },
  { x: 15, y: 2, size: 11, rotate: 110, opacity: 0.22, tone: 1, blur: true },
  { x: 1, y: 30, size: 7, rotate: 160, opacity: 0.25, tone: 0, desktopOnly: true },
  { x: 24, y: 9, size: 6, rotate: -70, opacity: 0.2, tone: 1, desktopOnly: true },
  { x: 82, y: 3, size: 12, rotate: 24, opacity: 0.35, tone: 0, drift: 14 },
  { x: 91, y: 10, size: 16, rotate: -48, opacity: 0.28, tone: 2, blur: true },
  { x: 96, y: 26, size: 8, rotate: 82, opacity: 0.32, tone: 1 },
  { x: 74, y: 12, size: 7, rotate: 150, opacity: 0.2, tone: 0, desktopOnly: true },
  { x: 49, y: 56, size: 9, rotate: 36, opacity: 0.3, tone: 0, drift: 11 },
  { x: 52, y: 64, size: 6, rotate: -120, opacity: 0.22, tone: 2, desktopOnly: true },
  { x: 2, y: 62, size: 10, rotate: 64, opacity: 0.26, tone: 1 },
  { x: 97, y: 52, size: 9, rotate: -15, opacity: 0.24, tone: 0, desktopOnly: true },
  { x: 4, y: 86, size: 13, rotate: -95, opacity: 0.32, tone: 0, drift: 13 },
  { x: 12, y: 95, size: 7, rotate: 30, opacity: 0.22, tone: 2 },
  { x: 30, y: 97, size: 9, rotate: 140, opacity: 0.18, tone: 1, blur: true, desktopOnly: true },
  { x: 70, y: 96, size: 8, rotate: -40, opacity: 0.2, tone: 0, desktopOnly: true },
  { x: 86, y: 90, size: 15, rotate: 58, opacity: 0.3, tone: 1, drift: 15 },
  { x: 95, y: 80, size: 9, rotate: -130, opacity: 0.28, tone: 2 },
  { x: 62, y: 1, size: 6, rotate: 12, opacity: 0.18, tone: 1, desktopOnly: true },
];

function PetalLayer() {
  return (
    <span className="tc-petals" aria-hidden>
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className={`tc-petal${petal.drift ? " tc-petal--drift" : ""}${
            petal.desktopOnly ? " tc-petal--desktop" : ""
          }`}
          style={
            {
              left: `${petal.x}%`,
              top: `${petal.y}%`,
              width: `${petal.size}px`,
              height: `${Math.round(petal.size * 1.35)}px`,
              opacity: petal.opacity,
              color: PETAL_TONES[petal.tone],
              filter: petal.blur ? "blur(1px)" : undefined,
              "--tc-drift": petal.drift ? `${petal.drift}s` : undefined,
              "--tc-delay": `${-(index % 5) * 2}s`,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 20 27" style={{ transform: `rotate(${petal.rotate}deg)` }}>
            <path
              d="M10 26.5C4 22 1.2 15 2.8 9C4 4.5 7 2 9 1.6L10 4.2L11 1.6C13 2 16 4.5 17.2 9C18.8 15 16 22 10 26.5Z"
              fill="currentColor"
            />
          </svg>
        </span>
      ))}
    </span>
  );
}

type CareCardProps = {
  variant: "job" | "ai" | "style";
  wide?: boolean;
  ribbon: string;
  title: string[];
  sub: string[];
  badges: string[];
  art: ReactNode;
  onClick: () => void;
};

function CareCard({ variant, wide = false, ribbon, title, sub, badges, art, onClick }: CareCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tc-card tc-card--${variant} ${wide ? "tc-card--wide" : "tc-card--half"}`}
    >
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
      <PetalLayer />
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
          variant="ai"
          wide
          ribbon="初めての方へ"
          title={["不安なことを", "AIに相談"]}
          sub={["夜職が初めてでも、", "気になることを", "すぐ聞ける"]}
          badges={["24時間対応", "匿名OK"]}
          art={<AiChatIcon />}
          onClick={handleAiChat}
        />
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
