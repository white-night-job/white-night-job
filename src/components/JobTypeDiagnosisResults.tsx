"use client";

import Link from "next/link";
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
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
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
  formatDiagnosisDate,
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
import { invalidateUserCache, writeUserCache } from "@/lib/user-data-cache";

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightKeywords(text: string, keywords: string[]): ReactNode {
  const keys = [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (keys.length === 0) return text;
  const pattern = new RegExp(`(${keys.map(escapeRegExp).join("|")})`, "g");
  return text.split(pattern).map((part, index) =>
    keys.includes(part) ? <strong key={`${part}-${index}`}>{part}</strong> : part,
  );
}

function RichCopy({ text, keywords }: { text: string; keywords: string[] }) {
  const sentences = text.split("。").filter((sentence) => sentence.trim().length > 0);
  if (sentences.length <= 1) {
    return <p className="jt-text">{highlightKeywords(text, keywords)}</p>;
  }
  return (
    <div className="jt-prose">
      {sentences.map((sentence) => (
        <p key={sentence} className="jt-text">
          {highlightKeywords(`${sentence}。`, keywords)}
        </p>
      ))}
    </div>
  );
}

function DetailToggle({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="jt-fold">
      {open ? <div className="jt-fold-body">{children}</div> : null}
      <button
        type="button"
        className="jt-fold-btn"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "閉じる" : "詳しく見る"}
      </button>
    </div>
  );
}

function HeroResultCard({ item }: { item: DiagnosisResultItem }) {
  const visual = JOB_TYPE_VISUALS[item.jobType];

  return (
    <article className="ss-hero jt-hero" style={themeVars(visual)} aria-labelledby="jt-top-heading">
      <p className="jt-rank-badge">
        <Crown size={14} strokeWidth={2} aria-hidden />
        第1位
      </p>
      <div className="jt-hero-art">
        <JobTypeIllustration visual={visual} label={item.jobType} />
      </div>
      <h3 id="jt-top-heading" className="ss-hero-name font-serif">
        {item.jobType}
      </h3>
      <AptitudeGauge percent={item.percent} />
      <p className="ss-hero-catch">{visual.catchCopy}</p>
      <ul className="ss-badges jt-hero-tags">
        {visual.keywords.map((keyword) => (
          <li key={keyword}>{keyword}</li>
        ))}
      </ul>
    </article>
  );
}

function DiagnosisNarrative({
  item,
  answers,
}: {
  item: DiagnosisResultItem;
  answers: DiagnosisAnswers;
}) {
  const visual = JOB_TYPE_VISUALS[item.jobType];
  const strengths = buildDiagnosisStrengths(answers);
  const keywords = visual.keywords;

  return (
    <div className="jt-narrative" style={themeVars(visual)}>
      <section className="jt-panel">
        <p className="jt-panel-eyebrow">Reason</p>
        <h4 className="jt-panel-title font-serif">あなたに合う理由</h4>
        <RichCopy text={visual.fitReason} keywords={keywords} />
        <h4 className="jt-panel-subtitle font-serif">こんな人に向いています</h4>
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
      </section>

      <section className="jt-panel">
        <p className="jt-panel-eyebrow">Merit</p>
        <h4 className="jt-panel-title font-serif">この職種のメリット</h4>
        <ul className="jt-merit-list">
          {item.merits.map((merit) => (
            <li key={merit} className="jt-merit-card">
              <Check size={14} strokeWidth={2.4} aria-hidden />
              <span>{highlightKeywords(merit, keywords)}</span>
            </li>
          ))}
        </ul>
        <DetailToggle>
          <h4 className="jt-panel-subtitle font-serif">働く前に知っておきたいこと</h4>
          <ul className="jt-caution-list">
            {item.cautions.map((caution) => (
              <li key={caution}>{highlightKeywords(caution, keywords)}</li>
            ))}
          </ul>
          <p className="jt-soft-note">
            事前に知っておけば大丈夫。面接や体験入店で気軽に確認してみましょう。
          </p>
        </DetailToggle>
      </section>

      <section className="jt-panel">
        <p className="jt-panel-eyebrow">Your strength</p>
        <h4 className="jt-panel-title font-serif">この職種で活かせるあなたの強み</h4>
        {strengths.length > 0 ? (
          <ul className="jt-strength-list">
            {strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        ) : null}
        <h4 className="jt-panel-subtitle font-serif">この職種で働くコツ</h4>
        <ol className="jt-step-list">
          {visual.tips.map((tip, index) => (
            <li key={tip}>
              <span aria-hidden>{index + 1}</span>
              <p>{highlightKeywords(tip, keywords)}</p>
            </li>
          ))}
        </ol>
        <DetailToggle>
          <h4 className="jt-panel-subtitle font-serif">詳しいアドバイス</h4>
          <RichCopy text={visual.advice} keywords={keywords} />
        </DetailToggle>
      </section>
    </div>
  );
}

function RunnerUpCard({
  rank,
  item,
  answers,
}: {
  rank: 2 | 3;
  item: DiagnosisResultItem;
  answers: DiagnosisAnswers;
}) {
  const visual = JOB_TYPE_VISUALS[item.jobType];
  const [open, setOpen] = useState(false);

  return (
    <article className="jt-runner" style={themeVars(visual)}>
      <div className="jt-runner-summary">
        <JobTypeIllustration visual={visual} size="sm" label={item.jobType} />
        <div className="jt-runner-body">
          <p className="jt-runner-rank">第{rank}位</p>
          <h4 className="jt-runner-name font-serif">{item.jobType}</h4>
          <AptitudeGauge percent={item.percent} compact />
        </div>
      </div>
      <button
        type="button"
        className="jt-fold-btn"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "閉じる" : "詳しく見る"}
      </button>
      {open ? (
        <div className="jt-runner-detail">
          <DiagnosisNarrative item={item} answers={answers} />
          <JobTypeRecommendedJobs jobType={item.jobType} jobsUrl={item.jobsUrl} />
        </div>
      ) : null}
    </article>
  );
}

