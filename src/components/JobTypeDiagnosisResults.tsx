"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CalendarDays,
  Check,
  Clock,
  Coffee,
  Crown,
  Ear,
  Gem,
  Heart,
  Home,
  Info,
  Lightbulb,
  MessageCircle,
  Moon,
  Shirt,
  Smile,
  Sparkles,
  Sprout,
  Star,
  TrendingUp,
  Users,
  Wine,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useCompare } from "@/components/CompareProvider";
import { JobTypeDiagnosisSharePanel } from "@/components/JobTypeDiagnosisSharePanel";
import { JobTypeIllustration } from "@/components/JobTypeIllustration";
import { JobTypeRecommendedJobs } from "@/components/JobTypeRecommendedJobs";
import {
  buildDiagnosisStrengths,
  JOB_TYPE_VISUALS,
  type JobTypeSuitedIcon,
  type JobTypeVisual,
} from "@/data/job-type-diagnosis/visuals";
import { useUserSession } from "@/components/UserSessionProvider";
import {
  buildDiagnosisJobsUrl,
  buildDiagnosisTrialJobsUrl,
  formatDiagnosisDate,
  getSocialProofApplyRate,
  type DiagnosisAnswers,
  type DiagnosisResult,
  type DiagnosisResultItem,
  type RecommendedDiagnosisShop,
  type SavedDiagnosisResult,
} from "@/lib/job-type-diagnosis";
import {
  formatPreferredAreasLabel,
  pickRecommendedDiagnosisShops,
} from "@/lib/job-type-diagnosis-recommendations";
import { fetchJobs } from "@/lib/job-storage";
import { startLiffLogin } from "@/lib/liff-auth-client";
import { logLiffDebug, navigateToWebLineOAuth } from "@/lib/liff-login-intent";
import { MEMBER_PATHS } from "@/lib/member-access";
import { usePreferredAreas } from "@/lib/preferred-areas-client";
import { IMAGE_ALT_BRAND } from "@/lib/site";

const SUITED_ICONS: Record<JobTypeSuitedIcon, LucideIcon> = {
  message: MessageCircle,
  sprout: Sprout,
  calendar: CalendarDays,
  smile: Smile,
  heart: Heart,
  sparkles: Sparkles,
  coffee: Coffee,
  star: Star,
  users: Users,
  home: Home,
  clock: Clock,
  ear: Ear,
  gem: Gem,
  briefcase: Briefcase,
  trending: TrendingUp,
  shirt: Shirt,
  wine: Wine,
  crown: Crown,
  moon: Moon,
};

function themeVars(visual: JobTypeVisual): CSSProperties {
  return {
    "--ss-accent": visual.theme.accent,
    "--ss-soft": visual.theme.soft,
    "--ss-deep": visual.theme.deep,
  } as CSSProperties;
}

function AptitudeGauge({ percent, compact = false }: { percent: number; compact?: boolean }) {
  return (
    <div className={`jt-gauge${compact ? " jt-gauge--compact" : ""}`}>
      <div className="jt-gauge-head">
        <span className="jt-gauge-label">適性</span>
        <span className="jt-gauge-value">
          {percent}
          <small>%</small>
        </span>
      </div>
      <div
        className="jt-gauge-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`適性${percent}%`}
      >
        <div className="jt-gauge-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ResultSection({
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
    <section className="ss-section jt-section">
      <div className="ss-section-head">
        <span className="ss-section-icon" aria-hidden>
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <div>
          <p className="ss-section-eyebrow">{eyebrow}</p>
          <h4 className="ss-section-title font-serif">{title}</h4>
        </div>
      </div>
      <div className="ss-section-body">{children}</div>
    </section>
  );
}

