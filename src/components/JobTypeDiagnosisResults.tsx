"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JobTypeDiagnosisSharePanel } from "@/components/JobTypeDiagnosisSharePanel";
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
import { pickRecommendedDiagnosisShops } from "@/lib/job-type-diagnosis-recommendations";
import { fetchJobs } from "@/lib/job-storage";
import { startLiffLogin } from "@/lib/liff-auth-client";
import { buildWebLineLoginHref, logLiffDebug } from "@/lib/liff-login-intent";
import { MEMBER_PATHS } from "@/lib/member-access";
import { IMAGE_ALT_BRAND } from "@/lib/site";

function MedalCard({
  rank,
  item,
  delayMs,
}: {
  rank: 1 | 2;
  item: DiagnosisResultItem;
  delayMs: number;
}) {
  const medal = rank === 1 ? "🥇" : "🥈";
  const rankLabel = rank === 1 ? "第1位" : "第2位";

  return (
    <article
      className={`job-diagnosis-result-card job-diagnosis-result-card-rank-${rank}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="job-diagnosis-result-medal" aria-hidden>
        {medal}
      </div>
      <p className="job-diagnosis-result-rank">{rankLabel}</p>
      <h3 className="job-diagnosis-result-job font-serif">{item.jobType}</h3>

      <div className="job-diagnosis-result-meter-wrap">
        <p className="job-diagnosis-result-meter-label">適性</p>
        <div className="job-diagnosis-result-meter">
          <div
            className="job-diagnosis-result-meter-fill"
            style={{ width: `${item.percent}%` }}
          />
        </div>
        <p className="job-diagnosis-result-percent">{item.percent}%</p>
      </div>

      <div className="job-diagnosis-result-block">
        <p className="job-diagnosis-result-block-title">おすすめ理由</p>
        <p className="job-diagnosis-result-block-text">{item.reason}</p>
      </div>

      <div className="job-diagnosis-result-block">
        <p className="job-diagnosis-result-block-title">向いているポイント</p>
        <ul className="job-diagnosis-result-list">
          {item.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="job-diagnosis-result-block">
        <p className="job-diagnosis-result-block-title">メリット</p>
        <ul className="job-diagnosis-result-list">
          {item.merits.map((merit) => (
            <li key={merit}>{merit}</li>
          ))}
        </ul>
      </div>

      <div className="job-diagnosis-result-block job-diagnosis-result-block-caution">
        <p className="job-diagnosis-result-block-title">注意点</p>
        <ul className="job-diagnosis-result-list">
          {item.cautions.map((caution) => (
            <li key={caution}>{caution}</li>
          ))}
        </ul>
      </div>

      <Link href={item.jobsUrl} className="job-diagnosis-result-jobs-btn">
        この職種の求人を見る
      </Link>
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
        <p className="job-diagnosis-shop-reason">{shop.reason}</p>
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
  const { isLoggedIn, ready } = useUserSession();
  const [recommendedShops, setRecommendedShops] = useState<RecommendedDiagnosisShop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [history, setHistory] = useState<SavedDiagnosisResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const socialProof = getSocialProofApplyRate(result.topTwo[0].jobType);
  const primaryJobsUrl = buildDiagnosisJobsUrl(result.topTwo[0].jobType);
  const trialJobsUrl = buildDiagnosisTrialJobsUrl(result.topTwo[0].jobType);

  useEffect(() => {
    let cancelled = false;
    setLoadingShops(true);

    fetchJobs()
      .then((jobs) => {
        if (cancelled) return;
        setRecommendedShops(pickRecommendedDiagnosisShops(jobs, result, 3));
      })
      .finally(() => {
        if (!cancelled) setLoadingShops(false);
      });

    return () => {
      cancelled = true;
    };
  }, [result]);

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
        window.location.assign(buildWebLineLoginHref(redirect));
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

      <MedalCard rank={1} item={result.topTwo[0]} delayMs={80} />
      <MedalCard rank={2} item={result.topTwo[1]} delayMs={180} />

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
          診断結果に合わせて、あなたに合いそうなお店をピックアップしました。
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
          <p className="job-diagnosis-shops-empty">
            現在表示できるおすすめ店舗がありません。
            <Link href={primaryJobsUrl} className="job-diagnosis-inline-link">
              第1位の職種一覧
            </Link>
            からご覧ください。
          </p>
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
    </div>
  );
}
