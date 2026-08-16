"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formatPlanPriceLabel,
  PAID_JOB_PLANS,
  type PaidJobPlan,
} from "@/lib/job-plan";

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none focus:border-gold";

type AppInfo = {
  shopName: string;
  applicationNumber: string;
  planLabel: string;
  onboardingCompleted: boolean;
  linkedJobId: string | null;
  confirmedPlan: PaidJobPlan | null;
  requestedPlan: PaidJobPlan;
};

type IssuedCredentials = {
  shopLoginId: string;
  shopLoginPassword: string;
};

export default function ShopOnboardingPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [app, setApp] = useState<AppInfo | null>(null);
  const [districts, setDistricts] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [district, setDistrict] = useState("");
  const [jobType, setJobType] = useState("");
  const [salary, setSalary] = useState("");
  const [title, setTitle] = useState("");
  const [lineUrl, setLineUrl] = useState("");
  const [workHours, setWorkHours] = useState("");
  const [confirmedPlan, setConfirmedPlan] = useState<PaidJobPlan>("standard");
  const [issuedCredentials, setIssuedCredentials] =
    useState<IssuedCredentials | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/for-shops/onboarding/${code}`);
        const data = (await response.json()) as {
          message?: string;
          application?: AppInfo;
          districts?: string[];
          jobTypes?: string[];
        };
        if (!response.ok) throw new Error(data.message ?? "確認に失敗しました。");
        if (cancelled) return;
        setApp(data.application ?? null);
        setDistricts(data.districts ?? []);
        setJobTypes(data.jobTypes ?? []);
        const plan =
          data.application?.confirmedPlan ||
          data.application?.requestedPlan ||
          "standard";
        setConfirmedPlan(plan);
        if (data.application?.shopName) {
          setTitle(`${data.application.shopName}の求人`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "確認に失敗しました。");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/for-shops/onboarding/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district,
          jobType,
          salary,
          title,
          lineUrl,
          workHours,
          confirmedPlan,
        }),
      });
      const data = (await response.json()) as {
        message?: string;
        issuedCredentials?: IssuedCredentials;
      };
      if (!response.ok) throw new Error(data.message ?? "登録に失敗しました。");
      setMessage(data.message ?? "登録が完了しました。");
      if (data.issuedCredentials) {
        setIssuedCredentials(data.issuedCredentials);
      }
      setApp((prev) =>
        prev ? { ...prev, onboardingCompleted: true } : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-muted">
        確認中...
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-serif text-2xl text-gold-dark">店舗登録手続き</h1>
      {app && (
        <p className="mt-2 text-sm text-muted">
          {app.shopName}（申請番号: {app.applicationNumber}）／{app.planLabel}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-sm text-charcoal">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {issuedCredentials && (
        <div className="mt-6 space-y-3 rounded-2xl border border-gold/40 bg-white p-5 shadow-gold">
          <p className="text-sm font-semibold text-gold-dark">店舗ログイン情報</p>
          <p className="text-xs text-muted">
            この画面を閉じると再表示できません。必ず控えてください。管理者画面からも確認できます。
          </p>
          <div>
            <p className="text-xs text-muted">ログインID</p>
            <p className="mt-1 break-all font-mono text-base text-charcoal">
              {issuedCredentials.shopLoginId}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">パスワード</p>
            <p className="mt-1 break-all font-mono text-base text-charcoal">
              {issuedCredentials.shopLoginPassword}
            </p>
          </div>
          <Link
            href="/shop-login"
            className="inline-flex rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white"
          >
            店舗ログインへ
          </Link>
        </div>
      )}

      {app?.onboardingCompleted && !issuedCredentials ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted">
            すでに登録手続き済みです。店舗ログインからダッシュボードをご利用ください。
          </p>
          <Link
            href="/shop-login"
            className="inline-flex rounded-full border border-gold/40 px-5 py-2.5 text-sm font-semibold text-gold-dark"
          >
            店舗ログインへ
          </Link>
        </div>
      ) : !issuedCredentials ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">求人タイトル</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">地区 *</label>
            <select className={inputClass} value={district} onChange={(e) => setDistrict(e.target.value)} required>
              <option value="">選択してください</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">職種 *</label>
            <select className={inputClass} value={jobType} onChange={(e) => setJobType(e.target.value)} required>
              <option value="">選択してください</option>
              {jobTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">時給 *</label>
            <input className={inputClass} value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="例：時給2,000円〜" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">勤務時間</label>
            <input className={inputClass} value={workHours} onChange={(e) => setWorkHours(e.target.value)} placeholder="例：20:00〜LAST" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">LINE応募URL *</label>
            <input className={inputClass} value={lineUrl} onChange={(e) => setLineUrl(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">最終プラン（仮確定）</label>
            <div className="space-y-2">
              {PAID_JOB_PLANS.map((plan) => (
                <label key={plan} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={confirmedPlan === plan}
                    onChange={() => setConfirmedPlan(plan)}
                  />
                  {formatPlanPriceLabel(plan)}
                </label>
              ))}
            </div>
          </div>
          <p className="rounded-xl border border-gold/25 bg-ivory/80 px-3 py-2 text-xs text-muted">
            店舗ログインID・パスワードは登録完了時に自動発行されます。
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "登録中..." : "下書き求人を作成する"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
