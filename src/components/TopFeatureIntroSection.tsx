"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import { MEMBER_PATHS } from "@/lib/member-access";

type FeatureAction = "link" | "ai" | "diagnosis";

type FeatureItem = {
  id: string;
  icon: string;
  label: string;
  action: FeatureAction;
  href?: string;
};

const FEATURES: FeatureItem[] = [
  {
    id: "interview",
    icon: "📝",
    label: "面接前相談受付",
    action: "link",
    href: "/pre-interview-consultation",
  },
  {
    id: "ai",
    icon: "🤖",
    label: "AI相談",
    action: "ai",
  },
  {
    id: "staff",
    icon: "👤",
    label: "担当者紹介",
    action: "link",
    href: "/staff-intro",
  },
  {
    id: "diagnosis",
    icon: "✨",
    label: "職種診断",
    action: "diagnosis",
  },
  {
    id: "videos",
    icon: "🎥",
    label: "店内動画",
    action: "link",
    href: "/shop-videos",
  },
];

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
    <section className="feature-intro-section" aria-labelledby="feature-intro-title">
      <div className="feature-intro-header">
        <h2 id="feature-intro-title" className="feature-intro-title font-serif">
          White Nightの便利な機能
        </h2>
        <p className="feature-intro-subtitle">
          安心してお店選びができる便利な機能をご用意しています。
        </p>
      </div>

      <ul className="feature-intro-grid">
        {FEATURES.map((feature) => {
          if (feature.action === "link" && feature.href) {
            return (
              <li key={feature.id}>
                <Link href={feature.href} className="feature-intro-card">
                  <span className="feature-intro-icon" aria-hidden>
                    {feature.icon}
                  </span>
                  <span className="feature-intro-label">{feature.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={feature.id}>
              <button
                type="button"
                className="feature-intro-card"
                onClick={() => handleFeatureClick(feature)}
              >
                <span className="feature-intro-icon" aria-hidden>
                  {feature.icon}
                </span>
                <span className="feature-intro-label">{feature.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

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
