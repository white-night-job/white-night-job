"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import { MEMBER_PATHS } from "@/lib/member-access";

type FeatureAction = "link" | "ai" | "diagnosis";

type FeatureItem = {
  id: string;
  label: string;
  description: string;
  action: FeatureAction;
  href?: string;
  icon: ReactNode;
};

function IconInterview() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="feature-intro-icon-svg">
      <path
        fill="currentColor"
        d="M6 3h9l3 3v15H6V3zm2 4h8v1.5H8V7zm0 3.5h8V12H8v-1.5zm0 3.5h5.5V15.5H8V14z"
        opacity="0.95"
      />
      <path
        fill="currentColor"
        d="M14.5 17.2c.9 0 1.7.4 2.2 1.1.2-.2.5-.3.8-.3.8 0 1.4.6 1.4 1.4v.8H12.8v-.8c0-.8.6-1.4 1.4-1.4.2 0 .4.1.6.3.5-.7 1.3-1.1 2.2-1.1z"
      />
    </svg>
  );
}

function IconAi() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="feature-intro-icon-svg">
      <path
        fill="currentColor"
        d="M12 3.2a6.8 6.8 0 0 1 6.8 6.8v1.1c1.1.4 1.9 1.5 1.9 2.7 0 1.6-1.3 2.9-2.9 2.9h-.4v1.5c0 1.4-1.1 2.5-2.5 2.5H9.1c-1.4 0-2.5-1.1-2.5-2.5V16.7h-.4C4.6 16.7 3.3 15.4 3.3 13.8c0-1.2.8-2.3 1.9-2.7V10A6.8 6.8 0 0 1 12 3.2zm-2.4 7.3a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zm4.8 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"
      />
    </svg>
  );
}

function IconStaff() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="feature-intro-icon-svg">
      <path
        fill="currentColor"
        d="M12 4.2a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2zm0 8.8c3.7 0 6.8 2.1 6.8 4.7v1.1H5.2v-1.1c0-2.6 3.1-4.7 6.8-4.7z"
      />
    </svg>
  );
}

function IconDiagnosis() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="feature-intro-icon-svg">
      <path
        fill="currentColor"
        d="M12 2.8 13.4 8l5.2.2-4.1 3.3 1.4 5.1L12 13.8 8.1 16.6l1.4-5.1L5.4 8.2 10.6 8 12 2.8z"
      />
      <path
        fill="currentColor"
        d="M18.2 4.4 18.8 6.4l2 .1-1.6 1.2.5 1.9-1.7-1.1-1.7 1.1.5-1.9-1.6-1.2 2-.1.6-2z"
        opacity="0.75"
      />
    </svg>
  );
}

function IconVideo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="feature-intro-icon-svg">
      <path
        fill="currentColor"
        d="M3.5 6.5h12.2c1 0 1.8.8 1.8 1.8v7.4c0 1-.8 1.8-1.8 1.8H3.5c-1 0-1.8-.8-1.8-1.8V8.3c0-1 .8-1.8 1.8-1.8zm14.4 2.2 4.4-2.2v9l-4.4-2.2V8.7z"
      />
    </svg>
  );
}

const FEATURES: FeatureItem[] = [
  {
    id: "interview",
    label: "面接前相談受付",
    description: "応募や面接前の不安を担当者へ相談できます",
    action: "link",
    href: "/pre-interview-consultation",
    icon: <IconInterview />,
  },
  {
    id: "ai",
    label: "AI相談",
    description: "夜職に関する悩みをいつでもAIへ相談できます",
    action: "ai",
    icon: <IconAi />,
  },
  {
    id: "staff",
    label: "担当者顔付き紹介",
    description: "担当者の顔やプロフィールを事前に確認できます",
    action: "link",
    href: "/staff-intro",
    icon: <IconStaff />,
  },
  {
    id: "diagnosis",
    label: "あなたに合う職種診断",
    description: "11問で向いている夜職を診断できます",
    action: "diagnosis",
    icon: <IconDiagnosis />,
  },
  {
    id: "videos",
    label: "店内動画",
    description: "写真だけでは分からない店内の雰囲気を確認できます",
    action: "link",
    href: "/shop-videos",
    icon: <IconVideo />,
  },
];

function FeatureContent({ feature }: { feature: FeatureItem }) {
  return (
    <>
      <span className="feature-intro-icon">{feature.icon}</span>
      <span className="feature-intro-label">{feature.label}</span>
      <span className="feature-intro-desc">{feature.description}</span>
      <span className="feature-intro-arrow" aria-hidden>
        ›
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
        <div className="feature-intro-rule feature-intro-rule-top" aria-hidden />

        <div className="feature-intro-header">
          <h2 id="feature-intro-title" className="feature-intro-title font-serif">
            White Nightの便利な機能
          </h2>
          <p className="feature-intro-subtitle">
            安心してお店選びができる便利な機能をご用意しています。
          </p>
        </div>

        <nav aria-label="便利な機能" className="feature-intro-nav">
          <ul className="feature-intro-row">
            {FEATURES.map((feature, index) => (
              <li key={feature.id} className="feature-intro-item">
                {index > 0 && (
                  <span className="feature-intro-divider" aria-hidden />
                )}
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
