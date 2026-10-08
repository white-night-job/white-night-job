"use client";

import Link from "next/link";
import {
  Ban,
  Briefcase,
  Check,
  ClipboardList,
  Compass,
  Heart,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { SalesStyleCharacter } from "@/components/SalesStyleCharacter";
import { SalesStyleRecommendedJobs } from "@/components/SalesStyleRecommendedJobs";
import { useUserSession } from "@/components/UserSessionProvider";
import { startLiffLogin } from "@/lib/liff-auth-client";
import { logLiffDebug, navigateToWebLineOAuth } from "@/lib/liff-login-intent";
import { MEMBER_PATHS } from "@/lib/member-access";
import {
  SALES_STYLE_PROFILES,
  type SalesStyleAnswers,
  type SalesStyleResult,
  type SalesStyleTheme,
  type SavedSalesStyleResult,
} from "@/lib/sales-style-diagnosis";
import { writeUserCache } from "@/lib/user-data-cache";

function themeVars(theme: SalesStyleTheme): CSSProperties {
  return {
    "--ss-accent": theme.accent,
    "--ss-soft": theme.soft,
    "--ss-deep": theme.deep,
  } as CSSProperties;
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ss-section">
      <div className="ss-section-head">
        <span className="ss-section-icon" aria-hidden>
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <div>
          <p className="ss-section-eyebrow">{eyebrow}</p>
          <h3 className="ss-section-title font-serif">{title}</h3>
        </div>
      </div>
      <div className="ss-section-body">{children}</div>
    </section>
  );
}

function Card({
  title,
  variant,
  children,
}: {
  title: string;
  variant?: "caution" | "ng" | "accent";
  children: ReactNode;
}) {
  return (
    <div className={`ss-card${variant ? ` ss-card--${variant}` : ""}`}>
      <p className="ss-card-title">{title}</p>
      {children}
    </div>
  );
}

