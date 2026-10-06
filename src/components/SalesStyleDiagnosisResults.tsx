"use client";

import Link from "next/link";
import { useState } from "react";
import { useUserSession } from "@/components/UserSessionProvider";
import { startLiffLogin } from "@/lib/liff-auth-client";
import { logLiffDebug, navigateToWebLineOAuth } from "@/lib/liff-login-intent";
import { MEMBER_PATHS } from "@/lib/member-access";
import {
  buildSalesStyleJobsUrl,
  SALES_STYLE_PROFILES,
  type SalesStyleAnswers,
  type SalesStyleResult,
  type SavedSalesStyleResult,
} from "@/lib/sales-style-diagnosis";
import { writeUserCache } from "@/lib/user-data-cache";

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
  const jobsUrl = buildSalesStyleJobsUrl(result.mainType);

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
    <div className="job-diagnosis-results job-diagnosis-results-visible">
      <p className="job-diagnosis-results-heading font-serif">診断結果</p>

      <article
        className="job-diagnosis-result-card job-diagnosis-result-card-rank-1"
        style={{ animationDelay: "80ms" }}
      >
        <p className="job-diagnosis-result-rank">
          {sub ? "あなたの営業スタイルは（メインタイプ）" : "あなたの営業スタイルは"}
        </p>
        <h3 className="job-diagnosis-result-job font-serif">{main.name}</h3>
        <p className="sales-style-result-catch">{main.catchCopy}</p>

        <div className="job-diagnosis-result-block">
          <p className="job-diagnosis-result-block-title">特徴</p>
          <p className="job-diagnosis-result-block-text">{main.feature}</p>
        </div>

        <div className="job-diagnosis-result-block">
          <p className="job-diagnosis-result-block-title">向いている接客</p>
          <ul className="job-diagnosis-result-list">
            {main.services.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="job-diagnosis-result-block job-diagnosis-result-block-caution">
          <p className="job-diagnosis-result-block-title">苦手になりやすいこと</p>
          <ul className="job-diagnosis-result-list">
            {main.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="job-diagnosis-result-block">
          <p className="job-diagnosis-result-block-title">おすすめの働き方</p>
          <p className="job-diagnosis-result-block-text">{main.workStyle}</p>
        </div>

        <div className="job-diagnosis-result-block">
          <p className="job-diagnosis-result-block-title">相性の良い職種</p>
          <ul className="job-diagnosis-result-list">
            {main.jobTypes.map((jobType) => (
              <li key={jobType.label}>{jobType.label}</li>
            ))}
          </ul>
        </div>
      </article>

      {sub ? (
        <article className="job-diagnosis-result-card" style={{ animationDelay: "180ms" }}>
          <p className="job-diagnosis-result-rank">サブタイプ</p>
          <h3 className="job-diagnosis-result-job font-serif">{sub.name}</h3>
          <p className="sales-style-result-catch">{sub.catchCopy}</p>
          <div className="job-diagnosis-result-block">
            <p className="job-diagnosis-result-block-title">特徴</p>
            <p className="job-diagnosis-result-block-text">{sub.feature}</p>
          </div>
        </article>
      ) : null}

      <div className="job-diagnosis-actions">
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
      </div>

      <div className="job-diagnosis-secondary-actions">
        <button type="button" onClick={onReset} className="job-diagnosis-secondary-btn">
          もう一度診断する
        </button>
      </div>

      <Link href={jobsUrl} className="job-diagnosis-primary-cta">
        この営業スタイルに合う求人を見る
      </Link>
    </div>
  );
}
