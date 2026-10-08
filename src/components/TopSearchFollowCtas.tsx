"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import { MEMBER_PATHS } from "@/lib/member-access";

function openChatBot() {
  window.dispatchEvent(new CustomEvent("wn:open-chat"));
}

const SKIN = "#fde3d3";
const HAIR = "#6b4436";
const INK = "#4a3428";

function Sparkle({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const q = r * 0.28;
  return (
    <path
      d={`M${x} ${y - r}L${x + q} ${y - q}L${x + r} ${y}L${x + q} ${y + q}L${x} ${y + r}L${x - q} ${y + q}L${x - r} ${y}L${x - q} ${y - q}Z`}
      fill={color}
    />
  );
}

function Heart({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <path
      d={`M${x} ${y + s * 0.9}C${x - s * 1.6} ${y - s * 0.1} ${x - s * 0.7} ${y - s * 1.1} ${x} ${y - s * 0.35}C${x + s * 0.7} ${y - s * 1.1} ${x + s * 1.6} ${y - s * 0.1} ${x} ${y + s * 0.9}Z`}
      fill={color}
    />
  );
}

function GirlFace({ cx, hairBack, accent }: { cx: number; hairBack: string; accent: string }) {
  const dx = cx - 48;
  return (
    <g transform={`translate(${dx} 0)`}>
      <path d={hairBack} fill={HAIR} />
      <rect x="44" y="58" width="8" height="12" rx="3" fill={SKIN} />
      <ellipse cx="48" cy="44" rx="14" ry="15" fill={SKIN} />
      <path
        d="M33 43C33 28 42 24 48 24C56 24 63 29 63 43C58 36 52 32 46 32C42 37 38 41 33 43Z"
        fill={HAIR}
      />
      <path d="M41 47q2.5 -2.6 5 0" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M51 47q2.5 -2.6 5 0" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="39.5" cy="51.5" rx="2.8" ry="1.6" fill="#f6a6b8" opacity="0.7" />
      <ellipse cx="57.5" cy="51.5" rx="2.8" ry="1.6" fill="#f6a6b8" opacity="0.7" />
      <path d="M46 53.5q2.5 2.2 5 0" fill="none" stroke="#d0687e" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M60 25l6 -4l-1 7z M60 25l-2 -7l-4 6z" fill={accent} />
      <circle cx="60" cy="25" r="1.8" fill="#ffffff" />
    </g>
  );
}

/** 職種診断：チェックリストを持つ女の子 */
function JobDiagnosisArt() {
  return (
    <svg viewBox="0 0 100 100" className="tc-art-svg" aria-hidden>
      <circle cx="50" cy="52" r="44" fill="#ffffff" opacity="0.85" />
      <path d="M22 100C24 79 34 70 46 70C58 70 68 79 70 100Z" fill="#f7b6c8" />
      <path d="M40 71L46 78L52 71" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <GirlFace
        cx={46}
        accent="#f48fb1"
        hairBack="M30 44C28 24 40 16 48 16C58 16 68 24 66 44C68 56 64 66 60 68L36 68C32 66 28 56 30 44Z"
      />
      <rect x="58" y="56" width="30" height="36" rx="5" fill="#ffffff" stroke="#e7799b" strokeWidth="2" />
      <rect x="66" y="52" width="14" height="7" rx="2.5" fill="#e7799b" />
      {[66, 75, 84].map((y) => (
        <g key={y}>
          <path d={`M62 ${y}l2.4 2.4l4.2 -4.6`} fill="none" stroke="#e7799b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="72" y1={y} x2="84" y2={y} stroke="#f6c4d2" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="59" cy="82" r="4" fill={SKIN} />
      <Heart x={84} y={22} s={6} color="#f48fb1" />
      <Sparkle x={16} y={26} r={5} color="#f3c76b" />
      <Sparkle x={90} y={44} r={3} color="#f6a6b8" />
    </svg>
  );
}

/** AI相談：やさしいロボ＋吹き出し */
function AiChatArt() {
  return (
    <svg viewBox="0 0 100 100" className="tc-art-svg" aria-hidden>
      <circle cx="50" cy="52" r="44" fill="#ffffff" opacity="0.85" />
      <line x1="44" y1="34" x2="44" y2="25" stroke="#b9a7ea" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="44" cy="22" r="4" fill="#f48fb1" />
      <rect x="18" y="45" width="6" height="14" rx="3" fill="#d7cbf3" />
      <rect x="64" y="45" width="6" height="14" rx="3" fill="#d7cbf3" />
      <rect x="22" y="34" width="44" height="34" rx="14" fill="#ffffff" stroke="#b9a7ea" strokeWidth="2.4" />
      <rect x="28" y="40" width="32" height="22" rx="9" fill="#7a64b8" />
      <path d="M36 51q2.5 -3 5 0" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M47 51q2.5 -3 5 0" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M41 56q3 2.2 6 0" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="33" cy="56" r="2" fill="#f6a6b8" opacity="0.85" />
      <circle cx="55" cy="56" r="2" fill="#f6a6b8" opacity="0.85" />
      <rect x="28" y="71" width="32" height="24" rx="11" fill="#ffffff" stroke="#b9a7ea" strokeWidth="2.4" />
      <Heart x={44} y={82} s={4.5} color="#f48fb1" />
      <path d="M64 10h22a7 7 0 0 1 7 7v8a7 7 0 0 1 -7 7h-12l-6 5v-5h-4a7 7 0 0 1 -7 -7v-8a7 7 0 0 1 7 -7z" fill="#ffffff" stroke="#b9a7ea" strokeWidth="2" />
      <circle cx="68" cy="21" r="2.2" fill="#9b86d6" />
      <circle cx="75" cy="21" r="2.2" fill="#9b86d6" />
      <circle cx="82" cy="21" r="2.2" fill="#9b86d6" />
      <circle cx="82" cy="62" r="8" fill="#e3f5ec" stroke="#8fd3b6" strokeWidth="1.6" />
      <path d="M78.5 62l2.5 2.5l4.5 -5" fill="none" stroke="#4fae86" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Sparkle x={12} y={24} r={4.5} color="#c9b8f0" />
      <Sparkle x={92} y={84} r={3.5} color="#f3c76b" />
    </svg>
  );
}

/** 接客タイプ診断：会話を楽しむ女の子 */
function SalesStyleArt() {
  return (
    <svg viewBox="0 0 100 100" className="tc-art-svg" aria-hidden>
      <circle cx="50" cy="52" r="44" fill="#ffffff" opacity="0.85" />
      <path d="M16 100C18 79 28 70 40 70C52 70 62 79 64 100Z" fill="#e9c9a3" />
      <path d="M34 72Q40 78 46 72" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <GirlFace
        cx={40}
        accent="#d9a0b4"
        hairBack="M29 44C26 22 40 15 48 15C58 15 70 22 67 44C70 58 66 74 70 84C62 88 56 80 56 70L40 70C40 80 34 88 26 84C30 74 26 58 29 44Z"
      />
      <path d="M62 12h24a7 7 0 0 1 7 7v7a7 7 0 0 1 -7 7h-14l-6 5v-5h-4a7 7 0 0 1 -7 -7v-7a7 7 0 0 1 7 -7z" fill="#ffffff" stroke="#e2b98a" strokeWidth="2" />
      <Heart x={74} y={22} s={5} color="#f48fb1" />
      <path d="M72 46h16a6 6 0 0 1 6 6v4a6 6 0 0 1 -6 6h-3v4l-5 -4h-8a6 6 0 0 1 -6 -6v-4a6 6 0 0 1 6 -6z" fill="#f6e3c8" stroke="#e2b98a" strokeWidth="1.6" />
      <path d="M75 55q2 -2.4 4 0q2 2.4 4 0q2 -2.4 4 0" fill="none" stroke="#c99a63" strokeWidth="1.6" strokeLinecap="round" />
      <Sparkle x={12} y={30} r={4.5} color="#f3c76b" />
      <Sparkle x={90} y={80} r={3.5} color="#f6a6b8" />
    </svg>
  );
}

function CardChevron() {
  return (
    <span className="tc-go" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 6l6 6-6 6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function CardDecor() {
  return (
    <span className="tc-decor" aria-hidden>
      <span className="tc-glow" />
      <svg className="tc-decor-heart" viewBox="0 0 24 24">
        <path d="M12 21C4 15 2 11 2 8a5 5 0 0 1 10 -1a5 5 0 0 1 10 1c0 3 -2 7 -10 13z" fill="currentColor" />
      </svg>
      <svg className="tc-decor-spark" viewBox="0 0 24 24">
        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="currentColor" />
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
      <CardDecor />
      <span className="tc-ribbon">{ribbon}</span>
      <span className="tc-art">{art}</span>
      <span className="tc-body">
        <span className="tc-title">
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
      <CardChevron />
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
        <p className="tc-eyebrow">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12 21C4 15 2 11 2 8a5 5 0 0 1 10 -1a5 5 0 0 1 10 1c0 3 -2 7 -10 13z"
              fill="currentColor"
            />
          </svg>
          はじめてでも安心
        </p>
        <h2 id="tc-heading" className="tc-heading">
          迷ったら、まずは無料で診断・相談
        </h2>
      </div>
      <div className="tc-grid">
        <CareCard
          variant="job"
          ribbon="おすすめ"
          title={["あなたに合う", "お仕事診断"]}
          sub={["未経験でも、", "自分に合う", "働き方がわかる"]}
          badges={["無料", "1分で診断"]}
          art={<JobDiagnosisArt />}
          onClick={handleDiagnosis}
        />
        <CareCard
          variant="ai"
          ribbon="初めての方へ"
          title={["不安なことを", "AIに相談"]}
          sub={["夜職が初めてでも、", "気になることを", "すぐ聞ける"]}
          badges={["24時間対応", "匿名OK"]}
          art={<AiChatArt />}
          onClick={handleAiChat}
        />
        <CareCard
          variant="style"
          ribbon="NEW"
          title={["あなたに合う", "接客タイプ診断"]}
          sub={["話し方や", "接客の強みが", "見つかる"]}
          badges={["無料", "相性チェック"]}
          art={<SalesStyleArt />}
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