function BulletList({
  items,
  kind = "dot",
}: {
  items: string[];
  kind?: "dot" | "check" | "ng" | "num";
}) {
  return (
    <ul className={`ss-list ss-list--${kind}`}>
      {items.map((item, index) => (
        <li key={item}>
          <span className="ss-list-mark" aria-hidden>
            {kind === "check" ? (
              <Check size={12} strokeWidth={2.4} />
            ) : kind === "ng" ? (
              <Ban size={12} strokeWidth={2.2} />
            ) : kind === "num" ? (
              index + 1
            ) : null}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="ss-chips">
      {items.map((item) => (
        <li key={item} className="ss-chip">
          {item}
        </li>
      ))}
    </ul>
  );
}

type SalesStyleDiagnosisResultsProps = {
  result: SalesStyleResult;
  answers: SalesStyleAnswers;
  onReset: () => void;
};

export function SalesStyleDiagnosisResults({
  result,
  answers,
  onReset,
}: SalesStyleDiagnosisResultsProps) {
  const { currentUser, isLoggedIn, ready } = useUserSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  const main = SALES_STYLE_PROFILES[result.mainType];
  const sub = result.subType ? SALES_STYLE_PROFILES[result.subType] : null;

  async function saveToMyPage() {
    if (!isLoggedIn) {
      const redirect = MEMBER_PATHS.salesStyleDiagnosis;
      const login = await startLiffLogin({ redirectPath: redirect, action: "diagnosis" });
      if (login.status === "redirected") return;
      if (login.status === "completed") {
        window.location.assign(login.redirectPath);
        return;
      }
      if (login.status === "fallback_web") {
        logLiffDebug("fallback_web_login", { reason: login.reason, choseLiffUrl: false });
        await navigateToWebLineOAuth(redirect);
        return;
      }
      setMessage(login.message);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/sales-style-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ diagnosedAt: result.diagnosedAt, answers }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        history?: SavedSalesStyleResult[];
      };
      if (!response.ok) {
        throw new Error(data.message ?? "保存に失敗しました。");
      }
      if (data.history) {
        writeUserCache("mypage:sales-style-diagnosis", currentUser?.id, data.history);
      }
      setSaved(true);
      setMessage("診断結果をマイページに保存しました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="ss-result job-diagnosis-results job-diagnosis-results-visible"
      style={themeVars(main.theme)}
    >
      <header className="ss-hero">
        <p className="ss-hero-eyebrow">Your Sales Style</p>
        <p className="ss-hero-lead">あなたの営業スタイルは…</p>
        <SalesStyleCharacter type={main.type} />
        <p className="ss-hero-label">{main.characterLabel}</p>
        <h3 className="ss-hero-name font-serif">{main.name}</h3>
        <p className="ss-hero-catch">{main.catchCopy}</p>
        <ul className="ss-badges">
          {main.keywords.map((keyword) => (
            <li key={keyword}>#{keyword}</li>
          ))}
        </ul>
        <p className="ss-hero-summary">{main.summary}</p>
      </header>

      {sub ? (
        <aside className="ss-sub-card" style={themeVars(sub.theme)}>
          <SalesStyleCharacter type={sub.type} size="sm" />
          <div className="ss-sub-body">
            <p className="ss-sub-label">サブタイプ</p>
            <p className="ss-sub-name font-serif">{sub.name}</p>
            <p className="ss-sub-text">
              あなたは基本的には「{main.name}」ですが、「{sub.name}」の要素もあわせ持っています。
            </p>
            <p className="ss-sub-catch">{sub.catchCopy}</p>
            <ul className="ss-sub-points">
              {sub.strengths.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      ) : null}

      <Section icon={Sparkles} eyebrow="Character" title="あなたの特徴">
        <Card title="このタイプの強み" variant="accent">
          <BulletList items={main.strengths} kind="check" />
        </Card>
        <Card title="こういう場面で力を発揮しやすい">
          <Chips items={main.scenes} />
        </Card>
        <Card title="苦手になりやすい場面" variant="caution">
          <BulletList items={main.weaknesses} />
        </Card>
      </Section>

      <Section icon={Lightbulb} eyebrow="Advice" title="アドバイス">
        <Card title="今日から意識したい接客アドバイス" variant="accent">
          <BulletList items={main.advice} kind="num" />
        </Card>
        <Card title="おすすめの働き方">
          <BulletList items={main.workStyles} />
        </Card>
        <Card title="このタイプがもっと伸びるには？">
          <div className="ss-card-with-icon">
            <TrendingUp size={16} strokeWidth={1.8} className="ss-inline-icon" aria-hidden />
            <BulletList items={main.growth} />
          </div>
        </Card>
        <Card title="NGになりやすい行動" variant="ng">
          <BulletList items={main.ngActions} kind="ng" />
        </Card>
      </Section>

      <Section icon={Heart} eyebrow="Matching" title="相性">
        <Card title="相性の良い職種">
          <div className="ss-card-with-icon">
            <Briefcase size={16} strokeWidth={1.8} className="ss-inline-icon" aria-hidden />
            <Chips items={main.jobTypes.map((jobType) => jobType.label)} />
          </div>
        </Card>
        <Card title="こんなお客様と相性がいい">
          <div className="ss-card-with-icon">
            <Users size={16} strokeWidth={1.8} className="ss-inline-icon" aria-hidden />
            <BulletList items={main.customers} />
          </div>
        </Card>
      </Section>

      <SalesStyleRecommendedJobs type={result.mainType} sectionId="sales-style-shops" />

      <Section icon={Compass} eyebrow="Next Action" title="次のアクション">
        <p className="ss-next-note">
          気になるお店は ♡ で保存できます。詳細ページからそのまま応募もできます。
        </p>
        <button
          type="button"
          onClick={() => void saveToMyPage()}
          disabled={saving || saved || !ready}
          className="job-diagnosis-save-btn"
        >
          {saving ? "保存中..." : saved ? "保存しました" : "診断結果をマイページに保存"}
        </button>
        {message && <p className="job-diagnosis-save-message">{message}</p>}
        {!isLoggedIn && ready && (
          <p className="job-diagnosis-save-hint">
            LINEログイン後、マイページでいつでも確認できます。
          </p>
        )}
        <div className="ss-next-grid">
          <Link href="/mypage/favorites" className="ss-next-link">
            <Heart size={15} strokeWidth={1.8} aria-hidden />
            保存したお店を見る
          </Link>
          <Link href={MEMBER_PATHS.diagnosis} className="ss-next-link">
            <ClipboardList size={15} strokeWidth={1.8} aria-hidden />
            職種診断も受けてみる
          </Link>
        </div>
        <button type="button" onClick={onReset} className="ss-retry-btn">
          もう一度診断する
        </button>
      </Section>
    </div>
  );
}
