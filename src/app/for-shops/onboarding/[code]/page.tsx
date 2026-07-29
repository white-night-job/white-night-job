"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formatPlanPriceLabel,
  JOB_PLANS,
  type JobPlan,
} from "@/lib/job-plan";

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none focus:border-gold";

type AppInfo = {
  shopName: string;
  applicationNumber: string;
  planLabel: string;
  onboardingCompleted: boolean;
  linkedJobId: string | null;
  confirmedPlan: JobPlan | null;
  requestedPlan: JobPlan;
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
  const [shopLoginId, setShopLoginId] = useState("");
  const [shopLoginPassword, setShopLoginPassword] = useState("");
  const [confirmedPlan, setConfirmedPlan] = useState<JobPlan>("standard");

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
          shopLoginId,
          shopLoginPassword,
          confirmedPlan,
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "登録に失敗しました。");
      setMessage(data.message ?? "登録が完了しました。");
      setApp((current) =>
        current
          ? { ...current, onboardingCompleted: true }
          : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-sm text-muted">
        招待コードを確認しています...
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-gold/30 bg-white p-6">
          <h1 className="font-serif text-xl text-charcoal">登録手続きに進めません</h1>
          <p className="mt-3 text-sm text-muted">{error}</p>
          <Link href="/for-shops" className="mt-4 inline-block text-sm text-gold-dark underline">
            掲載案内へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs tracking-[0.2em] text-gold-dark">ONBOARDING</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-charcoal">
        店舗・求人情報の登録
      </h1>
      <p className="mt-3 text-sm text-muted">
        審査承認済み店舗専用の登録画面です。ここで作成される求人は未公開の下書きです。
        公開・課金は管理者確認後に行います。
      </p>
      {app && (
        <p className="mt-2 text-sm text-charcoal">
          {app.shopName}（申請番号 {app.applicationNumber}）
        </p>
      )}

      {(message || error) && (
        <p className="mt-4 rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm">
          {message || error}
        </p>
      )}

      {app?.onboardingCompleted ? (
        <div className="mt-6 space-y-3 rounded-2xl border border-gold/25 bg-white p-5">
          <p className="text-sm text-charcoal">登録手続きは完了しています。</p>
          <Link
            href="/shop-login"
            className="inline-flex rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white"
          >
            店舗ログインへ
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-gold/25 bg-white p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">地区 *</label>
            <select className={inputClass} value={district} onChange={(e) => setDistrict(e.target.value)} required>
              <option value="">選択してください</option>
              {districts.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">職種 *</label>
            <select className={inputClass} value={jobType} onChange={(e) => setJobType(e.target.value)} required>
              <option value="">選択してください</option>
              {jobTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">求人タイトル</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
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
              {JOB_PLANS.map((plan) => (
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
          <div>
            <label className="mb-1.5 block text-sm font-medium">店舗ログインID *</label>
            <input className={inputClass} value={shopLoginId} onChange={(e) => setShopLoginId(e.target.value)} required minLength={4} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">店舗ログインパスワード *</label>
            <input className={inputClass} type="password" value={shopLoginPassword} onChange={(e) => setShopLoginPassword(e.target.value)} required minLength={6} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "登録中..." : "下書き求人を作成する"}
          </button>
        </form>
      )}
    </div>
  );
}
