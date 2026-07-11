"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bot,
  ChevronRight,
  Clapperboard,
  ClipboardList,
  Crown,
  MessageSquareCheck,
  UserRound,
} from "lucide-react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import { MEMBER_PATHS } from "@/lib/member-access";

type FeatureAction = "link" | "ai" | "diagnosis";

type FeatureItem = {
  id: string;
  label: string;
  action: FeatureAction;
  href?: string;
  icon: ReactNode;
};

const ICON_PROPS = {
  className: "feature-intro-icon-svg",
  strokeWidth: 1.5,
} as const;

const FEATURES: FeatureItem[] = [
  {
    id: "interview",
    label: "面接前相談",
    action: "link",
    href: "/pre-interview-consultation",
    icon: <MessageSquareCheck {...ICON_PROPS} />,
  },
  {
    id: "ai",
    label: "AI相談",
    action: "ai",
    icon: <Bot {...ICON_PROPS} />,
  },
  {
    id: "staff",
    label: "担当者紹介",
    action: "link",
    href: "/staff-intro",
    icon: <UserRound {...ICON_PROPS} />,
  },
  {
    id: "diagnosis",
    label: "職種診断",
    action: "diagnosis",
    icon: <ClipboardList {...ICON_PROPS} />,
  },
  {
    id: "videos",
    label: "店内動画",
    action: "link",
    href: "/shop-videos",
    icon: <Clapperboard {...ICON_PROPS} />,
  },
];

function FeatureContent({ feature }: { feature: FeatureItem }) {
  return (
    <>
      <span className="feature-intro-icon">{feature.icon}</span>
      <span className="feature-intro-label">{feature.label}</span>
      <span className="feature-intro-arrow" aria-hidden>
        <ChevronRight strokeWidth={1.5} className="feature-intro-arrow-svg" />
      </span>
    </>
  );
}

export function TopFeatureIntroSection() {
  const router = useRouter();
  const { isLoggedIn, ready } = useUserSession();
  const [gate, setGate] = useState<"ai" | "diagnosis" | null>(null);

  function handleFeatureClick(feature: FeatureItem) {
    if (feature.action === "link" && feature.href) {
      router.push(feature.href);
      return;
    }

    if (!ready) return;

    if (feature.action === "ai") {
      if (isLoggedIn) {
        router.push(MEMBER_PATHS.consultation);
        return;
      }
      setGate("ai");
      return;
    }

    if (feature.action === "diagnosis") {
      if (isLoggedIn) {
        router.push(MEMBER_PATHS.diagnosis);
        return;
      }
      setGate("diagnosis");
    }
  }

  return (
    <section
      className="feature-intro-section"
      aria-labelledby="feature-intro-title"
    >
      <div className="feature-intro-band">
        <div className="feature-intro-glow" aria-hidden />
        <div className="feature-intro-rule feature-intro-rule-top" aria-hidden />

        <div className="feature-intro-header">
          <Crown
            className="feature-intro-crown"
            strokeWidth={1.4}
            aria-hidden
          />
          <div className="feature-intro-title-row">
            <span className="feature-intro-title-line" aria-hidden />
            <h2 id="feature-intro-title" className="feature-intro-title font-serif">
              White Nightの便利な機能
            </h2>
            <span className="feature-intro-title-line" aria-hidden />
          </div>
          <p className="feature-intro-subtitle">
            安心してお店を選ぶための、5つのサポート。
          </p>
        </div>

        <nav aria-label="便利な機能" className="feature-intro-nav">
          <ul className="feature-intro-row">
            {FEATURES.map((feature, index) => (
              <li key={feature.id} className="feature-intro-item">
                {index > 0 ? (
                  <span className="feature-intro-divider" aria-hidden />
                ) : null}
                {feature.action === "link" && feature.href ? (
                  <Link href={feature.href} className="feature-intro-link">
                    <FeatureContent feature={feature} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="feature-intro-link"
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <FeatureContent feature={feature} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="feature-intro-rule feature-intro-rule-bottom" aria-hidden />
      </div>

      <MemberGateModal
        open={gate === "ai"}
        onClose={() => setGate(null)}
        title="AI相談はLINEログイン後に利用できます"
        description="LINEログインすると、相談履歴を保存しながらAIへ相談できます。"
        redirectPath={MEMBER_PATHS.consultation}
      />
      <MemberGateModal
        open={gate === "diagnosis"}
        onClose={() => setGate(null)}
        title="職種診断はLINEログイン後に利用できます"
        description="診断結果を保存して、あなたに合う職種や求人をいつでも確認できます。"
        redirectPath={MEMBER_PATHS.diagnosis}
      />
    </section>
  );
}