function RecommendedShopCard({ shop }: { shop: RecommendedDiagnosisShop }) {
  return (
    <article className="jt-shop-card">
      <div className="jt-shop-fav">
        <FavoriteButton jobId={shop.jobId} allowLineLoginRedirect />
      </div>
      <Link href={shop.detailUrl} className="jt-shop-link">
        <div className="jt-shop-image-wrap">
          {shop.imageUrl ? (
            <img
              src={shop.imageUrl}
              alt={`${shop.shopName}の求人｜${IMAGE_ALT_BRAND}`}
              className="jt-shop-image"
            />
          ) : (
            <div className="jt-shop-image-placeholder font-serif">White Night</div>
          )}
        </div>
        <div className="jt-shop-body">
          <h4 className="jt-shop-name font-serif">{shop.shopName}</h4>
          <p className="jt-shop-meta">
            <span>{shop.areaLabel}</span>
            <span aria-hidden> / </span>
            <span>{shop.jobType}</span>
          </p>
          {shop.salary ? <p className="jt-shop-salary">{shop.salary}</p> : null}
          {shop.tags.length > 0 ? (
            <ul className="jt-shop-tags">
              {shop.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
          {shop.reason ? <p className="jt-shop-reason">{shop.reason}</p> : null}
          <span className="jt-shop-cta">このお店を詳しく見る</span>
        </div>
      </Link>
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
  const { currentUser, isLoggedIn, ready } = useUserSession();
  const [recommendedShops, setRecommendedShops] = useState<RecommendedDiagnosisShop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [history, setHistory] = useState<SavedDiagnosisResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [applyTendency, setApplyTendency] = useState<
    | {
        status: "ready";
        percent: number;
        jobTypeLabel: string;
        cohortSize: number;
      }
    | { status: "insufficient" }
    | null
  >(null);
  const autoSavedRef = useRef<string | null>(null);

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

  const secondPlace = result.ranked[1] ?? result.topTwo[1];
  const preferredAreasLabel = formatPreferredAreasLabel(
    recommendationAnswers.preferredAreas,
  );

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

    await persistResult();
  }

  async function persistResult() {
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
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        history?: SavedDiagnosisResult[];
      };
      if (!response.ok) {
        throw new Error(data.message ?? "保存に失敗しました。");
      }
      if (data.history) {
        setHistory(data.history);
        writeUserCache("mypage:diagnosis", currentUser?.id, data.history);
      } else {
        invalidateUserCache("mypage:diagnosis");
      }
      setSaved(true);
      setMessage("診断結果をマイページに保存しました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const firstJobType = result.topTwo[0]?.jobType;
    if (!firstJobType) return;
    let cancelled = false;
    setApplyTendency(null);
    const params = new URLSearchParams({ firstJobType });
    fetch(`/api/job-type-diagnosis/apply-tendency?${params.toString()}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return { status: "insufficient" as const };
        return (await response.json()) as {
          status?: string;
          percent?: number;
          jobTypeLabel?: string;
          cohortSize?: number;
        };
      })
      .then((data) => {
        if (cancelled) return;
        if (
          data.status === "ready" &&
          typeof data.percent === "number" &&
          data.jobTypeLabel &&
          typeof data.cohortSize === "number"
        ) {
          setApplyTendency({
            status: "ready",
            percent: data.percent,
            jobTypeLabel: data.jobTypeLabel,
            cohortSize: data.cohortSize,
          });
          return;
        }
        setApplyTendency({ status: "insufficient" });
      })
      .catch(() => {
        if (!cancelled) setApplyTendency({ status: "insufficient" });
      });
    return () => {
      cancelled = true;
    };
  }, [result]);

  // ログイン中は診断完了時に自動保存する（同じ結果は1回だけ）
  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    if (autoSavedRef.current === result.diagnosedAt) return;
    autoSavedRef.current = result.diagnosedAt;
    void persistResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 結果ごとに1回だけ実行する
  }, [ready, isLoggedIn, result.diagnosedAt]);

  return (
    <div className="job-diagnosis-results job-diagnosis-results-visible">
      <p className="job-diagnosis-results-heading font-serif">診断結果</p>
      {preferredAreasLabel ? (
        <p className="job-diagnosis-preferred-areas">
          希望エリア：{preferredAreasLabel}
        </p>
      ) : null}

      <HeroResultCard item={result.topTwo[0]} />
      <DiagnosisNarrative item={result.topTwo[0]} answers={answers} />

      {secondPlace ? (
        <section className="jt-runners" aria-labelledby="jt-runners-heading">
          <h3 id="jt-runners-heading" className="jt-runners-title font-serif">
            第2位のおすすめ職種
          </h3>
          <div className="jt-runners-list">
            <RunnerUpCard rank={2} item={secondPlace} answers={answers} />
          </div>
        </section>
      ) : null}

      <section className="job-diagnosis-empathy-card" aria-labelledby="job-diagnosis-empathy-heading">
        <h3 id="job-diagnosis-empathy-heading" className="job-diagnosis-empathy-title font-serif">
          あなたと同じ診断結果だった方は...
        </h3>
        {applyTendency?.status === "ready" ? (
          <>
            <p className="job-diagnosis-empathy-stat">
              <span className="job-diagnosis-empathy-percent">{applyTendency.percent}%</span>
              が{applyTendency.jobTypeLabel}の応募ボタンを押しています
            </p>
            <p className="job-diagnosis-empathy-note">
              同じ診断結果の方 {applyTendency.cohortSize}人を集計。応募完了ではなく、応募ボタンのクリックです。
            </p>
          </>
        ) : (
          <>
            <p className="job-diagnosis-empathy-stat">
              <span className="job-diagnosis-empathy-percent">集計中</span>
            </p>
            <p className="job-diagnosis-empathy-note">
              同じ診断結果の応募ボタンクリックが足りないため、割合は表示していません。
            </p>
          </>
        )}
      </section>

      <section className="jt-shops" aria-labelledby="job-diagnosis-shops-heading">
        <h3 id="job-diagnosis-shops-heading" className="jt-shops-title font-serif">
          あなたにおすすめの店舗
        </h3>
        <p className="jt-shops-lead">診断結果から、あなたに合うお店をピックアップ</p>
        <p className="job-diagnosis-section-lead">
          {hasUserPreferredAreas
            ? "あなたの診断結果と希望エリアに合うお店をピックアップしました。"
            : "あなたの診断結果に合うお店を全エリアからピックアップしました。"}
        </p>

        {loadingShops ? (
          <p className="job-diagnosis-shops-loading">おすすめ店舗を読み込み中...</p>
        ) : recommendedShops.length > 0 ? (
          <div className="jt-shops-list">
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
          disabled={saving || saved || !ready}
          className="job-diagnosis-save-btn"
        >
          {saving ? "保存中..." : saved ? "保存しました" : "診断結果をLINEへ保存"}
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
    </div>
  );
}