function TopResultCard({
  item,
  answers,
}: {
  item: DiagnosisResultItem;
  answers: DiagnosisAnswers;
}) {
  const visual = JOB_TYPE_VISUALS[item.jobType];
  const strengths = buildDiagnosisStrengths(answers);

  return (
    <div className="ss-result jt-result" style={themeVars(visual)}>
      <article className="ss-hero jt-hero" aria-labelledby="jt-top-heading">
        <p className="jt-rank-badge">
          <Crown size={14} strokeWidth={2} aria-hidden />
          第1位
        </p>
        <JobTypeIllustration visual={visual} label={item.jobType} />
        <h3 id="jt-top-heading" className="ss-hero-name font-serif">
          {item.jobType}
        </h3>
        <p className="ss-hero-catch">{visual.catchCopy}</p>
        <ul className="ss-badges">
          {visual.keywords.map((keyword) => (
            <li key={keyword}>{keyword}</li>
          ))}
        </ul>
        <AptitudeGauge percent={item.percent} />
      </article>

      <ResultSection icon={Sparkles} eyebrow="Reason" title="あなたに合う理由">
        <p className="jt-text">{visual.fitReason}</p>
      </ResultSection>

      <ResultSection icon={Users} eyebrow="Match" title="こんな人に向いています">
        <ul className="jt-suited-grid">
          {visual.suitedFor.map((suited) => {
            const Icon = SUITED_ICONS[suited.icon];
            return (
              <li key={suited.label} className="jt-suited-item">
                <span className="jt-suited-icon" aria-hidden>
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                <span>{suited.label}</span>
              </li>
            );
          })}
        </ul>
      </ResultSection>

      <ResultSection icon={Gem} eyebrow="Merit" title="この職種のメリット">
        <ul className="jt-merit-list">
          {item.merits.map((merit) => (
            <li key={merit} className="jt-merit-card">
              <Check size={14} strokeWidth={2.4} aria-hidden />
              <span>{merit}</span>
            </li>
          ))}
        </ul>
      </ResultSection>

      <ResultSection icon={Info} eyebrow="Before you start" title="働く前に知っておきたいこと">
        <div className="ss-card ss-card--caution">
          <ul className="ss-list ss-list--dot">
            {item.cautions.map((caution) => (
              <li key={caution}>
                <span className="ss-list-mark" aria-hidden />
                <span>{caution}</span>
              </li>
            ))}
          </ul>
          <p className="jt-soft-note">事前に知っておけば大丈夫。面接や体験入店で気軽に確認してみましょう。</p>
        </div>
      </ResultSection>

      <ResultSection icon={Star} eyebrow="Your strength" title="この職種で活かせるあなたの強み">
        {strengths.length > 0 ? (
          <ul className="ss-chips">
            {strengths.map((strength) => (
              <li key={strength} className="ss-chip">
                {strength}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="ss-card ss-card--accent ss-card-with-icon">
          <Lightbulb size={16} className="ss-inline-icon" aria-hidden />
          <p className="jt-text">{visual.advice}</p>
        </div>
      </ResultSection>

      <ResultSection icon={TrendingUp} eyebrow="Tips" title="この職種で働くコツ">
        <ol className="ss-list ss-list--num">
          {visual.tips.map((tip, index) => (
            <li key={tip}>
              <span className="ss-list-mark" aria-hidden>
                {index + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ol>
      </ResultSection>

      <JobTypeRecommendedJobs jobType={item.jobType} jobsUrl={item.jobsUrl} />
    </div>
  );
}

function RunnerUpCard({ rank, item }: { rank: 2 | 3; item: DiagnosisResultItem }) {
  const visual = JOB_TYPE_VISUALS[item.jobType];
  return (
    <article className="jt-runner" style={themeVars(visual)}>
      <JobTypeIllustration visual={visual} size="sm" label={item.jobType} />
      <div className="jt-runner-body">
        <p className="jt-runner-rank">第{rank}位</p>
        <h4 className="jt-runner-name font-serif">{item.jobType}</h4>
        <p className="jt-runner-catch">{visual.catchCopy}</p>
        <AptitudeGauge percent={item.percent} compact />
        <Link href={item.jobsUrl} className="jt-runner-link">
          この職種の求人を見る
        </Link>
      </div>
    </article>
  );
}

function RecommendedShopCard({ shop }: { shop: RecommendedDiagnosisShop }) {
  return (
    <article className="job-diagnosis-shop-card">
      <div className="job-diagnosis-shop-image-wrap">
        {shop.imageUrl ? (
          <img
            src={shop.imageUrl}
            alt={`${shop.shopName}の求人｜${IMAGE_ALT_BRAND}`}
            className="job-diagnosis-shop-image"
          />
        ) : (
          <div className="job-diagnosis-shop-image-placeholder font-serif">
            White Night
          </div>
        )}
      </div>

      <div className="job-diagnosis-shop-body">
        <h4 className="job-diagnosis-shop-name font-serif">{shop.shopName}</h4>
        <dl className="job-diagnosis-shop-meta">
          <div>
            <dt>エリア</dt>
            <dd>{shop.areaLabel}</dd>
          </div>
          <div>
            <dt>時給</dt>
            <dd className="job-diagnosis-shop-salary">{shop.salary}</dd>
          </div>
          <div>
            <dt>職種</dt>
            <dd>{shop.jobType}</dd>
          </div>
        </dl>
        <div className="job-diagnosis-shop-reason-block">
          <p className="job-diagnosis-shop-reason-label">診断とのマッチ理由</p>
          <p className="job-diagnosis-shop-reason">{shop.reason}</p>
        </div>
        <Link href={shop.detailUrl} className="job-diagnosis-shop-detail-btn">
          詳しく見る
        </Link>
      </div>
    </article>
  );
}

type JobTypeDiagnosisResultsProps = {
  result: DiagnosisResult;
  answers: DiagnosisAnswers;
  onReset: () => void;
};

export function JobTypeDiagnosisResults({
  result,
  answers,
  onReset,
}: JobTypeDiagnosisResultsProps) {
  const router = useRouter();
  const { setCompareIds, showToast } = useCompare();
  const { isLoggedIn, ready } = useUserSession();
  const [recommendedShops, setRecommendedShops] = useState<RecommendedDiagnosisShop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [history, setHistory] = useState<SavedDiagnosisResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const {
    areas: userPreferredAreas,
    configured: hasUserPreferredAreas,
    ready: preferredAreasReady,
  } = usePreferredAreas();
  // おすすめ店舗はマイページの希望エリアで絞り込む。未設定なら全エリア（保存する回答は変更しない）
  const recommendationAnswers = useMemo<DiagnosisAnswers>(
    () => ({
      ...answers,
      preferredAreas: hasUserPreferredAreas ? [...userPreferredAreas] : null,
    }),
    [answers, hasUserPreferredAreas, userPreferredAreas],
  );

  const socialProof = getSocialProofApplyRate(result.topTwo[0].jobType);
  const primaryJobsUrl = buildDiagnosisJobsUrl(result.topTwo[0].jobType);
  const trialJobsUrl = buildDiagnosisTrialJobsUrl(result.topTwo[0].jobType);
  const preferredAreasLabel = formatPreferredAreasLabel(
    recommendationAnswers.preferredAreas,
  );

  function goCompareRecommended() {
    const ids = recommendedShops.map((shop) => shop.jobId).slice(0, 3);
    if (ids.length === 0) {
      showToast("比較できるおすすめ店舗がありません", "error");
      return;
    }
    setCompareIds(ids);
    router.push("/compare");
  }

  useEffect(() => {
    if (!preferredAreasReady) return;
    let cancelled = false;
    setLoadingShops(true);

    fetchJobs()
      .then((jobs) => {
        if (cancelled) return;
        setRecommendedShops(
          pickRecommendedDiagnosisShops(jobs, result, recommendationAnswers, 10),
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingShops(false);
      });

    return () => {
      cancelled = true;
    };
  }, [result, recommendationAnswers, preferredAreasReady]);

  useEffect(() => {
    if (!isLoggedIn || !ready) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    fetch("/api/job-type-diagnosis", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { history?: SavedDiagnosisResult[] };
      })
      .then((data) => {
        if (cancelled || !data?.history) return;
        setHistory(data.history);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, ready, result.diagnosedAt]);

  async function saveToMyPage() {
    if (!isLoggedIn) {
      const redirect = MEMBER_PATHS.diagnosis;
      const result = await startLiffLogin({
        redirectPath: redirect,
        action: "diagnosis",
      });
      if (result.status === "redirected") return;
      if (result.status === "completed") {
        window.location.assign(result.redirectPath);
        return;
      }
      if (result.status === "fallback_web") {
        logLiffDebug("fallback_web_login", {
          reason: result.reason,
          choseLiffUrl: false,
        });
        await navigateToWebLineOAuth(redirect);
        return;
      }
      setMessage(result.message);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/job-type-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          diagnosedAt: result.diagnosedAt,
          firstJobType: result.topTwo[0].jobType,
          firstPercent: result.topTwo[0].percent,
          secondJobType: result.topTwo[1].jobType,
          secondPercent: result.topTwo[1].percent,
          answers,
          resultSignature: result.resultSignature,
        }),
      });
      const data = (await response.json()) as {
        message?: string;
        history?: SavedDiagnosisResult[];
      };
      if (!response.ok) {
        throw new Error(data.message ?? "保存に失敗しました。");
      }
      if (data.history) setHistory(data.history);
      setMessage("診断結果をマイページに保存しました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="job-diagnosis-results job-diagnosis-results-visible">
      <p className="job-diagnosis-results-heading font-serif">診断結果</p>
      {preferredAreasLabel ? (
        <p className="job-diagnosis-preferred-areas">
          希望エリア：{preferredAreasLabel}
        </p>
      ) : null}

      <TopResultCard item={result.topTwo[0]} answers={answers} />

      <section className="jt-runners" aria-labelledby="jt-runners-heading">
        <h3 id="jt-runners-heading" className="jt-runners-title font-serif">
          こちらの職種も向いています
        </h3>
        <div className="jt-runners-list">
          {result.ranked.slice(1, 3).map((item, index) => (
            <RunnerUpCard key={item.jobType} rank={index === 0 ? 2 : 3} item={item} />
          ))}
        </div>
      </section>

      <section className="job-diagnosis-empathy-card" aria-labelledby="job-diagnosis-empathy-heading">
        <h3 id="job-diagnosis-empathy-heading" className="job-diagnosis-empathy-title font-serif">
          あなたと同じ診断結果だった方は...
        </h3>
        <p className="job-diagnosis-empathy-stat">
          <span className="job-diagnosis-empathy-percent">{socialProof.percent}%</span>
          が{result.topTwo[0].jobType}へ応募しています。
        </p>
        {socialProof.source === "dummy" && (
          <p className="job-diagnosis-empathy-note">
            ※ 実際の応募データが蓄積されるまで、参考値を表示しています。
          </p>
        )}
      </section>

      <section className="job-diagnosis-shops-section" aria-labelledby="job-diagnosis-shops-heading">
        <h3 id="job-diagnosis-shops-heading" className="job-diagnosis-section-title font-serif">
          おすすめ店舗
        </h3>
        <p className="job-diagnosis-section-lead">
          {hasUserPreferredAreas
            ? "あなたの診断結果と希望エリアに合うお店をピックアップしました。"
            : "あなたの診断結果に合うお店を全エリアからピックアップしました。"}
        </p>

        {loadingShops ? (
          <p className="job-diagnosis-shops-loading">おすすめ店舗を読み込み中...</p>
        ) : recommendedShops.length > 0 ? (
          <div className="job-diagnosis-shops-grid">
            {recommendedShops.map((shop) => (
              <RecommendedShopCard key={shop.jobId} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="job-diagnosis-shops-empty">
            <p>
              {hasUserPreferredAreas
                ? "現在、診断結果と希望エリアの両方に一致するおすすめ店舗はありません。"
                : "現在、診断結果に一致するおすすめ店舗はありません。"}
            </p>
            <Link href="/#shop-search" className="job-diagnosis-shops-search-btn">
              店舗を検索する
            </Link>
          </div>
        )}
      </section>

      <section className="job-diagnosis-trial-card" aria-labelledby="job-diagnosis-trial-heading">
        <h3 id="job-diagnosis-trial-heading" className="job-diagnosis-trial-title font-serif">
          まずは体験入店から始めてみませんか？
        </h3>
        <p className="job-diagnosis-trial-text">
          いきなり本入店せず、雰囲気を確かめながら始められるお店をご紹介しています。
        </p>
        <Link href={trialJobsUrl} className="job-diagnosis-trial-btn">
          体験入店できるお店を見る
        </Link>
      </section>

      <section className="job-diagnosis-advice-card">
        <h3 className="job-diagnosis-advice-title font-serif">あなたへのアドバイス</h3>
        <ul className="job-diagnosis-advice-list">
          {result.advice.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <JobTypeDiagnosisSharePanel result={result} onMessage={setMessage} />

      {isLoggedIn && history.length > 0 && (
        <section className="job-diagnosis-history-card" aria-labelledby="job-diagnosis-history-heading">
          <h3 id="job-diagnosis-history-heading" className="job-diagnosis-section-title font-serif">
            診断履歴
          </h3>
          <p className="job-diagnosis-section-lead">直近5回まで保存されています。</p>
          <ul className="job-diagnosis-history-list">
            {history.map((entry) => (
              <li key={entry.id ?? entry.diagnosedAt} className="job-diagnosis-history-item">
                <p className="job-diagnosis-history-date">
                  診断日：{formatDiagnosisDate(entry.diagnosedAt)}
                </p>
                <div className="job-diagnosis-history-ranks">
                  <p>
                    <span>第1位</span> {entry.firstJobType}（{entry.firstPercent}%）
                  </p>
                  <p>
                    <span>第2位</span> {entry.secondJobType}（{entry.secondPercent}%）
                  </p>
                  {entry.preferredAreas && entry.preferredAreas.length > 0 ? (
                    <p>
                      <span>希望エリア</span>{" "}
                      {formatPreferredAreasLabel(entry.preferredAreas)}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="job-diagnosis-actions">
        <button
          type="button"
          onClick={() => void saveToMyPage()}
          disabled={saving || !ready}
          className="job-diagnosis-save-btn"
        >
          {saving ? "保存中..." : "診断結果をLINEへ保存"}
        </button>
        {message && <p className="job-diagnosis-save-message">{message}</p>}
        {!isLoggedIn && ready && (
          <p className="job-diagnosis-save-hint">
            LINEログイン後、マイページでいつでも確認できます。
          </p>
        )}
      </div>

      <div className="job-diagnosis-secondary-actions">
        <button type="button" onClick={onReset} className="job-diagnosis-secondary-btn">
          もう一度診断する
        </button>
      </div>

      <Link href={primaryJobsUrl} className="job-diagnosis-primary-cta">
        あなたに合う求人をもっと見る
      </Link>

      {recommendedShops.length > 0 && (
        <button
          type="button"
          onClick={goCompareRecommended}
          disabled={loadingShops}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-gold/40 bg-charcoal px-5 text-sm font-semibold text-gold-light disabled:opacity-60"
        >
          あなたにおすすめの店舗を比較する
        </button>
      )}
    </div>
  );
}
